const Borrow = require('../models/borrowModel');
const Book = require('../models/bookModel');
const pool = require('../config/database');

const borrowController = {
    // Soumettre une demande d'emprunt (attente validation)
    borrowBookRequest: async (req, res) => {
        try {
            const { livre_id } = req.body;
            const user_id = req.user.id;
            
            // Validation
            if (!livre_id) {
                return res.status(400).json({ message: 'ID du livre requis' });
            }
            
            // Vérifier si le livre existe
            const book = await Book.findById(livre_id);
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            
            // Vérifier si l'utilisateur a déjà une demande en attente pour ce livre
            const [pendingBorrow] = await pool.execute(
                'SELECT * FROM emprunts WHERE user_id = ? AND livre_id = ? AND statut = "EN_ATTENTE"',
                [user_id, livre_id]
            );
            
            if (pendingBorrow.length > 0) {
                return res.status(400).json({ message: 'Vous avez déjà une demande en attente pour ce livre' });
            }
            
            // Vérifier le nombre de demandes en attente
            const [pendingCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM emprunts WHERE user_id = ? AND statut = "EN_ATTENTE"',
                [user_id]
            );
            
            if (pendingCount[0].count >= 3) {
                return res.status(400).json({ message: 'Vous avez trop de demandes en attente (max: 3)' });
            }
            
            // Calculer les dates
            const date_emprunt = new Date();
            const date_retour_prevue = new Date(date_emprunt);
            date_retour_prevue.setDate(date_retour_prevue.getDate() + 14);
            
            // Créer la demande d'emprunt
            const borrowId = await Borrow.createWithValidation({
                user_id,
                livre_id,
                date_emprunt: date_emprunt.toISOString().split('T')[0],
                date_retour_prevue: date_retour_prevue.toISOString().split('T')[0]
            });
            
            res.status(201).json({
                message: 'Demande d\'emprunt soumise avec succès. En attente de validation par l\'admin.',
                borrowId,
                date_retour_prevue: date_retour_prevue.toISOString().split('T')[0]
            });
            
        } catch (error) {
            console.error('Erreur borrowBookRequest:', error);
            res.status(500).json({ 
                message: 'Erreur serveur lors de la demande d\'emprunt',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer les emprunts de l'utilisateur
    getUserBorrows: async (req, res) => {
        try {
            const user_id = req.user.id;
            const borrows = await Borrow.findByUser(user_id);
            res.json(borrows);
        } catch (error) {
            console.error('Erreur getUserBorrows:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer tous les emprunts (admin)
    getAllBorrows: async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10,
                status = ''
            } = req.query;
            
            const result = await Borrow.findAll({
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });
            
            res.json(result);
            
        } catch (error) {
            console.error('Erreur getAllBorrows:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer un emprunt par ID
    getBorrowById: async (req, res) => {
        try {
            const borrow = await Borrow.findById(req.params.id);
            
            if (!borrow) {
                return res.status(404).json({ message: 'Emprunt non trouvé' });
            }
            
            // Vérifier les permissions
            if (req.user.role !== 'ADMIN' && req.user.id !== borrow.user_id) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            res.json(borrow);
            
        } catch (error) {
            console.error('Erreur getBorrowById:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Retourner un livre
    returnBook: async (req, res) => {
        try {
            const borrowId = req.params.id;
            
            // Vérifier si l'emprunt existe
            const borrow = await Borrow.findById(borrowId);
            if (!borrow) {
                return res.status(404).json({ message: 'Emprunt non trouvé' });
            }
            
            // Vérifier les permissions
            if (req.user.role !== 'ADMIN' && req.user.id !== borrow.user_id) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            // Vérifier si le livre est déjà retourné
            if (borrow.statut === 'RETOURNE') {
                return res.status(400).json({ message: 'Livre déjà retourné' });
            }
            
            // Marquer comme retourné
            await Borrow.returnBorrow(borrowId);
            
            // Mettre à jour la disponibilité du livre
            await Book.updateAvailability(borrow.livre_id, 1);
            
            res.json({ message: 'Livre retourné avec succès' });
            
        } catch (error) {
            console.error('Erreur returnBook:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Annuler une demande d'emprunt (user ou admin)
    cancelBorrowRequest: async (req, res) => {
        try {
            const borrowId = req.params.id;
            const userId = req.user.id;
            const { raison } = req.body;
            
            // Vérifier si l'emprunt existe
            const borrow = await Borrow.findById(borrowId);
            if (!borrow) {
                return res.status(404).json({ message: 'Emprunt non trouvé' });
            }
            
            // Vérifier les permissions
            if (req.user.role !== 'ADMIN' && borrow.user_id !== userId) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            if (borrow.statut !== 'EN_ATTENTE') {
                return res.status(400).json({ message: 'Cette demande ne peut plus être annulée' });
            }
            
            // Annuler la demande
            const adminId = req.user.role === 'ADMIN' ? userId : null;
            await Borrow.cancelBorrow(borrowId, adminId, raison || 'Annulé par l\'utilisateur');
            
            res.json({ 
                message: 'Demande d\'emprunt annulée avec succès',
                borrowId 
            });
            
        } catch (error) {
            console.error('Erreur cancelBorrowRequest:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer les emprunts en attente (admin)
    getPendingBorrows: async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10
            } = req.query;
            
            const result = await Borrow.getPendingBorrows({
                page: parseInt(page),
                limit: parseInt(limit)
            });
            
            res.json(result);
            
        } catch (error) {
            console.error('Erreur getPendingBorrows:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Valider un emprunt (admin)
    validateBorrow: async (req, res) => {
        try {
            const borrowId = req.params.id;
            const adminId = req.user.id;
            
            // Vérifier si l'emprunt existe et est en attente
            const borrow = await Borrow.findById(borrowId);
            if (!borrow) {
                return res.status(404).json({ message: 'Emprunt non trouvé' });
            }
            
            if (borrow.statut !== 'EN_ATTENTE') {
                return res.status(400).json({ message: 'Cet emprunt ne peut plus être validé' });
            }
            
            // Vérifier la disponibilité du livre
            const book = await Book.findById(borrow.livre_id);
            if (book.exemplaires_disponibles <= 0) {
                return res.status(400).json({ message: 'Livre non disponible' });
            }
            
            // Valider l'emprunt
            await Borrow.validateBorrow(borrowId, adminId);
            
            // Mettre à jour la disponibilité du livre
            await Book.updateAvailability(borrow.livre_id, -1);
            
            // Mettre à jour le statut
            await pool.execute(
                'UPDATE emprunts SET statut = "EN_COURS" WHERE id = ?',
                [borrowId]
            );
            
            res.json({ 
                message: 'Emprunt validé avec succès',
                borrowId 
            });
            
        } catch (error) {
            console.error('Erreur validateBorrow:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Refuser un emprunt (admin)
    refuseBorrow: async (req, res) => {
        try {
            const borrowId = req.params.id;
            const adminId = req.user.id;
            const { raison } = req.body;
            
            if (!raison || raison.trim().length === 0) {
                return res.status(400).json({ message: 'Veuillez fournir une raison pour le refus' });
            }
            
            // Vérifier si l'emprunt existe et est en attente
            const borrow = await Borrow.findById(borrowId);
            if (!borrow) {
                return res.status(404).json({ message: 'Emprunt non trouvé' });
            }
            
            if (borrow.statut !== 'EN_ATTENTE') {
                return res.status(400).json({ message: 'Cet emprunt ne peut plus être refusé' });
            }
            
            // Refuser l'emprunt
            await Borrow.refuseBorrow(borrowId, adminId, raison);
            
            res.json({ 
                message: 'Emprunt refusé avec succès',
                borrowId 
            });
            
        } catch (error) {
            console.error('Erreur refuseBorrow:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer l'historique de validation
    getValidationHistory: async (req, res) => {
        try {
            const empruntId = req.params.id;
            const history = await Borrow.getValidationHistory(empruntId);
            res.json(history);
        } catch (error) {
            console.error('Erreur getValidationHistory:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Vérifier les retards
    checkOverdue: async (req, res) => {
        try {
            const updated = await Borrow.checkOverdue();
            res.json({ 
                message: `Mise à jour des retards effectuée`,
                updated 
            });
        } catch (error) {
            console.error('Erreur checkOverdue:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer les statistiques d'emprunt
    getBorrowStats: async (req, res) => {
        try {
            const stats = await Borrow.getBorrowStats();
            res.json(stats);
        } catch (error) {
            console.error('Erreur getBorrowStats:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = borrowController;