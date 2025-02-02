import axios from 'axios';
import logger from '../utils/logger';
import { environment } from '../config/environment';

const IMGFLIP_API_URL = 'https://api.imgflip.com/caption_image';
const MEME_TEMPLATE_ID = '101470'; // Choose an appropriate meme template ID

interface ImgflipResponse {
  success: boolean;
  data: {
    url: string;
  };
}

export async function generateMeme(roastText: string): Promise<string> {
  try {
    const response = await axios.post<ImgflipResponse>(IMGFLIP_API_URL, {
      template_id: MEME_TEMPLATE_ID,
      username: environment.imgflip.username,
      password: environment.imgflip.password,
      text0: roastText,
      text1: '🔥 SolanaRoast.lol'
    });

    if (!response.data.success) {
      throw new Error('Failed to generate meme');
    }

    return response.data.data.url;
  } catch (error) {
    logger.error('Meme generation failed:', error);
    // Return a default meme URL if generation fails
    return 'https://i.imgflip.com/default-roast-meme.jpg';
  }
} 