import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ 
  path: path.resolve(__dirname, '../../../.env') 
}); 