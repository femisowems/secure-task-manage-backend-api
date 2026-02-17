
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app.module';
import { Repository } from 'typeorm';
import { User, Organization, Task, AuditLog } from '@secure-task-manage-app-angular/data/entities';
import { UserRole, ActionType } from '@secure-task-manage-app-angular/data/enums';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuditLog (e2e)', () => {
    let app: INestApplication;
    let auditRepo: Repository<AuditLog>;
    let userRepo: Repository<User>;
    let orgRepo: Repository<Organization>;
    let user: User;

    beforeAll(async () => {
        app = await createTestApp();
        auditRepo = app.get(getRepositoryToken(AuditLog));
        userRepo = app.get(getRepositoryToken(User));
        orgRepo = app.get(getRepositoryToken(Organization));

        const org = await orgRepo.save(orgRepo.create({ name: 'Audit Test Org' }));
        user = await userRepo.save(userRepo.create({
            email: 'audit@test.com',
            role: UserRole.ADMIN,
            organizationId: org.id
        }));
    });

    afterAll(async () => {
        await app.close();
    });

    const getAuthToken = (u: User) => Buffer.from(JSON.stringify(u)).toString('base64');

    it('should create an audit log when a task is created', async () => {
        const payload = { title: 'Audit Task', description: 'Desc', category: 'General', status: 'Pending' };
        const response = await request(app.getHttpServer())
            .post('/tasks')
            .set('Authorization', `Bearer ${getAuthToken(user)}`)
            .send(payload)
            .expect(201);

        const taskId = response.body.id;

        // Check audit repo
        const logs = await auditRepo.find({ where: { resourceId: taskId } });
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe(ActionType.CREATE);
        expect(logs[0].userId).toBe(user.id);
        expect(logs[0].resourceType).toBe('Task');
    });

    it('should create an audit log when a task is updated', async () => {
        // Create a task first
        const task = await request(app.getHttpServer())
            .post('/tasks')
            .set('Authorization', `Bearer ${getAuthToken(user)}`)
            .send({ title: 'Before Update', description: 'D', category: 'C', status: 'S' })
            .expect(201);

        const taskId = task.body.id;

        await request(app.getHttpServer())
            .put(`/tasks/${taskId}`)
            .set('Authorization', `Bearer ${getAuthToken(user)}`)
            .send({ title: 'After Update' })
            .expect(200);

        const logs = await auditRepo.find({ where: { resourceId: taskId, action: ActionType.UPDATE } });
        expect(logs.length).toBe(1);
        expect(logs[0].userId).toBe(user.id);
    });

    it('should create an audit log when a task is deleted', async () => {
        const task = await request(app.getHttpServer())
            .post('/tasks')
            .set('Authorization', `Bearer ${getAuthToken(user)}`)
            .send({ title: 'To Delete', description: 'D', category: 'C', status: 'S' })
            .expect(201);

        const taskId = task.body.id;

        await request(app.getHttpServer())
            .delete(`/tasks/${taskId}`)
            .set('Authorization', `Bearer ${getAuthToken(user)}`)
            .expect(200);

        const logs = await auditRepo.find({ where: { resourceId: taskId, action: ActionType.DELETE } });
        expect(logs.length).toBe(1);
    });
});
