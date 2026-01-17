// Core platform module for SEO, ads, and performance
class AdultVideoPlatform {
  constructor() {
    this.config = {
      adDensity: 0.15, // 15% ad density
      autoPlayPreview: true,
      sessionStart: Date.now(),
      scrollDepth: 0,
      viewedVideos: new Set()
    };
    
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
  
  async handleAgeGate() {
    const gate = document.getElementById('age-gate');
    const enterBtn = document.getElementById('enter-btn');
    
    return new Promise((resolve) => {
      enterBtn.addEventListener('click', () => {
        // Set session cookie
        document.cookie = "age_verified=true; max-age=2592000; path=/; SameSite=Lax";
        
        // Hide gate
        gate.style.opacity = '0';
        setTimeout(() => {
          gate.style.display = 'none';
          document.querySelector('.header').style.display = 'block';
          resolve();
        }, 300);
      });
    });
  }
  
  async loadPageData() {
    const path = this.getCurrentPath();
    const url = `/api/videos/${path}${window.location.search}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Render videos
      this.renderVideoGrid(data.videos);
      
      // Update SEO
      this.updateSEO(data.seo);
      
      // Setup ads
      this.renderAds(data.adSlots);
      
      // Add structured data
      this.addStructuredData(data.structuredData);
      
      // Add internal links
      this.addInternalLinks(data.internalLinks);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      this.loadFallbackContent();
    }
  }
  
  renderVideoGrid(videos) {
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    
    videos.forEach((video, index) => {
      // Insert ad every 10 videos
      if (index > 0 && index % 10 === 0) {
        grid.appendChild(this.createAdSlot('infeed', index));
      }
      
      const card = this.createVideoCard(video);
      grid.appendChild(card);
    });
    
    // Lazy load images
    this.lazyLoadImages();
  }
  
  createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.videoId = video.id;
    
    // Generate semantic slug
    const slug = this.generateSlug(video.title);
    
    card.innerHTML = `
      <a href="/video/${video.id}/${slug}" class="video-link" data-prevent-default>
        <div class="thumbnail">
          <img 
            data-src="${video.thumbnail}" 
            alt="${video.title} - HD video preview"
            loading="lazy"
            width="300"
            height="180"
          >
          <div class="preview-overlay">▶</div>
          <div class="duration">${video.duration}</div>
        </div>
        <div class="video-info">
          <h3 class="video-title">${video.title}</h3>
          <div class="video-meta">
            <span>${video.views} views</span>
            <span>${video.rating}★</span>
          </div>
        </div>
      </a>
    `;
    
    // Add interaction
    card.addEventListener('mouseenter', () => this.handleVideoHover(video));
    card.addEventListener('click', (e) => this.handleVideoClick(e, video));
    
    return card;
  }
  
  initAdStack() {
    // Load appropriate ad network based on geo
    const geo = this.getUserGeo();
    const adScript = this.selectAdNetwork(geo);
    
    // Load ad script
    this.loadScript(adScript.url).then(() => {
      // Initialize ads after script loads
      if (window[adScript.init]) {
        window[adScript.init]({
          pageKeywords: this.extractKeywords(),
          device: this.getDeviceType(),
          adDensity: this.config.adDensity
        });
      }
    });
    
    // Setup ad refresh
    setInterval(() => this.refreshAds(), 30000);
  }
  
  selectAdNetwork(geo) {
    const networks = {
      us: {
        url: 'https://cdn.adnetwork1.com/loader.js',
        init: 'initAdNetwork1',
        cpm: 'high'
      },
      eu: {
        url: 'https://cdn.adnetwork2.com/tag.js',
        init: 'initAdNetwork2',
        cpm: 'medium'
      },
      default: {
        url: 'https://cdn.fallbackad.com/ads.js',
        init: 'initFallbackAds',
        cpm: 'low'
      }
    };
    
    return networks[geo] || networks.default;
  }
  
  updateSEO(seoData) {
    // Update meta tags
    document.title = seoData.title;
    document.querySelector('meta[name="description"]').content = seoData.description;
    document.querySelector('link[rel="canonical"]').href = seoData.canonical;
    
    // Update H1
    document.getElementById('page-h1').textContent = seoData.h1;
    document.getElementById('seo-description').textContent = seoData.description;
    
    // Update breadcrumb
    this.updateBreadcrumb();
  }
  
  updateBreadcrumb() {
    const path = window.location.pathname.split('/').filter(p => p);
    const breadcrumb = document.getElementById('breadcrumb');
    
    let html = '<a href="/">Home</a>';
    let currentPath = '';
    
    path.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (index < path.length - 1) {
        html += ` <span>›</span> <a href="${currentPath}">${name}</a>`;
      } else {
        html += ` <span>›</span> ${name}`;
      }
    });
    
    breadcrumb.innerHTML = html;
  }
  
  addStructuredData(data) {
    const script = document.getElementById('structured-data');
    
    // VideoObject schema for each video
    const videoSchemas = data.videos.map(video => ({
      "@type": "VideoObject",
      "name": video.title,
      "description": video.description || `${video.title} - HD video`,
      "thumbnailUrl": video.thumbnail,
      "uploadDate": video.date,
      "duration": video.duration,
      "contentUrl": video.embedUrl,
      "embedUrl": video.embedUrl
    }));
    
    // FAQ schema
    const faqSchema = {
      "@type": "FAQPage",
      "mainEntity": data.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
    
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [...videoSchemas, faqSchema]
    };
    
    script.textContent = JSON.stringify(structuredData);
  }
  
  setupVideoPreviews() {
    if (!this.config.autoPlayPreview) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.playPreview(entry.target);
        } else {
          this.stopPreview(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    // Observe all video thumbnails
    document.querySelectorAll('.thumbnail').forEach(thumb => {
      observer.observe(thumb);
    });
  }
  
  playPreview(thumbnail) {
    const videoId = thumbnail.closest('.video-card').dataset.videoId;
    
    // Load preview via iframe
    const previewOverlay = thumbnail.querySelector('.preview-overlay');
    previewOverlay.style.display = 'flex';
    
    // Simulate preview (actual implementation would use iframe)
    setTimeout(() => {
      previewOverlay.textContent = '▶ Preview Playing...';
    }, 300);
  }
  
  setupInfiniteScroll() {
    let loading = false;
    
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      this.config.scrollDepth = Math.max(this.config.scrollDepth, scrollPercent);
      
      // Load more at 80% scroll
      if (scrollPercent > 80 && !loading) {
        this.loadMoreContent();
      }
      
      // Trigger sticky footer ad at 90%
      if (scrollPercent > 90) {
        document.getElementById('sticky-footer-ad').style.display = 'block';
      }
    });
  }
  
  async loadMoreContent() {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    const nextPage = currentPage + 1;
    
    // Update URL without reload
    const newUrl = `${window.location.pathname}?page=${nextPage}`;
    window.history.pushState({}, '', newUrl);
    
    // Load next page
    await this.loadPageData();
  }
  
  setupAdTriggers() {
    // Scroll-based ad injection
    const adPositions = [0.3, 0.6, 0.9]; // 30%, 60%, 90% scroll depth
    
    adPositions.forEach(position => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.injectScrollAd(position);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      // Create trigger element
      const trigger = document.createElement('div');
      trigger.style.height = '1px';
      trigger.style.position = 'absolute';
      trigger.style.top = `${position * 100}vh`;
      document.body.appendChild(trigger);
      
      observer.observe(trigger);
    });
  }
  
  injectScrollAd(position) {
    const adTypes = ['native', 'video', 'banner'];
    const adType = adTypes[Math.floor(Math.random() * adTypes.length)];
    
    const adContainer = document.createElement('div');
    adContainer.className = `scroll-ad ad-${position}`;
    adContainer.innerHTML = `<div class="ad-placeholder" data-type="${adType}"></div>`;
    
    document.getElementById('video-grid').appendChild(adContainer);
    
    // Load ad
    this.loadAd(adType, adContainer.querySelector('.ad-placeholder'));
  }
  
  // Utility methods
  getCurrentPath() {
    return window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'home';
  }
  
  getUserGeo() {
    // Get from cookie or API
    return navigator.language.split('-')[1]?.toLowerCase() || 'us';
  }
  
  getDeviceType() {
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  }
  
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }
  
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => observer.observe(img));
  }
  
  monitorCLS() {
    let cls = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      
      if (cls > 0.05) {
        console.warn('CLS high:', cls);
        this.adjustLayoutStability();
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }
  
  monitorLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry.startTime > 1500) {
        console.warn('LCP slow:', lastEntry.startTime);
        this.optimizeLCP();
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }
  
  adjustLayoutStability() {
    // Reserve space for dynamic content
    document.querySelectorAll('.ad-placeholder').forEach(el => {
      el.style.minHeight = el.style.minHeight || '90px';
    });
  }
  
  optimizeLCP() {
    // Preload critical resources
    const lcpElement = document.querySelector('.video-grid') || document.querySelector('.header');
    if (lcpElement) {
      // Ensure LCP element is visible quickly
      lcpElement.style.contentVisibility = 'auto';
    }
  }
  
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// Initialize platform when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.Platform = new AdultVideoPlatform();
});

// Export for Netlify Functions
if (typeof module !== 'undefined') {
  module.exports = { AdultVideoPlatform };
}