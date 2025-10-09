const request = require('supertest');
const app = require('../server');

describe('Server Tests', () => {
  test('GET / should return 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/health should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('POST /api/proxy/generate should create endpoint', async () => {
    const res = await request(app)
      .post('/api/proxy/generate')
      .send({ type: 'residential', country: 'US' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('endpoint');
  });
});