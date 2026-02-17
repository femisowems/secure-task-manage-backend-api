import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Organization, Task, AuditLog, Permission } from './libs/data/src/lib/entities';
import { UserRole } from './libs/data/src/lib/enums';
import * as bcrypt from 'bcrypt';

async function seed() {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');

    const dataSource = new DataSource({
        type: (isPostgres ? 'postgres' : 'sqlite') as any,
        url: isPostgres ? process.env.DATABASE_URL : undefined,
        database: isPostgres ? undefined : (process.env.DATABASE_URL || 'database.sqlite'),
        entities: [User, Organization, Task, AuditLog, Permission],
        synchronize: true,
        ssl: isPostgres ? { rejectUnauthorized: false } : false,
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

    // 1.1 Create Child Organization
    let childOrg = await orgRepo.findOne({ where: { name: 'Child Organization' } });
    if (!childOrg) {
        childOrg = orgRepo.create({
            name: 'Child Organization',
            parentOrganizationId: defaultOrg.id
        });
        await orgRepo.save(childOrg);
        console.log('Created Child Organization');
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

    // 2.1 Create Child Org Admin
    const childAdminEmail = 'child-admin@test.com';
    let childAdmin = await userRepo.findOne({ where: { email: childAdminEmail } });
    if (!childAdmin) {
        const passwordHash = await bcrypt.hash('password123', 10);
        childAdmin = userRepo.create({
            email: childAdminEmail,
            passwordHash: passwordHash,
            role: UserRole.ADMIN,
            organizationId: childOrg.id
        });
        await userRepo.save(childAdmin);
        console.log('Created Child Admin User');
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
                title: 'Parent Org Task',
                description: 'Should be visible to Parent Admin/Owner',
                category: 'work',
                status: 'todo',
                priority: 'high',
                organizationId: defaultOrg.id,
                createdBy: admin.id
            },
            {
                title: 'Child Org Task',
                description: 'Should be visible to Parent Admin/Owner AND Child Admin',
                category: 'personal',
                status: 'in-progress',
                priority: 'medium',
                organizationId: childOrg.id,
                createdBy: childAdmin.id
            }
        ];

        for (const taskData of tasks) {
            const task = taskRepo.create(taskData);
            await taskRepo.save(task);
        }
        console.log(`Created ${tasks.length} sample tasks`);
    }

    // 5. Seed Permissions
    const permRepo = dataSource.getRepository(Permission);
    const hasPerms = await permRepo.count();
    if (hasPerms === 0) {
        const permissions = [
            { name: 'CREATE_TASK', role: UserRole.OWNER },
            { name: 'CREATE_TASK', role: UserRole.ADMIN },
            { name: 'CREATE_TASK', role: UserRole.VIEWER },
            { name: 'DELETE_TASK', role: UserRole.OWNER },
            { name: 'DELETE_TASK', role: UserRole.ADMIN },
        ];
        for (const p of permissions) {
            await permRepo.save(permRepo.create(p));
        }
        console.log('Seeded Permissions');
    }

    await dataSource.destroy();
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
