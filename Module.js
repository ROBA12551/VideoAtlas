// Core platform module - 広告関連部分のみ修正
class AdultVideoPlatform {
  constructor() {
    this.config = {
      adDensity: 0.15,
      autoPlayPreview: true,
      sessionStart: Date.now(),
      scrollDepth: 0,
      viewedVideos: new Set(),
      // 実際の広告ネットワーク設定
      adNetworks: {
        premium: [
          {
            name: 'Google Ad Manager',
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            init: 'googletag',
            geo: ['us', 'ca', 'uk', 'au']
          },
          {
            name: 'Index Exchange',
            url: 'https://cdn.adsafeprotected.com/iasPET.1.js',
            init: 'iasPET',
            geo: ['us', 'eu']
          }
        ],
        fallback: [
          {
            name: 'Prebid',
            url: 'https://cdn.jsdelivr.net/npm/prebid-js@latest/dist/prebid.js',
            init: 'pbjs',
            geo: ['all']
          }
        ]
      }
    };
    
    this.adSlots = {};
    this.init();
  }
  
  async init() {
    // Wait for age gate
    await this.handleAgeGate();
    
    // Load critical path
    await Promise.all([
      this.loadPageData(),
      this.initAdStack(),
      this.setupSEO()
    ]);
    
    // Setup interactions
    this.setupVideoPreviews();
    this.setupInfiniteScroll();
    this.setupAdTriggers();
    
    // Performance monitoring
    this.monitorCLS();
    this.monitorLCP();
  }
  
  async initAdStack() {
    const geo = this.getUserGeo();
    const device = this.getDeviceType();
    
    // Select appropriate ad network
    const network = this.selectAdNetwork(geo, device);
    
    try {
      // Load ad script
      await this.loadAdScript(network.url);
      
      // Initialize ad slots
      this.setupAdSlots(geo, device);
      
      console.log(`Ad network loaded: ${network.name}`);
    } catch (error) {
      console.warn('Primary ad network failed, loading fallback:', error);
      await this.loadFallbackAds();
    }
  }
  
  selectAdNetwork(geo, device) {
    // 地域に基づいて広告ネットワークを選択
    const premiumNetworks = this.config.adNetworks.premium.filter(n => 
      n.geo.includes(geo) || n.geo.includes('all')
    );
    
    if (premiumNetworks.length > 0) {
      // モバイルの場合はIASを優先
      if (device === 'mobile' && geo === 'us') {
        return premiumNetworks.find(n => n.name.includes('Index Exchange')) || premiumNetworks[0];
      }
      return premiumNetworks[0];
    }
    
    // フォールバックネットワーク
    return this.config.adNetworks.fallback[0];
  }
  
