import axios from 'axios';
import { environment } from '../config/environment';

class UrlService {
  private readonly tinyUrlApi = 'http://tinyurl.com/api-create.php';

  async shortenUrl(longUrl: string): Promise<string> {
    try {
      const response = await axios.get(this.tinyUrlApi, {
        params: { url: longUrl }
      });
      return response.data;
    } catch (error) {
      console.error('URL shortening failed:', error);
      return longUrl; // Fallback to original URL
    }
  }
}

export const urlService = new UrlService(); 