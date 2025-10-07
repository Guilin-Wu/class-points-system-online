// auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./database.js');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key'; // 密钥

// 1. 注册接口
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: '请提供有效的邮箱和至少6位数的密码。' });
    }

    try {
        // 密码哈希加密
        const passwordHash = await bcrypt.hash(password, 10);

        const newUserResult = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, passwordHash]
        );

        const user = newUserResult.rows[0];

        // 为新注册的用户创建默认设置
        await pool.query(`INSERT INTO settings (user_id, key, value) VALUES ($1, 'turntableCost', '10')`, [user.id]);

        res.status(201).json({ message: '注册成功！', user: { id: user.id, email: user.email } });

    } catch (err) {
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ error: '该邮箱已被注册。' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 2. 登录接口
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: '邮箱和密码不能为空。' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: '邮箱或密码错误。' });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: '邮箱或密码错误。' });
        }

        // 密码验证成功，生成JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' } // 令牌有效期7天
        );

        res.status(200).json({
            message: '登录成功！',
            token,
            user: { id: user.id, email: user.email }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;