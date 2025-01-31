import request from 'supertest';
import app from '../app';

describe('Integration Tests', () => {
  it('health check should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  it('should reject invalid wallet address', async () => {
    const response = await request(app)
      .post('/roast')
      .send({ walletAddress: 'invalid-address' });
    expect(response.status).toBe(400);
  });

  it('should generate roast for valid wallet', async () => {
    const response = await request(app)
      .post('/roast')
      .send({ walletAddress: 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y' });
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('roast');
    expect(response.body.data).toHaveProperty('wallet');
  });
}); 