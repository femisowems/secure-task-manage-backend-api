
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AppController } from './app.controller';
import { User, Organization, Task, AuditLog, Permission } from '@secure-task-manage-app-angular/data/entities';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'sqlite', // Default to sqlite for ease
            database: process.env.DATABASE_URL || 'database.sqlite',
            entities: [User, Organization, Task, AuditLog, Permission],
            synchronize: true, // Only for dev!
            logging: true,
        }),
        AuthModule,
        UsersModule,
        TasksModule,
        AuditModule,
        OrganizationsModule,
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
    controllers: [AppController],
})
export class AppModule { }
