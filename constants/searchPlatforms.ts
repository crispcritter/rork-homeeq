export interface SearchPlatform {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  buildUrl: (query: string, location: string, radius: number) => string;
}

export const SEARCH_PLATFORMS: SearchPlatform[] = [
  {
    id: 'angi',
    name: 'Angi',
    color: '#FF6138',
    bgColor: '#FFF0EB',
    buildUrl: (query, location) =>
      `https://www.angi.com/companylist/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}.htm?postalCode=${encodeURIComponent(location)}`,
  },
  {
    id: 'thumbtack',
    name: 'Thumbtack',
    color: '#009FD9',
    bgColor: '#E6F6FC',
    buildUrl: (query, location) =>
      `https://www.thumbtack.com/search/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}?zip_code=${encodeURIComponent(location)}`,
  },
  {
    id: 'yelp',
    name: 'Yelp',
    color: '#D32323',
    bgColor: '#FDEAEA',
    buildUrl: (query, location, radius) => {
      const miToMeters = Math.round(radius * 1609.34);
      return `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(location)}&attrs=distance:${miToMeters}`;
    },
  },
  {
    id: 'google',
    name: 'Google',
    color: '#4285F4',
    bgColor: '#EBF3FE',
    buildUrl: (query, location, radius) =>
      `https://www.google.com/search?q=${encodeURIComponent(`${query} near ${location} within ${radius} miles`)}`,
  },
];
