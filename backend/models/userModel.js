const pool = require('../config/database');

class User {
    static async create(userData) {
        const [result] = await pool.execute(
            'INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)',
            [userData.nom, userData.email, userData.password, userData.role || 'USER']
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, nom, email, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.execute(
            'SELECT id, nom, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }

    static async update(id, userData) {
        await pool.execute(
            'UPDATE users SET nom = ?, email = ?, role = ? WHERE id = ?',
            [userData.nom, userData.email, userData.role, id]
        );
    }

    static async delete(id) {
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }

    static async count() {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
        return rows[0].count;
    }
}

module.exports = User;