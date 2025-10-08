const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./database.js');
const authRoutes = require('./auth.js');
const { authenticateToken } = require('./middleware.js');

const app = express();
const PORT = process.env.PORT || 3000;

initializeDatabase();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);

const apiRouter = express.Router();
apiRouter.use(authenticateToken);

async function adjustStudentPoints(client, studentId, delta, reason, userId) {
    const studentResult = await client.query(`SELECT * FROM students WHERE id = $1 AND user_id = $2`, [studentId, userId]);
    if (studentResult.rows.length === 0) {
        throw new Error(`未找到ID为 ${studentId} 的学生`);
    }
    const student = studentResult.rows[0];
    const newPoints = student.points + delta;
    let newTotalEarned = student.totalearnedpoints;
    let newTotalDeductions = student.totaldeductions;
    if (delta > 0) newTotalEarned += delta;
    if (delta < 0 && !reason.includes('兑换') && !reason.includes('抽奖')) newTotalDeductions += Math.abs(delta);
    await client.query(
        `UPDATE students SET points = $1, totalEarnedPoints = $2, totalDeductions = $3 WHERE id = $4 AND user_id = $5`,
        [newPoints, newTotalEarned, newTotalDeductions, studentId, userId]
    );
    const changeText = delta > 0 ? `+${delta}` : `${delta}`;
    await client.query(
        `INSERT INTO records (time, studentId, studentName, change, reason, finalPoints, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [new Date().toLocaleString(), studentId, student.name, changeText, reason, newPoints, userId]
    );
}

apiRouter.get('/data', async (req, res) => {
    const userId = req.user.userId;
    try {
        const queries = [
            pool.query("SELECT * FROM students WHERE user_id = $1 ORDER BY name", [userId]),
            pool.query("SELECT * FROM groups WHERE user_id = $1 ORDER BY name", [userId]),
            pool.query("SELECT * FROM rewards WHERE user_id = $1 ORDER BY cost", [userId]),
            pool.query("SELECT * FROM records WHERE user_id = $1 ORDER BY id DESC", [userId]),
            pool.query("SELECT * FROM turntablePrizes WHERE user_id = $1", [userId]),
            pool.query("SELECT value FROM settings WHERE user_id = $1 AND key = 'turntableCost'", [userId])
        ];
        const [s, g, rw, rc, tp, tc] = await Promise.all(queries);
        res.json({
            students: s.rows, groups: g.rows, rewards: rw.rows,
            records: rc.rows, turntablePrizes: tp.rows,
            turntableCost: tc.rows.length ? parseInt(tc.rows[0].value) : 10
        });
    } catch (err) {
        res.status(500).json({ error: '获取数据失败' });
    }
});

apiRouter.post('/students', async (req, res) => {
    const userId = req.user.userId;
    const { id, name, group } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID和姓名不能为空' });
    try {
        await pool.query( `INSERT INTO students (id, name, "group", user_id) VALUES ($1, $2, $3, $4)`, [id, name, group || '', userId] );
        res.status(201).json({ message: '学生添加成功' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: `ID '${id}' 已存在` });
        res.status(500).json({ error: '数据库操作失败' });
    }
});

apiRouter.put('/students/:id', async (req, res) => {
    const userId = req.user.userId;
    const { name, group } = req.body;
    if (!name) return res.status(400).json({ error: '姓名不能为空' });
    try {
        const result = await pool.query(`UPDATE students SET name = $1, "group" = $2 WHERE id = $3 AND user_id = $4`, [name, group || '', req.params.id, userId]);
        if (result.rowCount === 0) return res.status(404).json({ error: '未找到该学生' });
        res.status(200).json({ message: '学生信息更新成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.delete('/data/all', async (req, res) => {
    const userId = req.user.userId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const tables = ['records', 'students', 'groups', 'rewards', 'turntablePrizes'];
        for (const table of tables) {
            await client.query(`DELETE FROM ${table} WHERE user_id = $1;`, [userId]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: '所有数据已清空，班级已被重置！' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error clearing all data:', err);
        res.status(500).json({ error: '清空所有数据失败' });
    } finally {
        client.release();
    }
});

// [新增] 接口二：仅清空积分相关数据
apiRouter.delete('/data/points', async (req, res) => {
    const userId = req.user.userId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. 将所有学生的积分相关字段重置为0
        await client.query(
            `UPDATE students SET points = 0, totalearnedpoints = 0, totaldeductions = 0 WHERE user_id = $1`,
            [userId]
        );
        // 2. 删除所有的积分记录
        await client.query(
            `DELETE FROM records WHERE user_id = $1`,
            [userId]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: '所有积分数据已清空！' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error clearing points data:', err);
        res.status(500).json({ error: '清空积分数据失败' });
    } finally {
        client.release();
    }
});

apiRouter.post('/students/:id/points', async (req, res) => {
    const userId = req.user.userId;
    const { delta, reason } = req.body;
    if (typeof delta !== 'number' || !reason) return res.status(400).json({ error: '分值和原因不能为空' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await adjustStudentPoints(client, req.params.id, delta, reason, userId);
        await client.query('COMMIT');
        res.status(200).json({ message: '积分调整成功' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message || '积分调整失败' });
    } finally { client.release(); }
});

// --- 小组管理 (Groups) ---
apiRouter.post('/groups', async (req, res) => {
    const userId = req.user.userId;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '小组名称不能为空' });
    try {
        const newGroupId = `_group${Date.now()}`;
        await pool.query(`INSERT INTO groups (id, name, user_id) VALUES ($1, $2, $3)`, [newGroupId, name, userId]);
        res.status(201).json({ message: '小组添加成功', id: newGroupId });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

// ... 所有其他业务接口都像上面一样，加上 userId ...
// (此处将为你补全所有接口)

apiRouter.put('/groups/:id', async (req, res) => {
    const userId = req.user.userId;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '小组名称不能为空' });
    try {
        const result = await pool.query(`UPDATE groups SET name = $1 WHERE id = $2 AND user_id = $3`, [name, req.params.id, userId]);
        if (result.rowCount === 0) return res.status(404).json({ error: '未找到该小组' });
        res.status(200).json({ message: '小组信息更新成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.delete('/groups/:id', async (req, res) => {
    const userId = req.user.userId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE students SET "group" = '' WHERE "group" = $1 AND user_id = $2`, [req.params.id, userId]);
        await client.query(`DELETE FROM groups WHERE id = $1 AND user_id = $2`, [req.params.id, userId]);
        await client.query('COMMIT');
        res.status(200).json({ message: '小组删除成功' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: '删除小组失败' });
    } finally { client.release(); }
});

