// seo-rules.js
const SEORules = {
  // URL Structure
  urlPatterns: {
    category: '/category/{main}/{sub?}/page-{page}',
    tag: '/tag/{keyword}/{modifier?}/page-{page}',
    performer: '/performer/{name}/page-{page}',
    trending: '/trending/{date}/page-{page}',
    video: '/video/{id}/{slug}'
  },
  
  // Meta Tag Generation
  generateMeta: (pageType, data) => {
    const templates = {
      category: {
        title: `Best ${data.category} Videos - ${data.page > 1 ? `Page ${data.page} | ` : ''}HD Collection`,
        description: `Browse our curated collection of ${data.category} videos. ${data.count} HD videos sorted by popularity. Updated daily.`,
        h1: `${data.category} Videos`,
        h2: `Page ${data.page} | Sorted by ${data.sort || 'Popularity'}`
      },
      tag: {
        title: `${data.tag} Videos - ${data.modifier ? `${data.modifier} ` : ''}${data.page > 1 ? `Page ${data.page} | ` : ''}HD`,
        description: `Watch ${data.tag} videos${data.modifier ? ` with ${data.modifier}` : ''}. ${data.count} videos available in HD.`,
        h1: `${data.tag} Videos${data.modifier ? `: ${data.modifier}` : ''}`,
        h2: `Page ${data.page} | Trending This Week`
      },
      performer: {
        title: `${data.name} Videos - Full Collection ${data.page > 1 ? `| Page ${data.page}` : ''}`,
        description: `Watch all ${data.name} videos in one place. Complete collection with ${data.count} HD videos.`,
        h1: `${data.name} Videos`,
        h2: `Complete Collection | Page ${data.page}`
      }
    };
    
    return templates[pageType] || templates.category;
  },
  
  // Internal Linking Strategy
  internalLinks: {
    minPerPage: 50,
    maxPerPage: 150,
    distribution: {
      sameCategory: 0.4,
      relatedTags: 0.3,
      popularVideos: 0.2,
      trending: 0.1
    }
  },
  
  // XML Sitemap Strategy
  sitemap: {
    shards: 20,
    maxUrlsPerSitemap: 50000,
    priority: {
      homepage: 1.0,
      categories: 0.9,
      trending: 0.8,
      tags: 0.7,
      performers: 0.6,
      videos: 0.5
    },
    changefreq: {
      homepage: 'hourly',
      trending: 'hourly',
      categories: 'daily',
      tags: 'weekly',
      performers: 'monthly',
      videos: 'monthly'
    }
  },
  
  // Indexing Strategy
  indexing: {
    canonicalRules: {
      // Ensure proper canonicalization
      trailingSlash: false,
      lowercase: true,
      removeUtm: true,
      pagination: 'rel=next/prev'
    },
    robotRules: {
      allow: [
        '/',
        '/category/*',
        '/tag/*',
        '/performer/*',
        '/trending/*'
      ],
      disallow: [
        '/api/*',
        '/admin/*',
        '/search?*',
        '/*?sort=*'
      ]
    }
  },
  
  // Freshness Signals
  freshness: {
    updateTriggers: [
      'new_videos_added',
      'trending_changes',
      'weekly_rotation'
    ],
    timestampFormats: {
      published: 'YYYY-MM-DD',
      modified: 'YYYY-MM-DDTHH:mm:ssZ'
    }
  }
};