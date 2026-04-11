export function resolveImageUrl(rawUrl, { fallback = '/placeholder-food.svg', baseUrl = '' } = {}) {
  if (typeof rawUrl !== 'string') return fallback;

  const url = rawUrl.trim();
  if (!url) return fallback;

  if (url.startsWith('data:image/')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (/^http:\/\//i.test(url)) return url.replace(/^http:\/\//i, 'https://');
  if (/^https?:\/\//i.test(url)) return url;

  if (!baseUrl) return url;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  if (url.startsWith('/')) return `${normalizedBase}${url}`;
  return `${normalizedBase}/${url.replace(/^\/+/, '')}`;
}

export function withFallbackSrc(fallback = '/placeholder-food.svg') {
  return (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallback;
  };
}