  async loadAdScript(url) {
    return new Promise((resolve, reject) => {
      // すでに読み込まれているか確認
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        console.warn(`Failed to load ad script: ${url}`);
        reject(new Error(`Failed to load: ${url}`));
      };
      document.head.appendChild(script);
      
      // タイムアウト設定
      setTimeout(() => {
        if (!script.loaded) {
          reject(new Error(`Timeout loading: ${url}`));
        }
      }, 5000);
    });
  }
  
  setupAdSlots(geo, device) {
    // Define ad slots
    const slots = [
      {
        id: 'native-ad-top',
        type: 'native',
        sizes: device === 'mobile' ? [[300, 250]] : [[728, 90], [970, 250]],
        targeting: {
          pos: 'top',
          geo: geo,
          device: device
        }
      },
      {
        id: 'infeed-ad',
        type: 'banner',
        sizes: [[300, 250], [336, 280]],
        targeting: {
          pos: 'middle',
          geo: geo,
          device: device
        }
      }
    ];
    
    // Initialize each slot
    slots.forEach(slot => {
      this.createAdSlot(slot);
    });
    
    // Refresh ads every 30 seconds
    setInterval(() => this.refreshAds(), 30000);
  }
  
  createAdSlot(slotConfig) {
    const container = document.getElementById(slotConfig.id);
    if (!container) return;
    
    // Store slot config
    this.adSlots[slotConfig.id] = {
      ...slotConfig,
      container: container,
      loaded: false,
      refreshCount: 0
    };
    
    // Remove fallback content
    const fallback = container.querySelector('.ad-fallback');
    if (fallback) {
      fallback.style.display = 'none';
    }
    
    // Load ad
    this.loadAdToSlot(slotConfig.id);
  }
  
  loadAdToSlot(slotId) {
    const slot = this.adSlots[slotId];
    if (!slot || slot.refreshCount >= 5) {
      this.showFallbackAd(slotId);
      return;
    }
    
    // 実際の広告実装は広告ネットワークに依存
    // ここでは模擬実装
    const adContent = this.generateMockAd(slot);
    slot.container.innerHTML = adContent;
    slot.loaded = true;
    slot.refreshCount++;
    
    // 広告インプレッション追跡
    this.trackAdImpression(slot);
  }
  
  generateMockAd(slot) {
    const ads = {
      native: [
        `<div style="padding: 15px; background: #2a2a2a; border-radius: 5px; width: 100%;">
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Sponsored</div>
          <div style="font-size: 16px; color: white; margin-bottom: 8px;">Premium Content Available</div>
          <div style="font-size: 14px; color: #aaa; margin-bottom: 10px;">Discover exclusive ${slot.targeting.geo.toUpperCase()} content</div>
          <a href="#" style="background: #ff4757; color: white; padding: 8px 15px; border-radius: 3px; text-decoration: none; display: inline-block;">Learn More</a>
        </div>`
      ],
      banner: [
        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="text-align: center; color: white; padding: 20px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">Advertisement</div>
            <div style="font-size: 14px;">Premium ${slot.targeting.geo.toUpperCase()} Content</div>
          </div>
        </div>`
      ]
    };
    
    const adList = ads[slot.type] || ads.banner;
    return adList[Math.floor(Math.random() * adList.length)];
  }
  
  async loadFallbackAds() {
    console.log('Loading fallback ad network');
    
    try {
      // Prebid.js as fallback
      await this.loadAdScript('https://cdn.jsdelivr.net/npm/prebid-js@latest/dist/prebid.js');
      
      // Setup fallback ad slots
      document.querySelectorAll('.ad-slot').forEach(slot => {
        const fallbackHtml = `
          <div style="padding: 15px; text-align: center;">
            <div style="color: #666; margin-bottom: 10px;">Advertisement</div>
            <div style="color: #4dabf7; font-size: 14px;">
              Premium content available. Refresh for ads.
            </div>
          </div>
        `;
        slot.innerHTML = fallbackHtml;
      });
    } catch (error) {
      console.error('All ad networks failed:', error);
      // Show static fallback
      this.showStaticFallbackAds();
    }
  }
  
  showStaticFallbackAds() {
    const staticAds = [
      {
        text: "Premium HD Collection",
        link: "#",
        color: "#667eea"
      },
      {
        text: "Exclusive Content",
        link: "#",
        color: "#764ba2"
      },
      {
        text: "HD Streaming",
        link: "#",
        color: "#f093fb"
      }
    ];
    
    document.querySelectorAll('.ad-slot').forEach(slot => {
      const ad = staticAds[Math.floor(Math.random() * staticAds.length)];
      slot.innerHTML = `
        <a href="${ad.link}" style="
          display: block; width: 100%; height: 100%;
          background: linear-gradient(135deg, ${ad.color} 0%, #667eea 100%);
          color: white; text-decoration: none; display: flex;
          align-items: center; justify-content: center; text-align: center;
          padding: 20px;
        ">
          <div>
            <div style="font-size: 16px; font-weight: bold;">${ad.text}</div>
            <div style="font-size: 12px; opacity: 0.8;">Advertisement</div>
          </div>
        </a>
      `;
    });
  }
  
  refreshAds() {
    // Refresh ads that are visible
    Object.keys(this.adSlots).forEach(slotId => {
      const slot = this.adSlots[slotId];
      if (this.isElementInViewport(slot.container)) {
        this.loadAdToSlot(slotId);
      }
    });
  }
  
  isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  trackAdImpression(slot) {
    // Send impression data to analytics
    const data = {
      slot: slot.id,
      type: slot.type,
      geo: slot.targeting.geo,
      device: slot.targeting.device,
      timestamp: Date.now()
    };
    
    // 実際の実装ではここで分析用のビーコンを送信
    console.log('Ad impression:', data);
  }
  
  // その他のメソッドは以前と同じ...
}

// Initialize platform when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.Platform = new AdultVideoPlatform();
  });
} else {
  window.Platform = new AdultVideoPlatform();
}