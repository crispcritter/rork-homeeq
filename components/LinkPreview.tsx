import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { ExternalLink, Globe, X, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LinkMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  domain: string;
}

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return '';
  }
}

function isAmazonUrl(url: string): boolean {
  const domain = extractDomain(url).toLowerCase();
  return domain.includes('amazon.');
}

function getDisplayName(domain: string): string {
  const names: Record<string, string> = {
    'amazon.com': 'Amazon',
    'amazon.co.uk': 'Amazon UK',
    'amazon.ca': 'Amazon Canada',
    'amazon.de': 'Amazon Germany',
    'walmart.com': 'Walmart',
    'homedepot.com': 'The Home Depot',
    'lowes.com': "Lowe's",
    'target.com': 'Target',
    'ebay.com': 'eBay',
    'costco.com': 'Costco',
    'menards.com': 'Menards',
    'acehardware.com': 'Ace Hardware',
    'bestbuy.com': 'Best Buy',
  };
  return names[domain] ?? domain;
}

function getBrandColor(domain: string): string | null {
  const colors: Record<string, string> = {
    'amazon.com': '#FF9900',
    'amazon.co.uk': '#FF9900',
    'amazon.ca': '#FF9900',
    'amazon.de': '#FF9900',
    'walmart.com': '#0071CE',
    'homedepot.com': '#F96302',
    'lowes.com': '#004990',
    'target.com': '#CC0000',
    'ebay.com': '#E53238',
    'costco.com': '#E31837',
    'bestbuy.com': '#0046BE',
    'acehardware.com': '#D40029',
    'menards.com': '#2E8540',
  };
  return colors[domain] ?? null;
}

function extractMetaFromHtml(html: string, url: string): LinkMeta {
  const domain = extractDomain(url);
  const meta: LinkMeta = { domain };

  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogTitle?.[1]) meta.title = decodeHtmlEntities(ogTitle[1]);

  if (!meta.title) {
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleTag?.[1]) meta.title = decodeHtmlEntities(titleTag[1].trim());
  }

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  if (ogDesc?.[1]) meta.description = decodeHtmlEntities(ogDesc[1]);

  if (!meta.description) {
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (metaDesc?.[1]) meta.description = decodeHtmlEntities(metaDesc[1]);
  }

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImage?.[1]) {
    let imgUrl = ogImage[1];
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    meta.image = imgUrl;
  }

  const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
  if (ogSite?.[1]) meta.siteName = decodeHtmlEntities(ogSite[1]);

  meta.favicon = getFaviconUrl(url);

  return meta;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

function cleanTitle(title: string, domain: string): string {
  const suffixes = [
    ` - ${getDisplayName(domain)}`,
    ` | ${getDisplayName(domain)}`,
    ` : ${getDisplayName(domain)}`,
    ' - Amazon.com',
    ' | Amazon.com',
    ' : Amazon.com',
  ];
  let cleaned = title;
  for (const suffix of suffixes) {
    if (cleaned.toLowerCase().endsWith(suffix.toLowerCase())) {
      cleaned = cleaned.slice(0, -suffix.length);
    }
  }
  return cleaned.length > 120 ? cleaned.slice(0, 117) + '...' : cleaned;
}

const LinkPreview = React.memo(function LinkPreview({ url, onRemove }: LinkPreviewProps) {
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const fetchMeta = async () => {
      console.log('[LinkPreview] Fetching metadata for:', url);
      setLoading(true);
      setImageError(false);
      setFaviconError(false);

      const domain = extractDomain(url);
      const fallback: LinkMeta = {
        domain,
        title: getDisplayName(domain),
        favicon: getFaviconUrl(url),
      };

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!cancelled && response.ok) {
          const html = await response.text();
          const extracted = extractMetaFromHtml(html, url);
          if (extracted.title) {
            extracted.title = cleanTitle(extracted.title, domain);
          }
          console.log('[LinkPreview] Extracted metadata:', {
            title: extracted.title,
            description: extracted.description?.slice(0, 50),
            hasImage: !!extracted.image,
          });
          if (!cancelled) {
            setMeta(extracted);
          }
        } else if (!cancelled) {
          console.log('[LinkPreview] Fetch failed, using fallback');
          setMeta(fallback);
        }
      } catch (err) {
        console.log('[LinkPreview] Fetch error (expected for CORS):', (err as Error).message);
        if (!cancelled) {
          setMeta(fallback);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    fadeAnim.setValue(0);
    fetchMeta();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const handlePress = useCallback(() => {
    console.log('[LinkPreview] Opening URL:', url);
    Linking.openURL(url).catch((err) => {
      console.error('[LinkPreview] Failed to open URL:', err);
    });
  }, [url]);

  const domain = extractDomain(url);
  const brandColor = getBrandColor(domain);
  const isAmazon = isAmazonUrl(url);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingShimmer}>
          <ActivityIndicator size="small" color={Colors.textTertiary} />
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      </View>
    );
  }

  if (!meta) return null;

  const hasImage = !!meta.image && !imageError;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[
          styles.card,
          brandColor ? { borderLeftColor: brandColor, borderLeftWidth: 3 } : null,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        testID="link-preview-card"
      >
        {hasImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: meta.image }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}

        <View style={styles.contentRow}>
          <View style={styles.faviconWrap}>
            {!faviconError && meta.favicon ? (
              <Image
                source={{ uri: meta.favicon }}
                style={styles.favicon}
                onError={() => setFaviconError(true)}
              />
            ) : isAmazon ? (
              <ShoppingBag size={16} color={brandColor ?? Colors.textSecondary} />
            ) : (
              <Globe size={16} color={brandColor ?? Colors.textSecondary} />
            )}
          </View>

          <View style={styles.textContent}>
            <View style={styles.siteRow}>
              <Text
                style={[styles.siteName, brandColor ? { color: brandColor } : null]}
                numberOfLines={1}
              >
                {meta.siteName ?? getDisplayName(domain)}
              </Text>
              <ExternalLink size={11} color={Colors.textTertiary} />
            </View>

            {meta.title && meta.title !== getDisplayName(domain) ? (
              <Text style={styles.title} numberOfLines={2}>
                {meta.title}
              </Text>
            ) : null}

            {meta.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {meta.description}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {onRemove && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          hitSlop={8}
          testID="link-preview-remove"
        >
          <X size={12} color={Colors.textTertiary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

export default LinkPreview;

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
  },
  loadingContainer: {
    marginBottom: 4,
  },
  loadingShimmer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  faviconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  favicon: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  textContent: {
    flex: 1,
    paddingRight: 16,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  siteName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  removeBtn: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
