export default async (request, context) => {
  const geo = context.geo?.country?.toLowerCase() || 'us';
  const isMobile = request.headers.get('sec-ch-ua-mobile') === '?1';
  
  // 地域とデバイスに基づいて広告設定を返す
  const adConfig = {
    networks: getAdNetworks(geo),
    slots: getAdSlots(geo, isMobile),
    refresh: 30,
    timeout: 3000
  };
  
  return new Response(JSON.stringify(adConfig), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

function getAdNetworks(geo) {
  const networks = {
    us: [
      'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
      'https://cdn.adsafeprotected.com/iasPET.1.js'
    ],
    eu: [
      'https://cdn.adnxs.com/ast/ast.js',
      'https://www.googletagservices.com/tag/js/gpt.js'
    ],
    default: [
      'https://cdn.jsdelivr.net/npm/prebid-js@latest/dist/prebid.js',
      'https://www.googletagservices.com/tag/js/gpt.js'
    ]
  };
  
  return networks[geo] || networks.default;
}

function getAdSlots(geo, isMobile) {
  const baseSlots = [
    {
      id: 'native-ad-top',
      type: 'native',
      sizes: isMobile ? ['300x250'] : ['728x90', '970x250']
    },
    {
      id: 'infeed-ad',
      type: 'banner',
      sizes: ['300x250', '336x280']
    }
  ];
  
  // 地域別の広告密度調整
  const density = {
    us: 0.18,
    eu: 0.15,
    default: 0.12
  };
  
  return {
    slots: baseSlots,
    density: density[geo] || density.default,
    geo: geo.toUpperCase()
  };
}