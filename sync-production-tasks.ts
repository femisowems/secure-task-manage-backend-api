import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Organization, Task } from './libs/data/src/lib/entities';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function syncProductionTasks() {
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL environment variable is not set');
        console.log('Please set your Railway DATABASE_URL before running this script');
        process.exit(1);
    }

    if (!process.env.DATABASE_URL.startsWith('postgres')) {
        console.error('ERROR: This script is for PostgreSQL (Railway) only');
        console.log('Current DATABASE_URL does not appear to be PostgreSQL');
        process.exit(1);
    }

    console.log('🚀 Connecting to Railway production database...');

    const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, Organization, Task],
        synchronize: false, // Don't auto-sync in production
        ssl: { rejectUnauthorized: false },
        logging: true,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Connected to Railway database\n');

        const orgRepo = dataSource.getRepository(Organization);
        const userRepo = dataSource.getRepository(User);
        const taskRepo = dataSource.getRepository(Task);

        // Check organizations
        console.log('📊 Checking organizations...');
        const orgs = await orgRepo.find();
        console.log(`Found ${orgs.length} organizations:`);
        orgs.forEach(org => {
            console.log(`  - ${org.name} (ID: ${org.id}, Parent: ${org.parentOrganizationId || 'None'})`);
        });

        // Check users
        console.log('\n👥 Checking users...');
        const users = await userRepo.find();
        console.log(`Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ${user.email} (Role: ${user.role}, Org: ${user.organizationId})`);
        });

        // Check tasks
        console.log('\n📋 Checking tasks...');
        const tasks = await taskRepo.find();
        console.log(`Found ${tasks.length} tasks:`);
        tasks.forEach(task => {
            console.log(`  - "${task.title}" (Org: ${task.organizationId}, Created by: ${task.createdBy})`);
        });

        // Find the organizations we need
        const defaultOrg = orgs.find(o => o.name === 'Default Organization');
        const childOrg = orgs.find(o => o.name === 'Child Organization');

        if (!defaultOrg) {
            console.log('\n⚠️  WARNING: Default Organization not found in production');
            console.log('   Please run the seed-db.ts script first to create organizations and users');
            await dataSource.destroy();
            return;
        }

        // Find users
        const admin = users.find(u => u.email === 'admin@test.com');
        const childAdmin = users.find(u => u.email === 'child-admin@test.com');

        // Check and create missing tasks
        console.log('\n🔄 Syncing tasks...');
        let tasksCreated = 0;

        // Task 1: Parent Org Task
        const parentTaskExists = tasks.some(t => t.title === 'Parent Org Task');
        if (!parentTaskExists && defaultOrg && admin) {
            const parentTask = taskRepo.create({
                title: 'Parent Org Task',
                description: 'Should be visible to Parent Admin/Owner',
                category: 'work',
                status: 'todo',
                priority: 'high',
                organizationId: defaultOrg.id,
                createdBy: admin.id
            });
            await taskRepo.save(parentTask);
            console.log('  ✅ Created: Parent Org Task');
            tasksCreated++;
        } else if (parentTaskExists) {
            console.log('  ℹ️  Already exists: Parent Org Task');
        }

        // Task 2: Child Org Task
        const childTaskExists = tasks.some(t => t.title === 'Child Org Task');
        if (!childTaskExists && childOrg && childAdmin) {
            const childTask = taskRepo.create({
                title: 'Child Org Task',
                description: 'Should be visible to Parent Admin/Owner AND Child Admin',
                category: 'personal',
                status: 'in-progress',
                priority: 'medium',
                organizationId: childOrg.id,
                createdBy: childAdmin.id
            });
            await taskRepo.save(childTask);
            console.log('  ✅ Created: Child Org Task');
            tasksCreated++;
        } else if (childTaskExists) {
            console.log('  ℹ️  Already exists: Child Org Task');
        }

        // Final summary
        console.log(`\n📊 Summary:`);
        console.log(`  - Organizations: ${orgs.length}`);
        console.log(`  - Users: ${users.length}`);
        console.log(`  - Tasks before sync: ${tasks.length}`);
        console.log(`  - Tasks created: ${tasksCreated}`);
        console.log(`  - Total tasks now: ${tasks.length + tasksCreated}`);

        if (tasksCreated > 0) {
            console.log('\n✅ Production tasks synced successfully!');
        } else {
            console.log('\n✅ All tasks already exist in production');
        }

        await dataSource.destroy();
    } catch (error) {
        console.error('\n❌ Error syncing tasks:', error);
        await dataSource.destroy();
        process.exit(1);
    }
}

syncProductionTasks();
