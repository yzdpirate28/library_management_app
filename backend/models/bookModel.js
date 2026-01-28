const pool = require('../config/database');

class Book {
    static async create(bookData) {
const [result] = await pool.execute(
    `INSERT INTO livres 
    (titre, auteur, description, categorie, isbn, date_publication, nombre_exemplaires, exemplaires_disponibles, image) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
        bookData.titre,
        bookData.auteur,
        bookData.description || null,
        bookData.categorie || null,
        bookData.isbn || null,
        bookData.date_publication || null,
        bookData.nombre_exemplaires,
        bookData.nombre_exemplaires,
        bookData.image || null
    ]
);

        return result.insertId;
    }

    static async findAll({ page = 1, limit = 10, search = '', category = '', sortBy = 'created_at', order = 'DESC' }) {
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT * FROM livres 
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ` AND (titre LIKE ? OR auteur LIKE ? OR description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (category) {
            query += ` AND categorie = ?`;
            params.push(category);
        }
        
        query += ` ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [rows] = await pool.execute(query, params);
        
        // Count total
        let countQuery = `SELECT COUNT(*) as total FROM livres WHERE 1=1`;
        const countParams = [];
        
        if (search) {
            countQuery += ` AND (titre LIKE ? OR auteur LIKE ? OR description LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (category) {
            countQuery += ` AND categorie = ?`;
            countParams.push(category);
        }
        
        const [countRows] = await pool.execute(countQuery, countParams);
        
        return {
            books: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countRows[0].total / limit)
        };
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM livres WHERE id = ?', [id]);
        return rows[0];
    }

    static async update(id, bookData) {
await pool.execute(
    `UPDATE livres SET 
    titre = ?, auteur = ?, description = ?, categorie = ?, 
    isbn = ?, date_publication = ?, nombre_exemplaires = ?,
    image = ?
    WHERE id = ?`,
    [
        bookData.titre,
        bookData.auteur,
        bookData.description || null,
        bookData.categorie || null,
        bookData.isbn || null,
        bookData.date_publication || null,
        bookData.nombre_exemplaires,
        bookData.image || null,
        id
    ]
);

    }

    static async delete(id) {
        await pool.execute('DELETE FROM livres WHERE id = ?', [id]);
    }

    static async updateAvailability(id, change) {
        await pool.execute(
            'UPDATE livres SET exemplaires_disponibles = exemplaires_disponibles + ? WHERE id = ?',
            [change, id]
        );
    }

    static async getCategories() {
        const [rows] = await pool.execute('SELECT DISTINCT categorie FROM livres WHERE categorie IS NOT NULL');
        return rows.map(row => row.categorie);
    }

    static async count() {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM livres');
        return rows[0].count;
    }

    static async getStats() {
        const [totalBooks] = await pool.execute('SELECT COUNT(*) as count FROM livres');
        const [availableBooks] = await pool.execute('SELECT SUM(exemplaires_disponibles) as count FROM livres');
        const [borrowedBooks] = await pool.execute('SELECT COUNT(*) as count FROM emprunts WHERE statut = "EN_COURS"');
        
        return {
            total: totalBooks[0].count,
            available: availableBooks[0].count || 0,
            borrowed: borrowedBooks[0].count
        };
    }
}

module.exports = Book;