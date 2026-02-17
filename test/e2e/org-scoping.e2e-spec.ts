
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app.module';
import { Repository } from 'typeorm';
import { User, Organization, Task } from '@secure-task-manage-app-angular/data/entities';
import { UserRole } from '@secure-task-manage-app-angular/data/enums';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Organization Scoping (e2e)', () => {
    let app: INestApplication;
    let orgRepo: Repository<Organization>;
    let userRepo: Repository<User>;
    let taskRepo: Repository<Task>;

    let parentOrg: Organization;
    let childOrg: Organization;
    let unrelatedOrg: Organization;

    let parentOwner: User;
    let childAdmin: User;
    let unrelatedUser: User;

    beforeAll(async () => {
        app = await createTestApp();
        orgRepo = app.get(getRepositoryToken(Organization));
        userRepo = app.get(getRepositoryToken(User));
        taskRepo = app.get(getRepositoryToken(Task));

        // Setup Hierarchy: Parent -> Child
        parentOrg = await orgRepo.save(orgRepo.create({ name: 'Hierarchy Parent' }));
        childOrg = await orgRepo.save(orgRepo.create({ name: 'Hierarchy Child', parentOrganizationId: parentOrg.id }));
        unrelatedOrg = await orgRepo.save(orgRepo.create({ name: 'Unrelated Org' }));

        parentOwner = await userRepo.save(userRepo.create({
            email: 'parent@owner.com', role: UserRole.OWNER, organizationId: parentOrg.id
        }));
        childAdmin = await userRepo.save(userRepo.create({
            email: 'child@admin.com', role: UserRole.ADMIN, organizationId: childOrg.id
        }));
        unrelatedUser = await userRepo.save(userRepo.create({
            email: 'unrelated@user.com', role: UserRole.VIEWER, organizationId: unrelatedOrg.id
        }));

        // Seed tasks
        await taskRepo.save(taskRepo.create({
            title: 'Parent Task', organizationId: parentOrg.id, createdBy: parentOwner.id,
            category: 'A', status: 'B', description: 'C'
        }));
        await taskRepo.save(taskRepo.create({
            title: 'Child Task', organizationId: childOrg.id, createdBy: childAdmin.id,
            category: 'A', status: 'B', description: 'C'
        }));
        await taskRepo.save(taskRepo.create({
            title: 'Unrelated Task', organizationId: unrelatedOrg.id, createdBy: unrelatedUser.id,
            category: 'A', status: 'B', description: 'C'
        }));
    });

    afterAll(async () => {
        await app.close();
    });

    const getAuthToken = (u: User) => Buffer.from(JSON.stringify(u)).toString('base64');

    it('Child Admin should NOT see parent organization tasks', async () => {
        const response = await request(app.getHttpServer())
            .get('/tasks')
            .set('Authorization', `Bearer ${getAuthToken(childAdmin)}`)
            .expect(200);

        const titles = response.body.map((t: any) => t.title);
        expect(titles).toContain('Child Task');
        expect(titles).not.toContain('Parent Task');
    });

    it('Parent Owner should see child organization tasks', async () => {
        const response = await request(app.getHttpServer())
            .get('/tasks')
            .set('Authorization', `Bearer ${getAuthToken(parentOwner)}`)
            .expect(200);

        const titles = response.body.map((t: any) => t.title);
        expect(titles).toContain('Parent Task');
        expect(titles).toContain('Child Task');
        expect(titles).not.toContain('Unrelated Task');
    });

    it('Unrelated user should see only their own tasks', async () => {
        const response = await request(app.getHttpServer())
            .get('/tasks')
            .set('Authorization', `Bearer ${getAuthToken(unrelatedUser)}`)
            .expect(200);

        const titles = response.body.map((t: any) => t.title);
        expect(titles).toEqual(['Unrelated Task']);
    });
});
