// Proxy external images through our edge function to bypass hotlink protection
export function getProxiedImageUrl(imageUrl: string): string {
  // Only proxy external URLs (legacydhaka.com etc.)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }
  }
  // Local/imported images pass through
  return imageUrl;
}
