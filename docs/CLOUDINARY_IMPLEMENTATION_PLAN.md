# Cloudinary Integration Implementation Plan

## File Structure
### Current Structure
```
packages/frontend/
├── src/
│   ├── components/
│   │   ├── roast/
│   │   │   └── RoastDisplay.tsx
│   │   └── common/
│   │       └── Toast.tsx
│   ├── services/
│   │   └── share.service.ts
│   └── config/
│       └── environment.ts
```

### Proposed Structure
```
packages/frontend/
├── src/
│   ├── components/
│   │   ├── roast/
│   │   │   └── RoastDisplay.tsx
│   │   └── common/
│   │       └── Toast.tsx
│   ├── services/
│   │   ├── share.service.ts
│   │   ├── cloudinary.service.ts
│   │   └── __tests__/
│   │       ├── cloudinary.service.test.ts
│   │       └── share.service.test.ts
│   └── config/
│       └── environment.ts
```

## Progress Tracker
### Prerequisites
- [x] Created git tag "begin-cloudinary" as restoration point
- [x] Created feature branch `feat/cloudinary-env`
- [x] Cloudinary Account Setup
  - [x] Create free account
  - [x] Note down cloud name
  - [x] Create basic upload preset "roast-preset"
    - [x] Unsigned uploading enabled
    - [x] Use filename as public ID
    - [x] Append unique suffix
- [x] Environment Variables Ready
  - [x] .env files prepared
  - [x] Values obtained from Cloudinary dashboard

### Implementation Progress
- [✓] Prompt 1: Environment Setup
- [ ] Prompt 2: Cloudinary Service
- [ ] Prompt 3: Share Service Integration
- [ ] Prompt 4: Component Integration
- [ ] Prompt 5: Testing
- [ ] Prompt 6: Monitoring

## Implementation Prompts

### Validation Guidelines
Each prompt should be validated before proceeding:
1. Run `npm test` to ensure no regressions
2. Check browser console for errors
3. Verify feature flag behavior
4. Test fallback scenarios
5. Validate TypeScript compilation
6. Run `npm run verify` to check backend connectivity

### Safety Measures
1. Git tag "begin-cloudinary" has been created as restoration point
2. Each step should be done in a feature branch
3. No changes to existing share functionality until new system is verified
4. Keep old implementation as fallback
5. Run verify script between steps:
   ```bash
   npm run verify  # Ensures backend connectivity
   npm run test    # Runs all tests
   npm run build   # Verifies build process
   ```

### Rollback Instructions
For each step:
1. Keep git commits atomic and descriptive
2. Store previous version numbers
3. Maintain feature flags for quick disabling
4. Document environment variable changes

### Prompt 1: Environment Setup
```prompt
Act as the senior full stack developer and:
Add Cloudinary configuration to the environment:
1. Update environment.ts interface
    - Add cloudinary config section
    - Add feature flags
    - Update type definitions
2. Add environment variables to .env
    - Add to both .env.development and .env.production
    - Update .env.example
3. Update environment loading in config

Validation:
1. Verify TypeScript compilation
2. Check environment variables are loaded
3. Test feature flag behavior
4. Run existing tests

Rollback:
1. Git revert environment.ts changes
2. Restore previous .env files
```

### Prompt 2: Cloudinary Service
```prompt
Act as the senior full stack developer and:
Create the CloudinaryService class:
1. Create new file cloudinary.service.ts
    - Add proper imports
    - Implement interfaces
    - Add JSDoc comments
2. Implement configuration interface
    - Add validation
    - Add default values
    - Add type guards
3. Add upload and optimization methods
    - Implement error handling
    - Add retry logic
    - Add timeout handling
4. Implement rate limiting
    - Add configurable limits
    - Implement token bucket algorithm
    - Add persistent storage option

Validation:
1. Run unit tests
2. Test rate limiting
3. Verify error handling
4. Check memory usage

Rollback:
1. Remove cloudinary.service.ts
2. Remove test files
3. Update imports
```

