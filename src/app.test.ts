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

  it('should return 200 for empty API requests using defaults', async () => {
    const response = await request(app)
      .post('/api/generate')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'File generated successfully',
      data: expect.objectContaining({
        filename: expect.stringMatching(/^SDDirect_11_x_15_H_V_\d{8}_\d{6}\.csv$/),
        metadata: expect.objectContaining({
          recordCount: 15,
          validRecords: 15,
          invalidRecords: 0,
          columnCount: 11,
          hasHeaders: true
        })
      })
    });
  });

  it('should return 400 when fields provided without fileType', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ numberOfRows: 10, includeHeaders: true })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Validation failed',
      details: 'fileType is required when other fields are provided'
    });
  });
});
