
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function seed() {
    const db = new sqlite3.Database('database.sqlite');

    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    try {
        console.log('Connecting to database and creating tables if needed...');

        await run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL,
                organizationId TEXT NOT NULL,
                createdBy TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizationId) REFERENCES organizations (id),
                FOREIGN KEY (createdBy) REFERENCES users (id)
            )
        `);

        // 1. Ensure Organization exists
        let org = await get("SELECT * FROM organizations WHERE name = ?", ['Default Organization']);
        let orgId;
        if (!org) {
            orgId = crypto.randomUUID();
            await run("INSERT INTO organizations (id, name) VALUES (?, ?)", [orgId, 'Default Organization']);
            console.log('Created Default Organization');
        } else {
            orgId = org.id;
        }

        const passwordHash = await bcrypt.hash('password123', 10);

        // 2. Create Admin
        let admin = await get("SELECT * FROM users WHERE email = ?", ['admin@test.com']);
        let adminId;
        if (!admin) {
            adminId = crypto.randomUUID();
            await run(
                "INSERT INTO users (id, email, passwordHash, role, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
                [adminId, 'admin@test.com', passwordHash, 'Owner', orgId, new Date().toISOString()]
            );
            console.log('Created Admin: admin@test.com / password123');
        } else {
            adminId = admin.id;
        }

        // 3. Create User
        let user = await get("SELECT * FROM users WHERE email = ?", ['user@test.com']);
        if (!user) {
            await run(
                "INSERT INTO users (id, email, passwordHash, role, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
                [crypto.randomUUID(), 'user@test.com', passwordHash, 'Viewer', orgId, new Date().toISOString()]
            );
            console.log('Created User: user@test.com / password123');
        }

        // 4. Create Sample Tasks
        const taskCount = await get("SELECT COUNT(*) as count FROM tasks");
        if (taskCount.count === 0) {
            const tasks = [
                ['Review System Logs', 'Analyze audit logs for suspicious activity', 'Security', 'todo', orgId, adminId],
                ['Update RBAC Permissions', 'Refine Owner permissions for multi-tenant support', 'Configuration', 'in-progress', orgId, adminId],
                ['Design System Unification', 'Migrate React components to shared design system', 'Migration', 'done', orgId, adminId],
                ['Performance Audit', 'Identify bottlenecks in database queries', 'Engineering', 'todo', orgId, adminId]
            ];

            for (const task of tasks) {
                await run(
                    "INSERT INTO tasks (id, title, description, category, status, organizationId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [crypto.randomUUID(), ...task]
                );
            }
            console.log(`Created ${tasks.length} sample tasks`);
        }

        console.log('\nSeeding complete! You can now log in with:');
        console.log('Admin: admin@test.com / password123');
        console.log('User:  user@test.com / password123');
    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        db.close();
    }
}

seed();
