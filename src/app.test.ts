import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      environment: expect.any(String),
      version: '1.0.0'
    });
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: 'Route not found'
    });
  });

  it('should return 404 for unimplemented API routes', async () => {
    const response = await request(app)
      .post('/api/generate')
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: 'API endpoint not implemented yet'
    });
  });
});
