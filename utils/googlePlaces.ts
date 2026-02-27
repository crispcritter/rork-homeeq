const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

console.log('[GooglePlaces] API key loaded:', GOOGLE_PLACES_API_KEY ? `${GOOGLE_PLACES_API_KEY.substring(0, 8)}...` : '(EMPTY)');

export interface PlaceResult {
  id: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  businessStatus: string | null;
  types: string[];
}

interface PlaceApiResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    rating?: number;
    userRatingCount?: number;
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    businessStatus?: string;
    types?: string[];
    location?: { latitude: number; longitude: number };
  }>;
}

export async function searchPlaces(
  query: string,
  location: string,
  radiusMiles: number,
): Promise<PlaceResult[]> {
  const textQuery = `${query} near ${location}`;
  const radiusMeters = Math.round(radiusMiles * 1609.34);

  console.log('[GooglePlaces] Searching:', textQuery, 'radius:', radiusMeters, 'm');
  console.log('[GooglePlaces] API key at call time:', GOOGLE_PLACES_API_KEY ? `${GOOGLE_PLACES_API_KEY.substring(0, 8)}...` : '(EMPTY)');

  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key is not configured. Check EXPO_PUBLIC_GOOGLE_PLACES_API_KEY.');
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.rating',
    'places.userRatingCount',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.businessStatus',
    'places.types',
    'places.location',
  ].join(',');

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 25,
        locationBias: {
          circle: {
            radius: Math.min(radiusMeters, 50000),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GooglePlaces] API error:', response.status, errorText);
      if (response.status === 403) {
        throw new Error('API key is restricted or invalid. Check your Google Cloud Console API key settings.');
      }
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data: PlaceApiResponse = await response.json();
    console.log('[GooglePlaces] Got', data.places?.length ?? 0, 'results');

    if (!data.places) return [];

    return data.places.map((place) => ({
      id: place.id,
      name: place.displayName?.text ?? 'Unknown Business',
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
      address: place.formattedAddress ?? '',
      phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
      email: null,
      website: place.websiteUri ?? null,
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      businessStatus: place.businessStatus ?? null,
      types: place.types ?? [],
    }));
  } catch (error) {
    console.error('[GooglePlaces] Search failed:', error);
    throw error;
  }
}
