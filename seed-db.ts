import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Organization, Task, AuditLog } from './libs/data/src/lib/entities';
import { UserRole } from './libs/data/src/lib/enums';
import * as bcrypt from 'bcrypt';

async function seed() {
    const dataSource = new DataSource({
        type: 'sqlite',
        database: 'database.sqlite',
        entities: [User, Organization, Task, AuditLog],
        synchronize: true,
    });

    await dataSource.initialize();

    const orgRepo = dataSource.getRepository(Organization);
    const userRepo = dataSource.getRepository(User);

    // 1. Create Default Organization
    let defaultOrg = await orgRepo.findOne({ where: { name: 'Default Organization' } });
    if (!defaultOrg) {
        defaultOrg = orgRepo.create({
            name: 'Default Organization'
        });
        await orgRepo.save(defaultOrg);
        console.log('Created Default Organization');
    }

    // 2. Create Admin User
    const adminEmail = 'admin@test.com';
    let admin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
        const passwordHash = await bcrypt.hash('password123', 10);
        admin = userRepo.create({
            email: adminEmail,
            passwordHash: passwordHash,
            role: UserRole.OWNER,
            organizationId: defaultOrg.id
        });
        await userRepo.save(admin);
        console.log('Created Admin User: admin@test.com / password123');
    }

    // 3. Create Default User
    const userEmail = 'user@test.com';
    let standardUser = await userRepo.findOne({ where: { email: userEmail } });
    if (!standardUser) {
        const passwordHash = await bcrypt.hash('password123', 10);
        standardUser = userRepo.create({
            email: userEmail,
            passwordHash: passwordHash,
            role: UserRole.VIEWER,
            organizationId: defaultOrg.id
        });
        await userRepo.save(standardUser);
        console.log('Created Standard User: user@test.com / password123');
    }

    // 4. Create Sample Tasks
    const taskRepo = dataSource.getRepository(Task);
    const existingTasks = await taskRepo.count();
    if (existingTasks === 0) {
        const tasks = [
            {
                title: 'Review System Logs',
                description: 'Analyze audit logs for suspicious activity',
                category: 'Security',
                status: 'todo',
                organizationId: defaultOrg.id,
                createdBy: admin.id
            },
            {
                title: 'Update RBAC Permissions',
                description: 'Refine Owner permissions for multi-tenant support',
                category: 'Configuration',
                status: 'in-progress',
                organizationId: defaultOrg.id,
                createdBy: admin.id
            },
            {
                title: 'Design System Unification',
                description: 'Migrate React components to shared design system',
                category: 'Migration',
                status: 'done',
                organizationId: defaultOrg.id,
                createdBy: admin.id
            },
            {
                title: 'Performance Audit',
                description: 'Identify bottlenecks in database queries',
                category: 'Engineering',
                status: 'todo',
                organizationId: defaultOrg.id,
                createdBy: admin.id
            }
        ];

        for (const taskData of tasks) {
            const task = taskRepo.create(taskData);
            await taskRepo.save(task);
        }
        console.log(`Created ${tasks.length} sample tasks`);
    }

    await dataSource.destroy();
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
