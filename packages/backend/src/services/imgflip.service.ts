import { environment } from '../config/environment';
import logger from '../utils/logger';

interface ImgflipResponse {
  success: boolean;
  data: {
    url: string;
    page_url: string;
  };
  error_message?: string;
}

export class ImgflipService {
  private readonly API_URL = 'https://api.imgflip.com/caption_image';
  // We can curate a list of meme templates that work well for wallet roasts
  private readonly MEME_TEMPLATES = [
    {
      id: '101470', // Ancient Aliens
      name: 'Ancient Aliens Guy',
      suitableFor: ['conspiracy', 'mystery', 'speculation'],
      keywords: ['maybe', 'what if', 'could it be']
    },
    {
      id: '61579', // One Does Not Simply
      name: 'One Does Not Simply',
      suitableFor: ['difficulty', 'warning', 'advice'],
      keywords: ['impossible', 'hard', 'never']
    },
    {
      id: '61520', // Futurama Fry
      name: 'Futurama Fry',
      suitableFor: ['skepticism', 'confusion', 'doubt'],
      keywords: ['not sure if', 'maybe', 'thinking']
    },
    {
      id: '27813981', // Hide the Pain Harold
      name: 'Hide the Pain Harold',
      suitableFor: ['coping', 'loss', 'pretending'],
      keywords: ['pain', 'suffering', 'down bad']
    },
    {
      id: '101288', // Third World Skeptical Kid
      name: 'Third World Skeptical Kid',
      suitableFor: ['disbelief', 'questioning'],
      keywords: ['so you telling me', 'what do you mean']
    },
    {
      id: '124822590', // Sleeping Shaq
      name: 'Sleeping Shaq',
      suitableFor: ['inactivity', 'sleeping', 'missing out'],
      keywords: ['sleep', 'inactive', 'missed']
    }
  ];

  constructor(
    private readonly username: string = environment.imgflip.username,
    private readonly password: string = environment.imgflip.password
  ) {}

  private selectTemplate(context: string): string {
    // Convert context to lowercase for matching
    const lowerContext = context.toLowerCase();
    
    // Find template whose keywords match the context
    const matchedTemplate = this.MEME_TEMPLATES.find(template => 
      template.keywords.some(keyword => lowerContext.includes(keyword))
    );
    
    // Return matched template or random one as fallback
    return matchedTemplate?.id || 
      this.MEME_TEMPLATES[Math.floor(Math.random() * this.MEME_TEMPLATES.length)].id;
  }

  async generateMeme(topText: string, bottomText: string, context: string): Promise<string> {
    const template_id = this.selectTemplate(context);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          template_id,
          username: this.username,
          password: this.password,
          text0: topText,
          text1: bottomText,
          font: 'impact' // Classic meme font
        }).toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as ImgflipResponse;

      if (!data.success) {
        logger.error('Imgflip API error:', data.error_message);
        throw new Error(data.error_message || 'Failed to generate meme');
      }

      return data.data.url;
    } catch (error) {
      logger.error('Failed to generate meme:', error);
      // Return a fallback meme URL or rethrow
      throw new Error('Failed to generate meme');
    }
  }
}

export const imgflipService = new ImgflipService(); 