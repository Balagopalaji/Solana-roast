interface MetadataOptions {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

class MetadataService {
  private static instance: MetadataService;
  private defaultMetadata: MetadataOptions = {
    title: 'Solana Wallet Roast',
    description: 'Get your Solana wallet roasted! 🔥',
    url: window.location.origin
  };

  private constructor() {}

  static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService();
    }
    return MetadataService.instance;
  }

  updateMetadata({ title, description, image, url }: Partial<MetadataOptions>) {
    // Update OpenGraph tags
    this.setMetaTag('og:title', title || this.defaultMetadata.title);
    this.setMetaTag('og:description', description || this.defaultMetadata.description);
    this.setMetaTag('og:url', url || window.location.href);
    if (image) this.setMetaTag('og:image', image);

    // Update Twitter Card tags
    this.setMetaTag('twitter:card', 'summary_large_image');
    this.setMetaTag('twitter:title', title || this.defaultMetadata.title);
    this.setMetaTag('twitter:description', description || this.defaultMetadata.description);
    if (image) this.setMetaTag('twitter:image', image);
  }

  private setMetaTag(property: string, content: string) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  }

  resetMetadata() {
    this.updateMetadata(this.defaultMetadata);
  }
}

export const metadataService = MetadataService.getInstance(); 