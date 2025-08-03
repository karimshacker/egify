import request from 'supertest';
import { app } from '../app';
import { connectDatabase, disconnectDatabase } from '../utils/database';

describe('Health Check', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    });

    it('should return healthy status when all services are up', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services.database).toBe('healthy');
      expect(response.body.services.redis).toBe('healthy');
    });
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.text).toContain('Swagger UI');
    });
  });

  describe('GET /api-docs.json', () => {
    it('should return OpenAPI specification', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body.info.title).toBe('Egify Platform API');
    });
  });
}); 