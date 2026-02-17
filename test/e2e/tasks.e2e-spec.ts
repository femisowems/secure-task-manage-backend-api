
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app.module';
import { Repository } from 'typeorm';
import { User, Organization, Task } from '@secure-task-manage-app-angular/data/entities';
import { UserRole } from '@secure-task-manage-app-angular/data/enums';

import { getRepositoryToken } from '@nestjs/typeorm';

describe('Tasks (e2e)', () => {
    let app: INestApplication;
    let orgRepo: Repository<Organization>;
    let userRepo: Repository<User>;
    let taskRepo: Repository<Task>;

    let owner: User;
    let admin: User;
    let viewer: User;
    let otherOrgUser: User;
    let parentOrg: Organization;
    let childOrg: Organization;
    let otherOrg: Organization;

    beforeAll(async () => {
        app = await createTestApp();
        orgRepo = app.get(getRepositoryToken(Organization));
        userRepo = app.get(getRepositoryToken(User));
        taskRepo = app.get(getRepositoryToken(Task));

        // Seed Orgs
        parentOrg = await orgRepo.save(orgRepo.create({ name: 'Parent Org' }));
        childOrg = await orgRepo.save(orgRepo.create({ name: 'Child Org', parentOrganizationId: parentOrg.id }));
        otherOrg = await orgRepo.save(orgRepo.create({ name: 'Other Org' }));

        // Seed Users
        owner = await userRepo.save(userRepo.create({ email: 'owner@parent.com', role: UserRole.OWNER, organizationId: parentOrg.id }));
        admin = await userRepo.save(userRepo.create({ email: 'admin@child.com', role: UserRole.ADMIN, organizationId: childOrg.id }));
        viewer = await userRepo.save(userRepo.create({ email: 'viewer@child.com', role: UserRole.VIEWER, organizationId: childOrg.id }));
        otherOrgUser = await userRepo.save(userRepo.create({ email: 'other@other.com', role: UserRole.OWNER, organizationId: otherOrg.id }));
    });

    afterAll(async () => {
        await app.close();
    });

    const getAuthToken = (user: User) => Buffer.from(JSON.stringify(user)).toString('base64');

    describe('POST /tasks', () => {
        it('Owner should create task in their org', async () => {
            const payload = { title: 'Owner Task', description: 'Desc', category: 'General', status: 'Pending' };
            const response = await request(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${getAuthToken(owner)}`)
                .send(payload);

            if (response.status !== 201) {
                console.error('Error Response Body:', response.body);
            }

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(payload.title);
            expect(response.body.organizationId).toBe(parentOrg.id);
        });

        it('Should forbid creating task in another organization', async () => {
            const payload = { title: 'Hack Task', organizationId: otherOrg.id };
            await request(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${getAuthToken(owner)}`)
                .send(payload)
                .expect(403);
        });
    });

    describe('GET /tasks', () => {
        it('Viewer should only see tasks in their own org', async () => {
            // Seed a task in parent org and child org
            await taskRepo.save(taskRepo.create({ title: 'Parent Task', organizationId: parentOrg.id, createdBy: owner.id, category: 'A', status: 'B', description: 'C' }));
            await taskRepo.save(taskRepo.create({ title: 'Child Task', organizationId: childOrg.id, createdBy: admin.id, category: 'A', status: 'B', description: 'C' }));

            const response = await request(app.getHttpServer())
                .get('/tasks')
                .set('Authorization', `Bearer ${getAuthToken(viewer)}`)
                .expect(200);

            // Viewer is in childOrg. They should see 1 task (the one in childOrg)
            // Wait, the service implementation for Viewer says:
            // if (user.role === UserRole.VIEWER) { return this.tasksRepo.find({ where: { organizationId: user.organizationId } }); }
            expect(response.body.length).toBe(1);
            expect(response.body[0].organizationId).toBe(childOrg.id);
        });

        it('Owner of parent org should see tasks in parent and child orgs', async () => {
            const response = await request(app.getHttpServer())
                .get('/tasks')
                .set('Authorization', `Bearer ${getAuthToken(owner)}`)
                .expect(200);

            // Should see at least Owner Task (from previous test), Parent Task, and Child Task
            expect(response.body.length).toBeGreaterThanOrEqual(3);
            const orgIds = response.body.map((t: any) => t.organizationId);
            expect(orgIds).toContain(parentOrg.id);
            expect(orgIds).toContain(childOrg.id);
            expect(orgIds).not.toContain(otherOrg.id);
        });
    });

    describe('PATCH /tasks/:id', () => {
        let taskId: string;
        beforeEach(async () => {
            const task = await taskRepo.save(taskRepo.create({
                title: 'Update Me',
                organizationId: childOrg.id,
                createdBy: admin.id,
                category: 'A', status: 'B', description: 'C'
            }));
            taskId = task.id;
        });

        it('Admin should update task in their org', async () => {
            await request(app.getHttpServer())
                .put(`/tasks/${taskId}`) // Controller uses @Put(':id')
                .set('Authorization', `Bearer ${getAuthToken(admin)}`)
                .send({ title: 'Updated' })
                .expect(200);
        });

        it('Viewer should not update task they did not create', async () => {
            await request(app.getHttpServer())
                .put(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${getAuthToken(viewer)}`)
                .send({ title: 'Hack' })
                .expect(403);
        });

        it('Owner of parent org should update task in child org', async () => {
            await request(app.getHttpServer())
                .put(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${getAuthToken(owner)}`)
                .send({ title: 'Owner Updated' })
                .expect(200);
        });
    });

    describe('DELETE /tasks/:id', () => {
        let taskId: string;
        beforeEach(async () => {
            const task = await taskRepo.save(taskRepo.create({
                title: 'Delete Me',
                organizationId: childOrg.id,
                createdBy: admin.id,
                category: 'A', status: 'B', description: 'C'
            }));
            taskId = task.id;
        });

        it('Viewer should be forbidden from deleting', async () => {
            await request(app.getHttpServer())
                .delete(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${getAuthToken(viewer)}`)
                .expect(403);
        });

        it('Admin should delete task in their org', async () => {
            await request(app.getHttpServer())
                .delete(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${getAuthToken(admin)}`)
                .expect(200);
        });
    });
});
