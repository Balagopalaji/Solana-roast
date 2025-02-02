import { firebaseService } from '../firebase.service';

describe('FirebaseService', () => {
  const mockRoastData = {
    roast: 'Test roast',
    memeUrl: 'https://example.com/meme.jpg',
    walletAddress: '0x123'
  };

  it('should store and retrieve a roast', async () => {
    // Store roast
    const shareId = await firebaseService.storeRoast(mockRoastData);
    expect(shareId).toBeTruthy();

    // Retrieve roast
    const retrieved = await firebaseService.getRoast(shareId);
    expect(retrieved).toBeTruthy();
    expect(retrieved?.roast).toBe(mockRoastData.roast);
    expect(retrieved?.memeUrl).toBe(mockRoastData.memeUrl);
    expect(retrieved?.walletAddress).toBe(mockRoastData.walletAddress);
  });

  it('should handle non-existent roasts', async () => {
    const result = await firebaseService.getRoast('non-existent-id');
    expect(result).toBeNull();
  });

  it('should increment share count on access', async () => {
    const shareId = await firebaseService.storeRoast(mockRoastData);
    
    // First access
    const first = await firebaseService.getRoast(shareId);
    expect(first?.shareCount).toBe(1);
    
    // Second access
    const second = await firebaseService.getRoast(shareId);
    expect(second?.shareCount).toBe(2);
  });
}); 