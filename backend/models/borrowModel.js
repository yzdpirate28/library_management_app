const pool = require('../config/database');

class Borrow {
    static async create(borrowData) {
        const [result] = await pool.execute(
            `INSERT INTO emprunts 
            (user_id, livre_id, date_emprunt, date_retour_prevue, statut) 
            VALUES (?, ?, ?, ?, ?)`,
            [
                borrowData.user_id,
                borrowData.livre_id,
                borrowData.date_emprunt,
                borrowData.date_retour_prevue,
                borrowData.statut || 'EN_COURS'
            ]
        );
        return result.insertId;
    }

    static async createWithValidation(borrowData) {
        const [result] = await pool.execute(
            `INSERT INTO emprunts 
            (user_id, livre_id, date_emprunt, date_retour_prevue, statut) 
            VALUES (?, ?, ?, ?, 'EN_ATTENTE')`,
            [
                borrowData.user_id,
                borrowData.livre_id,
                borrowData.date_emprunt,
                borrowData.date_retour_prevue
            ]
        );
        return result.insertId;
    }

    static async findByUser(userId) {
        const [rows] = await pool.execute(
            `SELECT e.*, l.titre, l.auteur, l.image 
            FROM emprunts e 
            JOIN livres l ON e.livre_id = l.id 
            WHERE e.user_id = ? 
            ORDER BY e.date_emprunt DESC`,
            [userId]
        );
        return rows;
    }

    static async findAll({ page = 1, limit = 10, status = '' }) {
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT e.*, l.titre, l.auteur, u.nom as user_name, u.email 
            FROM emprunts e 
            JOIN livres l ON e.livre_id = l.id 
            JOIN users u ON e.user_id = u.id 
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            query += ` AND e.statut = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY e.date_emprunt DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [rows] = await pool.execute(query, params);
        
        // Count total
        let countQuery = `SELECT COUNT(*) as total FROM emprunts WHERE 1=1`;
        const countParams = [];
        
        if (status) {
            countQuery += ` AND statut = ?`;
            countParams.push(status);
        }
        
        const [countRows] = await pool.execute(countQuery, countParams);
        
        return {
            borrows: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countRows[0].total / limit)
        };
    }

    static async getPendingBorrows({ page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        
        const query = `
            SELECT e.*, l.titre, l.auteur, u.nom as user_name, u.email 
            FROM emprunts e 
            JOIN livres l ON e.livre_id = l.id 
            JOIN users u ON e.user_id = u.id 
            WHERE e.statut = 'EN_ATTENTE'
            ORDER BY e.date_emprunt DESC 
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.execute(query, [limit, offset]);
        
        // Count total
        const [countRows] = await pool.execute(
            'SELECT COUNT(*) as total FROM emprunts WHERE statut = "EN_ATTENTE"'
        );
        
        return {
            borrows: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countRows[0].total / limit)
        };
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            `SELECT e.*, l.titre, l.auteur, u.nom as user_name 
            FROM emprunts e 
            JOIN livres l ON e.livre_id = l.id 
            JOIN users u ON e.user_id = u.id 
            WHERE e.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async returnBorrow(id) {
        await pool.execute(
            `UPDATE emprunts SET 
            date_retour_reelle = CURDATE(),
            statut = 'RETOURNE'
            WHERE id = ?`,
            [id]
        );
    }

    static async validateBorrow(id, adminId) {
        await pool.execute(
            `UPDATE emprunts SET 
            statut = 'VALIDE',
            date_validation = CURDATE(),
            admin_id = ?
            WHERE id = ?`,
            [adminId, id]
        );
        
        // Ajouter à l'historique
        await pool.execute(
            `INSERT INTO validation_historique (emprunt_id, admin_id, action) 
            VALUES (?, ?, 'VALIDATION')`,
            [id, adminId]
        );
    }

    static async refuseBorrow(id, adminId, raison) {
        await pool.execute(
            `UPDATE emprunts SET 
            statut = 'REFUSE',
            date_validation = CURDATE(),
            admin_id = ?,
            raison_refus = ?
            WHERE id = ?`,
            [adminId, raison, id]
        );
        
        // Ajouter à l'historique
        await pool.execute(
            `INSERT INTO validation_historique (emprunt_id, admin_id, action, raison) 
            VALUES (?, ?, 'REFUS', ?)`,
            [id, adminId, raison]
        );
    }

    static async cancelBorrow(id, adminId, raison) {
        await pool.execute(
            `UPDATE emprunts SET 
            statut = 'REFUSE',
            date_validation = CURDATE(),
            admin_id = ?,
            raison_refus = ?
            WHERE id = ? AND statut = 'EN_ATTENTE'`,
            [adminId, raison, id]
        );
        
        // Ajouter à l'historique
        await pool.execute(
            `INSERT INTO validation_historique (emprunt_id, admin_id, action, raison) 
            VALUES (?, ?, 'ANNULATION', ?)`,
            [id, adminId, raison]
        );
    }

    static async checkOverdue() {
        const [rows] = await pool.execute(
            `UPDATE emprunts SET statut = 'EN_RETARD' 
            WHERE date_retour_prevue < CURDATE() AND statut = 'EN_COURS'`
        );
        return rows.affectedRows;
    }

    static async getValidationHistory(empruntId) {
        const [rows] = await pool.execute(
            `SELECT vh.*, u.nom as admin_name 
            FROM validation_historique vh
            LEFT JOIN users u ON vh.admin_id = u.id
            WHERE vh.emprunt_id = ?
            ORDER BY vh.date_action DESC`,
            [empruntId]
        );
        return rows;
    }

    static async getBorrowStats() {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut = 'VALIDE' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN statut = 'REFUSE' THEN 1 ELSE 0 END) as refuses,
                SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) as en_cours,
                SUM(CASE WHEN statut = 'RETOURNE' THEN 1 ELSE 0 END) as retournes,
                SUM(CASE WHEN statut = 'EN_RETARD' THEN 1 ELSE 0 END) as en_retard
        FROM emprunts
        `);
        
        return stats[0];
    }

    static async count() {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM emprunts');
        return rows[0].count;
    }

    static async getUserBorrowCount(userId) {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM emprunts WHERE user_id = ? AND statut = "EN_COURS"',
            [userId]
        );
        return rows[0].count;
    }

    static async isBookBorrowedByUser(userId, bookId) {
        const [rows] = await pool.execute(
            'SELECT * FROM emprunts WHERE user_id = ? AND livre_id = ? AND statut = "EN_COURS"',
            [userId, bookId]
        );
        return rows.length > 0;
    }
}

module.exports = Borrow;