apiRouter.put('/groups/:id/members', async (req, res) => {
    const userId = req.user.userId;
    const { memberIds } = req.body;
    if (!Array.isArray(memberIds)) return res.status(400).json({ error: '数据格式不正确' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE students SET "group" = '' WHERE "group" = $1 AND user_id = $2`, [req.params.id, userId]);
        if (memberIds.length > 0) {
            const placeholders = memberIds.map((_, i) => `$${i + 3}`).join(',');
            await client.query(`UPDATE students SET "group" = $1 WHERE user_id = $2 AND id IN (${placeholders})`, [req.params.id, userId, ...memberIds]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: '小组成员更新成功' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: '更新小组成员失败' });
    } finally { client.release(); }
});

// --- 批量积分 (Bulk Points) ---
apiRouter.post('/groups/:id/points', async (req, res) => {
    const userId = req.user.userId;
    const { pointsDelta, reason } = req.body;
    if (!pointsDelta || !reason) return res.status(400).json({ error: '分值和原因不能为空' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const studentsResult = await client.query(`SELECT id FROM students WHERE "group" = $1 AND user_id = $2`, [req.params.id, userId]);
        if (studentsResult.rows.length === 0) throw new Error('小组内没有学生');
        for (const student of studentsResult.rows) {
            await adjustStudentPoints(client, student.id, pointsDelta, reason, userId);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: '小组加分成功' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message || '小组加分失败' });
    } finally { client.release(); }
});

apiRouter.post('/class/points', async (req, res) => {
    const userId = req.user.userId;
    const { pointsDelta, reason } = req.body;
    if (!pointsDelta || !reason) return res.status(400).json({ error: '分值和原因不能为空' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const studentsResult = await client.query(`SELECT id FROM students WHERE user_id = $1`, [userId]);
        if (studentsResult.rows.length === 0) throw new Error('班级内没有学生');
        for (const student of studentsResult.rows) {
            await adjustStudentPoints(client, student.id, pointsDelta, reason, userId);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: '全班积分调整成功' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message || '全班积分调整失败' });
    } finally { client.release(); }
});

// --- 奖品与转盘 (Rewards & Turntable) ---
apiRouter.post('/rewards', async (req, res) => {
    const userId = req.user.userId;
    const { name, cost } = req.body;
    if (!name || !cost) return res.status(400).json({ error: '奖品信息不全' });
    try {
        const newId = `_reward${Date.now()}`;
        await pool.query(`INSERT INTO rewards (id, name, cost, user_id) VALUES ($1, $2, $3, $4)`, [newId, name, cost, userId]);
        res.status(201).json({ message: '奖品添加成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.put('/rewards/:id', async (req, res) => {
    const userId = req.user.userId;
    const { name, cost } = req.body;
    if (!name || !cost) return res.status(400).json({ error: '奖品信息不全' });
    try {
        const result = await pool.query(`UPDATE rewards SET name = $1, cost = $2 WHERE id = $3 AND user_id = $4`, [name, cost, req.params.id, userId]);
        if (result.rowCount === 0) return res.status(404).json({ error: '未找到该奖品' });
        res.status(200).json({ message: '奖品更新成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.delete('/rewards/:id', async (req, res) => {
    const userId = req.user.userId;
    try {
        await pool.query(`DELETE FROM rewards WHERE id = $1 AND user_id = $2`, [req.params.id, userId]);
        res.status(200).json({ message: '奖品删除成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.post('/turntable/prizes', async (req, res) => {
    const userId = req.user.userId;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: '奖品名称不能为空' });
    try {
        const newId = `_prize${Date.now()}`;
        await pool.query(`INSERT INTO turntablePrizes (id, text, user_id) VALUES ($1, $2, $3)`, [newId, text, userId]);
        res.status(201).json({ message: '转盘奖品添加成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.put('/turntable/prizes/:id', async (req, res) => {
    const userId = req.user.userId;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: '奖品名称不能为空' });
    try {
        const result = await pool.query(`UPDATE turntablePrizes SET text = $1 WHERE id = $2 AND user_id = $3`, [text, req.params.id, userId]);
        if (result.rowCount === 0) return res.status(404).json({ error: '未找到该奖品' });
        res.status(200).json({ message: '转盘奖品更新成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.delete('/turntable/prizes/:id', async (req, res) => {
    const userId = req.user.userId;
    try {
        await pool.query(`DELETE FROM turntablePrizes WHERE id = $1 AND user_id = $2`, [req.params.id, userId]);
        res.status(200).json({ message: '转盘奖品删除成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

apiRouter.put('/settings/turntableCost', async (req, res) => {
    const userId = req.user.userId;
    const { cost } = req.body;
    if (typeof cost !== 'number' || cost < 0) return res.status(400).json({ error: '无效的成本值' });
    try {
        await pool.query(`UPDATE settings SET value = $1 WHERE key = 'turntableCost' AND user_id = $2`, [cost, userId]);
        res.status(200).json({ message: '抽奖成本更新成功' });
    } catch (err) { res.status(500).json({ error: '数据库操作失败' }); }
});

// --- 数据导入/导出 (Data Management) ---
apiRouter.delete('/data', async (req, res) => {
    const userId = req.user.userId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const tables = ['records', 'students', 'groups', 'rewards', 'turntablePrizes'];
        for (const table of tables) {
            await client.query(`DELETE FROM ${table} WHERE user_id = $1;`, [userId]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: '所有数据已清空' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: '清空数据失败' });
    } finally { client.release(); }
});


// server.js (找到並替換這個接口)

apiRouter.post('/data/import', async (req, res) => {
    const userId = req.user.userId;
    const data = req.body;
    
    if (!data.students || !data.groups) {
        return res.status(400).json({ error: '输入的数据格式不正确！' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const tablesToClear = ['records', 'students', 'groups', 'rewards', 'turntablePrizes'];
        for (const table of tablesToClear) {
            await client.query(`DELETE FROM ${table} WHERE user_id = $1;`, [userId]);
        }
        
        // --- 插入邏輯 ---
        if (data.students) for (const s of data.students) {
            await client.query(
                `INSERT INTO students (id, name, "group", points, totalearnedpoints, totaldeductions, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [s.id, s.name, s.group, s.points, s.totalearnedpoints || s.totalEarnedPoints, s.totaldeductions || s.totalDeductions, userId]
            );
        }
        if (data.groups) for (const g of data.groups) {
            await client.query(`INSERT INTO groups (id, name, user_id) VALUES ($1, $2, $3)`, [g.id, g.name, userId]);
        }
        if (data.rewards) for (const r of data.rewards) {
            await client.query(`INSERT INTO rewards (id, name, cost, user_id) VALUES ($1, $2, $3, $4)`, [r.id, r.name, r.cost, userId]);
        }
        if (data.records) for (const rec of data.records) {
            // [最終修復] 在插入 records 時，忽略 id 列，讓數據庫自動生成
            await client.query(
                `INSERT INTO records (time, studentid, studentname, change, reason, finalpoints, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    rec.time,
                    rec.studentid || rec.studentId,
                    rec.studentname || rec.studentName,
                    rec.change, 
                    rec.reason,
                    rec.finalpoints || rec.finalPoints,
                    userId
                ]
            );
        }
        if (data.turntablePrizes) for (const p of data.turntablePrizes) {
            await client.query(`INSERT INTO turntablePrizes (id, text, user_id) VALUES ($1, $2, $3)`, [p.id, p.text, userId]);
        }
        if (data.turntableCost) {
             await client.query(
                `INSERT INTO settings (user_id, key, value) VALUES ($1, 'turntableCost', $2) ON CONFLICT (user_id, key) DO UPDATE SET value = $2`,
                [userId, data.turntableCost]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({ message: '导入数据成功！' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Import data transaction failed:', err);
        res.status(500).json({ error: '导入数据失败，请检查文件内容和格式。' });
    } finally {
        client.release();
    }
});


// [新增] POST /api/students/import: 专门用于从Excel导入学生列表
apiRouter.post('/students/import', async (req, res) => {
    const userId = req.user.userId;
    const students = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: '数据格式错误' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 只清空当前用户的学生表
        await client.query(`DELETE FROM students WHERE user_id = $1;`, [userId]);

        for (const s of students) {
            await client.query(`INSERT INTO students (id, name, "group", points, totalEarnedPoints, totalDeductions, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
            [s.id, s.name, s.group || '', s.points || 0, s.totalEarnedPoints || s.points || 0, s.totalDeductions || 0, userId]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: `成功导入 ${students.length} 名学生！` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Excel import failed:', err);
        res.status(500).json({ error: '数据库操作失败' });
    } finally {
        client.release();
    }
});
// 3. 将受保护的业务接口挂载到 /api 路径下
app.use('/api', apiRouter);

// --- Server Listener ---
app.listen(PORT, () => {
    console.log(`Backend service is running on port ${PORT}`);
});