import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Increase test timeout for integration tests
jest.setTimeout(30000); 