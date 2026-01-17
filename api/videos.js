// Edge function for video data aggregation
export default async (request, context) => {
  const url = new URL(request.url);
  const cache = caches.default;
  
  // Cache key based on request
  const cacheKey = new Request(url.toString(), request);
  const cached = await cache.match(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Extract route parameters
  const path = url.pathname.replace('/api/videos/', '');
  const params = {
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '30',
    country: context.geo?.country?.toLowerCase() || 'us',
    device: request.headers.get('sec-ch-ua-mobile') ? 'mobile' : 'desktop'
  };
  
  // Route handling
  let data = {};
  
  if (path.startsWith('category/')) {
    data = await handleCategory(path, params);
  } else if (path.startsWith('tag/')) {
    data = await handleTag(path, params);
  } else if (path.startsWith('performer/')) {
    data = await handlePerformer(path, params);
  } else if (path.startsWith('trending/')) {
    data = await handleTrending(path, params);
  } else if (path.startsWith('search/')) {
    data = await handleSearch(path, params);
  } else {
    data = await handleHomepage(params);
  }
  
  // Inject ad slots
  data.adSlots = generateAdSlots(params);
  
  // Generate SEO metadata
  data.seo = generateSEOMetadata(path, params, data.videos);
  
  // Generate structured data
  data.structuredData = generateStructuredData(data.videos);
  
  // Generate internal links
  data.internalLinks = generateInternalLinks(data.videos, path);
  
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      'CDN-Cache-Control': 'public, max-age=7200',
      'Vary': 'Accept-Encoding, Country, Device'
    }
  });
  
  // Store in cache
  context.waitUntil(cache.put(cacheKey, response.clone()));
  
  return response;
};

// Helper functions
async function handleCategory(path, params) {
  const [_, main, sub] = path.split('/');
  const sources = [
    `https://api.source1.com/videos?category=${main}&page=${params.page}`,
    `https://api.source2.com/feed?cat=${main}&sub=${sub || ''}`
  ];
  
  const responses = await Promise.allSettled(
    sources.map(src => fetchWithTimeout(src, 2000))
  );
  
  // Merge and normalize data
  return normalizeVideoData(responses);
}

function generateAdSlots(params) {
  const slots = [];
  const adNetworks = {
    us: ['network1', 'network2', 'native'],
    eu: ['network2', 'network3', 'native'],
    default: ['network3', 'fallback']
  };
  
  const networks = adNetworks[params.country] || adNetworks.default;
  
  // Top native ad
  slots.push({
    id: 'native-ad-top',
    type: 'native',
    network: networks[0],
    dimensions: '1200x250',
    refresh: 30
  });
  
  // In-feed ad (every 10 videos)
  slots.push({
    id: 'infeed-ad',
    type: 'banner',
    network: networks[1],
    dimensions: params.device === 'mobile' ? '300x250' : '728x90',
    position: 10
  });
  
  // Sticky footer
  slots.push({
    id: 'sticky-footer-ad',
    type: 'sticky',
    network: networks[2],
    trigger: 'scroll>80%',
    dimensions: '320x50'
  });
  
  return slots;
}

function generateSEOMetadata(path, params, videos) {
  const baseTitle = "Premium Video Collection | HD Content";
  const descriptions = {
    category: `Browse ${params.page} ${videos[0]?.category} videos in HD`,
    tag: `Best ${params.page} ${videos[0]?.tags?.[0]} videos curated`,
    trending: `Trending videos updated hourly for ${params.country}`,
    default: `HD video collection with daily updates`
  };
  
  return {
    title: `${baseTitle} - Page ${params.page}`,
    description: descriptions[path.split('/')[0]] || descriptions.default,
    canonical: `https://domain.com/${path}?page=${params.page}`,
    h1: `${videos[0]?.category || 'Popular'} Videos`,
    h2: `Page ${params.page} | Sorted by Popularity`
  };
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response.json();
  } catch (error) {
    return null;
  }
}