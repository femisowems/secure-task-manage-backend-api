
import { Module, Injectable, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AppModule } from '../../src/app/app.module';
import { SupabaseJwtStrategy } from '../../src/app/auth/supabase-jwt.strategy';

process.env.DATABASE_URL = ':memory:';

@Injectable()
class MockSupabaseStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
    async validate(req: any): Promise<any> {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                // Decode base64 JSON if possible
                return JSON.parse(Buffer.from(token, 'base64').toString());
            } catch {
                // Fallback or treat as direct JSON string if not base64
                try {
                    return JSON.parse(token);
                } catch {
                    return { id: 'user-1', email: 'test@example.com', role: 'Viewer', organizationId: 'org-1' };
                }
            }
        }
        return null;
    }
}

@Module({
    imports: [AppModule],
    providers: [MockSupabaseStrategy],
})
export class TestAppModule { }

export async function createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule],
    })
        .overrideProvider(SupabaseJwtStrategy)
        .useClass(MockSupabaseStrategy)
        .compile();

    const app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    return app;
}