### Prompt 3: Share Service Integration
```prompt
Update ShareService with Cloudinary integration:
1. Import and initialize CloudinaryService
    - Add dependency injection
    - Handle initialization errors
2. Update shareToTwitter method
    - Add progress tracking
    - Implement cancel capability
    - Add retry logic
3. Add error handling and fallbacks
    - Implement graceful degradation
    - Add user feedback
    - Log errors appropriately

Validation:
1. Test share flow
2. Verify fallbacks
3. Check error handling
4. Test cancellation

Rollback:
1. Revert share.service.ts
2. Remove CloudinaryService dependency
```

### Prompt 4: Component Integration
```prompt
Update RoastDisplay component:
1. Import updated ShareService
2. Modify handleTwitterShare method
3. Add loading states and error handling
Follow the code examples in Step 3 of the implementation steps.
```

### Prompt 5: Testing
```prompt
Add test coverage:
1. Create CloudinaryService tests
2. Update ShareService tests
3. Add integration tests
Follow the testing plan section.
```

### Prompt 6: Monitoring
```prompt
Implement usage tracking:
1. Add analytics events
2. Set up error reporting
3. Configure usage alerts
Follow the monitoring plan section.
```

## Prerequisites
1. Cloudinary Account Setup
   - Create free account at cloudinary.com
   - Note down cloud name
   - Create upload preset with these settings:
     ```json
     {
       "folder": "roasts",
       "allowed_formats": ["png", "jpg", "jpeg", "gif"],
       "max_file_size": 10485760, // 10MB
       "eager_transformations": [
         { "width": 1200, "height": 630, "crop": "fit" },
         { "fetch_format": "auto", "quality": "auto:good" }
       ]
     }
     ```

2. Environment Variables
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
   NEXT_PUBLIC_ENABLE_TWITTER=true
   ```

## Implementation Steps

### Step 1: Create Cloudinary Service
File: `packages/frontend/src/services/cloudinary.service.ts`
```typescript
interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  maxFileSizeMB: number;
  allowedFormats: string[];
  folder: string;
}

interface UploadResponse {
  secure_url: string;
  public_id: string;
}

class CloudinaryService {
  private config: CloudinaryConfig;
  private uploadCount: number = 0;
  private lastUploadReset: number = Date.now();

  constructor(config: Partial<CloudinaryConfig> = {}) {
    this.config = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      maxFileSizeMB: 10,
      allowedFormats: ['png', 'jpg', 'jpeg', 'gif'],
      folder: 'roasts',
      ...config
    };
  }

  async uploadImage(file: Blob): Promise<string> {
    this.checkRateLimit();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    formData.append('folder', this.config.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: UploadResponse = await response.json();
    this.uploadCount++;
    return data.secure_url;
  }

  private checkRateLimit() {
    // Reset counter every hour
    if (Date.now() - this.lastUploadReset > 3600000) {
      this.uploadCount = 0;
      this.lastUploadReset = Date.now();
    }

    if (this.uploadCount >= 50) {
      throw new Error('Upload rate limit exceeded');
    }
  }

  getTwitterOptimizedUrl(url: string): string {
    // Add Twitter-specific transformations
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fit/');
  }
}

export default CloudinaryService;
```

### Step 2: Update Share Service
File: `packages/frontend/src/services/share.service.ts`
```typescript
import CloudinaryService from './cloudinary.service';

interface ShareOptions {
  imageBlob?: Blob;
  text: string;
  url: string;
}

interface ShareResult {
  success: boolean;
  url?: string;
  error?: string;
}

class ShareService {
  private cloudinary: CloudinaryService;

  constructor() {
    this.cloudinary = new CloudinaryService();
  }

