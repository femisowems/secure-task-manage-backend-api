
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app.module';

describe('AuthController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/auth/me (GET) - 401 Unauthorized when no token provided', () => {
        return request(app.getHttpServer())
            .get('/auth/me')
            .expect(401);
    });

    it('/auth/me (GET) - 200 OK when valid token provided', async () => {
        // Note: The strategy is mocked in TestAppModule to always validate if a token is present
        const response = await request(app.getHttpServer())
            .get('/auth/me')
            .set('Authorization', 'Bearer valid-token')
            .expect(200);

        expect(response.body).toBeDefined();
        // Our mock in TestAppModule returns the payload, but we need to see what it actually is 
        // in our TestAppModule implementation.
    });
});
