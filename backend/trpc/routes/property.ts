import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const propertyResultSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  homeType: z.string().optional(),
  yearBuilt: z.string().optional(),
  squareFootage: z.string().optional(),
  lotSize: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  stories: z.string().optional(),
});

export type PropertyResult = z.infer<typeof propertyResultSchema>;

function mapRealtorHomeType(rawType: string | undefined): string {
  if (!rawType) return 'single-family';
  const lower = rawType.toLowerCase();
  if (lower.includes('single') || lower.includes('house')) return 'single-family';
  if (lower.includes('town')) return 'townhouse';
  if (lower.includes('condo')) return 'condo';
  if (lower.includes('apartment') || lower.includes('apt')) return 'apartment';
  if (lower.includes('duplex') || lower.includes('multi')) return 'duplex';
  if (lower.includes('mobile') || lower.includes('manufactured')) return 'mobile-home';
  return 'other';
}

export const propertyRouter = createTRPCRouter({
  lookup: publicProcedure
    .input(
      z.object({
        address: z.string().min(3),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.REALTOR_RAPIDAPI_KEY;

      if (!apiKey) {
        console.log("[PropertyLookup] No REALTOR_RAPIDAPI_KEY configured");
        throw new Error("Property lookup service is not configured. Please add your Realtor.com RapidAPI key.");
      }

      const fullAddress = [
        input.address,
        input.city,
        input.state,
        input.zipCode,
      ]
        .filter(Boolean)
        .join(", ");

      console.log("[PropertyLookup] Looking up address via Realtor.com:", fullAddress);

      try {
        const searchResponse = await fetch(
          `https://realtor16.p.rapidapi.com/properties/search?query=${encodeURIComponent(fullAddress)}&limit=1`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "realtor16.p.rapidapi.com",
            },
          }
        );

        if (!searchResponse.ok) {
          console.log("[PropertyLookup] Search API error:", searchResponse.status);
          throw new Error("Failed to search for property. Please check your address and try again.");
        }

        const searchData = await searchResponse.json();
        console.log("[PropertyLookup] Search response keys:", Object.keys(searchData));

        const properties = searchData?.data?.results ?? searchData?.properties ?? searchData?.data?.home_search?.results ?? searchData?.results ?? [];
        console.log("[PropertyLookup] Search results count:", properties.length);

        if (!properties.length) {
          throw new Error("No property found at that address. Please verify and try again.");
        }

        const property = properties[0];
        const propertyId = property.property_id ?? property.id;
        console.log("[PropertyLookup] Found property_id:", propertyId);

        let detail = property;

        if (propertyId) {
          try {
            const detailResponse = await fetch(
              `https://realtor16.p.rapidapi.com/properties/detail?property_id=${propertyId}`,
              {
                method: "GET",
                headers: {
                  "x-rapidapi-key": apiKey,
                  "x-rapidapi-host": "realtor16.p.rapidapi.com",
                },
              }
            );

            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              detail = detailData?.data ?? detailData?.property ?? detailData ?? detail;
              console.log("[PropertyLookup] Property detail fetched successfully");
            } else {
              console.log("[PropertyLookup] Detail API returned:", detailResponse.status, "- using search data");
            }
          } catch (detailError) {
            console.log("[PropertyLookup] Detail fetch failed, using search data:", detailError);
          }
        }

        const location = detail.location ?? detail.address ?? {};
        const address = location.address ?? location;
        const description = detail.description ?? detail;

        const lotSqft = description.lot_sqft ?? detail.lot_sqft ?? description.lotSize;
        const lotAcres = lotSqft ? (parseFloat(String(lotSqft)) / 43560).toFixed(2) : "";

        const result: PropertyResult = {
          address: address.line ?? address.street_address ?? address.streetAddress ?? input.address,
          city: address.city ?? input.city ?? "",
          state: address.state_code ?? address.state ?? input.state ?? "",
          zipCode: address.postal_code ?? address.zipcode ?? input.zipCode ?? "",
          homeType: mapRealtorHomeType(description.type ?? detail.prop_type ?? detail.homeType),
          yearBuilt: (description.year_built ?? detail.year_built ?? "").toString(),
          squareFootage: (description.sqft ?? detail.sqft ?? description.livingArea ?? "").toString(),
          lotSize: lotAcres,
          bedrooms: (description.beds ?? detail.beds ?? "").toString(),
          bathrooms: (description.baths ?? detail.baths ?? "").toString(),
          stories: (description.stories ?? detail.stories ?? "").toString(),
        };

        console.log("[PropertyLookup] Returning property data:", JSON.stringify(result));
        return result;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("No property found")) {
          throw error;
        }
        if (error instanceof Error && error.message.includes("Failed to")) {
          throw error;
        }
        console.error("[PropertyLookup] Unexpected error:", error);
        throw new Error("Something went wrong looking up your property. Please try again.");
      }
    }),
});