  async shareToTwitter(options: ShareOptions): Promise<ShareResult> {
    try {
      let imageUrl = '';
      
      if (options.imageBlob) {
        imageUrl = await this.cloudinary.uploadImage(options.imageBlob);
        imageUrl = this.cloudinary.getTwitterOptimizedUrl(imageUrl);
      }

      const twitterUrl = new URL('https://twitter.com/intent/tweet');
      twitterUrl.searchParams.append('text', options.text);
      twitterUrl.searchParams.append('url', options.url);
      if (imageUrl) {
        twitterUrl.searchParams.append('image', imageUrl);
      }

      window.open(twitterUrl.toString(), '_blank');
      return { success: true };
    } catch (error) {
      console.error('Twitter share failed:', error);
      return { 
        success: false, 
        error: 'Failed to share to Twitter' 
      };
    }
  }
}

export default ShareService;
```

### Step 3: Update RoastDisplay Component
File: `packages/frontend/src/components/roast/RoastDisplay.tsx`
```typescript
// ... existing imports
import ShareService from '../../services/share.service';

// Inside RoastDisplay component
const shareService = new ShareService();

const handleTwitterShare = async () => {
  if (!roastData?.meme_url) return;
  
  try {
    // Get the PNG blob
    const response = await fetch(roastData.meme_url);
    const blob = await response.blob();
    const pngBlob = await clipboardService.convertToPng(blob);

    // Share to Twitter
    const result = await shareService.shareToTwitter({
      imageBlob: pngBlob,
      text: `${roastData.roast}\n\nCheck out my roast at:`,
      url: window.location.href
    });

    if (!result.success) {
      setToastMessage(result.error || 'Failed to share to Twitter');
    }
  } catch (error) {
    console.error('Twitter share failed:', error);
    setToastMessage('Failed to share to Twitter. Try copying instead.');
  }
};
```

### Step 0: Feature Flag Setup
```typescript
// Add to environment.ts
interface Environment {
  nodeEnv: string;
  solana: {
    cluster: 'devnet' | 'mainnet-beta';
    explorerUrl: string;
  };
  features: {
    twitter: boolean;
  };
}

export const environment: Environment = {
  // ... existing config
  features: {
    twitter: import.meta.env.NEXT_PUBLIC_ENABLE_TWITTER === 'true'
  }
};
```

### Step 4: Error Handling
```typescript
// In share.service.ts
class ShareService {
  async shareToTwitter(options: ShareOptions): Promise<ShareResult> {
    try {
      // ... existing logic
    } catch (error) {
      // Log error
      console.error('Twitter share failed:', error);
      
      // Fallback to basic share
      const twitterUrl = new URL('https://twitter.com/intent/tweet');
      twitterUrl.searchParams.append('text', options.text);
      twitterUrl.searchParams.append('url', options.url);
      
      window.open(twitterUrl.toString(), '_blank');
      return { 
        success: true,
        warning: 'Shared without image due to error'
      };
    }
  }
}
```

## Testing Plan

1. Unit Tests
File: `packages/frontend/src/services/__tests__/cloudinary.service.test.ts`
```typescript
import CloudinaryService from '../cloudinary.service';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService();
  });

  test('rate limiting works', () => {
    // Add tests
  });

  test('upload handles errors', () => {
    // Add tests
  });
});
```

2. Integration Tests
File: `packages/frontend/src/components/roast/__tests__/RoastDisplay.test.tsx`
```typescript
// Add Twitter share tests
```

### Unit Tests
```typescript
// cloudinary.service.test.ts
describe('CloudinaryService', () => {
  describe('uploadImage', () => {
    it('should handle rate limits', async () => {
      // Test implementation
    });

    it('should convert to PNG before upload', async () => {
      // Test implementation
    });
  });
});

// share.service.test.ts
describe('ShareService', () => {
  describe('shareToTwitter', () => {
    it('should fallback gracefully', async () => {
      // Test implementation
    });
  });
});
```

### Client-Side Settings
These will be handled in CloudinaryService instead of preset:
```typescript
interface CloudinaryConfig {
  maxFileSizeMB: number;  // Validate before upload
  allowedFormats: string[];  // Check file type client-side
  transformations: {  // Apply after upload
    width: 1200,
    height: 630,
    crop: 'fit',
    format: 'auto',
    quality: 'auto:good'
  }
}
```