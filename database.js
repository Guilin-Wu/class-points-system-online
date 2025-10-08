// database.js (最终修复完整版)
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

// 1. 解析 Render 提供的 DATABASE_URL 环境变量
const dbConfig = parse(process.env.DATABASE_URL || '');

// 2. 创建一个新的连接池配置
const pool = new Pool({
    ...dbConfig, // 将解析出的 user, password, database, port 等应用到配置中
    ssl: {
        rejectUnauthorized: false,
    },
    // 3. [最终修复] 强制连接时使用 IPv4 协议
    // 我们明确指定 host，并告知 Node.js 的网络模块使用 family: 4 (IPv4)
    host: dbConfig.host,
    family: 4,
});

// 使用分号分隔多个SQL语句，并逐一执行
const setupSchema = [
    `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS students (
        id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "group" TEXT,
        points INTEGER DEFAULT 0 NOT NULL,
        totalEarnedPoints INTEGER DEFAULT 0 NOT NULL,
        totalDeductions INTEGER DEFAULT 0 NOT NULL,
        PRIMARY KEY (user_id, id)
    );`,

    `CREATE TABLE IF NOT EXISTS groups (
        id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
    );`,

    `CREATE TABLE IF NOT EXISTS rewards (
        id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        cost INTEGER NOT NULL,
        PRIMARY KEY (user_id, id)
    );`,

    `CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        time TEXT NOT NULL,
        studentId TEXT NOT NULL,
        studentName TEXT NOT NULL,
        change TEXT NOT NULL,
        reason TEXT NOT NULL,
        finalPoints INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS turntablePrizes (
        id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
    );`,

    `CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (user_id, key)
    );`,

    // 为单用户模式创建一个默认用户和一些种子数据
    // ON CONFLICT... DO NOTHING; 确保这些语句在重复执行时不会报错
    `INSERT INTO users (id, email, password_hash) VALUES (1, 'default@user.com', 'default_password') ON CONFLICT (id) DO NOTHING;`,
    
    `INSERT INTO settings (user_id, key, value) VALUES (1, 'turntableCost', '10') ON CONFLICT (user_id, key) DO NOTHING;`
];

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        for (const command of setupSchema) {
            await client.query(command);
        }
        console.log('Database schema is ready.');
    } catch (err) {
        console.error('Error initializing database schema:', err);
    } finally {
        client.release();
    }
}

module.exports = { pool, initializeDatabase };