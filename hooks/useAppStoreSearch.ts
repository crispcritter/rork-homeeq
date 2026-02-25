import { useQuery } from '@tanstack/react-query';

export interface AppStoreResult {
  trackId: number;
  trackName: string;
  artworkUrl100: string;
  artworkUrl512: string;
  sellerName: string;
  trackViewUrl: string;
  averageUserRating?: number;
  userRatingCount?: number;
  formattedPrice?: string;
  description?: string;
  screenshotUrls?: string[];
}

async function searchAppStore(name: string, brand: string): Promise<AppStoreResult | null> {
  const queries = [
    `${brand} ${name}`,
    brand,
  ];

  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed) continue;

    try {
      const encoded = encodeURIComponent(trimmed);
      const url = `https://itunes.apple.com/search?term=${encoded}&entity=software&limit=5`;
      console.log('[useAppStoreSearch] Searching:', url);

      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('[useAppStoreSearch] Found app:', result.trackName);
        return {
          trackId: result.trackId,
          trackName: result.trackName,
          artworkUrl100: result.artworkUrl100 ?? '',
          artworkUrl512: result.artworkUrl512 ?? result.artworkUrl100 ?? '',
          sellerName: result.sellerName ?? result.artistName ?? '',
          trackViewUrl: result.trackViewUrl ?? '',
          averageUserRating: result.averageUserRating,
          userRatingCount: result.userRatingCount,
          formattedPrice: result.formattedPrice,
          description: result.description,
          screenshotUrls: result.screenshotUrls,
        };
      }
    } catch (err) {
      console.log('[useAppStoreSearch] Error for query:', query, err);
    }
  }

  return null;
}

export function useAppStoreSearch(name: string, brand: string) {
  const enabled = !!(name.trim() || brand.trim());

  return useQuery<AppStoreResult | null>({
    queryKey: ['appStoreSearch', name, brand],
    queryFn: () => searchAppStore(name, brand),
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
