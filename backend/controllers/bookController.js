const Book = require('../models/bookModel');
const Borrow = require('../models/borrowModel');
const path = require('path');
const fs = require('fs');

const bookController = {
    // Créer un livre
    createBook: async (req, res) => {
        try {
            const bookData = req.body;
            
            // Validation
            if (!bookData.titre || !bookData.auteur) {
                return res.status(400).json({ message: 'Titre et auteur sont requis' });
            }
            
            // Gérer l'image
            if (req.file) {
                bookData.image = req.file.filename;
            }
            
            // Créer le livre
            const bookId = await Book.create(bookData);
            
            res.status(201).json({
                message: 'Livre créé avec succès',
                bookId
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Récupérer tous les livres
    getAllBooks: async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                category = '',
                sortBy = 'created_at',
                order = 'DESC' 
            } = req.query;
            
            const result = await Book.findAll({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                category,
                sortBy,
                order
            });
            
            res.json(result);
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Récupérer un livre par ID
    getBookById: async (req, res) => {
        try {
            const book = await Book.findById(req.params.id);
            
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            
            // Vérifier si l'utilisateur connecté a emprunté ce livre
            let isBorrowed = false;
            if (req.user) {
                isBorrowed = await Borrow.isBookBorrowedByUser(req.user.id, book.id);
            }
            
            res.json({
                ...book,
                isBorrowed
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Mettre à jour un livre
updateBook: async (req, res) => {
        try {
            const bookId = req.params.id;
            const bookData = req.body;
            
            console.log('Tentative de mise à jour du livre:', bookId);
            console.log('Données reçues:', bookData);
            console.log('Fichier reçu:', req.file);
            
            // Vérifier si le livre existe
            const existingBook = await Book.findById(bookId);
            if (!existingBook) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            
            // Si une nouvelle image est uploadée
            if (req.file) {
                // Supprimer l'ancienne image si elle existe
                if (existingBook.image) {
                    const oldImagePath = path.join(__dirname, '..', 'uploads', existingBook.image);
                    if (fs.existsSync(oldImagePath)) {
                        try {
                            fs.unlinkSync(oldImagePath);
                            console.log('Ancienne image supprimée:', existingBook.image);
                        } catch (err) {
                            console.error('Erreur lors de la suppression de l\'ancienne image:', err);
                        }
                    }
                }
                bookData.image = req.file.filename;
            } else {
                // Garder l'image existante si aucune nouvelle image n'est envoyée
                bookData.image = existingBook.image;
            }
            
            // Convertir le nombre d'exemplaires en entier
            if (bookData.nombre_exemplaires) {
                bookData.nombre_exemplaires = parseInt(bookData.nombre_exemplaires);
                // Mettre à jour les exemplaires disponibles
                const difference = bookData.nombre_exemplaires - existingBook.nombre_exemplaires;
                if (difference > 0) {
                    bookData.exemplaires_disponibles = existingBook.exemplaires_disponibles + difference;
                } else {
                    bookData.exemplaires_disponibles = Math.max(
                        0, 
                        existingBook.exemplaires_disponibles + difference
                    );
                }
            }
            
            // Mettre à jour le livre
            await Book.update(bookId, bookData);
            
            // Récupérer le livre mis à jour
            const updatedBook = await Book.findById(bookId);
            
            res.json({ 
                message: 'Livre mis à jour avec succès',
                book: updatedBook
            });
            
        } catch (error) {
            console.error('Erreur détaillée dans updateBook:', error);
            res.status(500).json({ 
                message: 'Erreur serveur lors de la mise à jour du livre',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Supprimer un livre
    deleteBook: async (req, res) => {
        try {
            const bookId = req.params.id;
            
            // Vérifier si le livre existe
            const existingBook = await Book.findById(bookId);
            if (!existingBook) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            
            // Supprimer l'image si elle existe
            if (existingBook.image) {
                const imagePath = path.join('uploads', existingBook.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            
            // Supprimer le livre
            await Book.delete(bookId);
            
            res.json({ message: 'Livre supprimé avec succès' });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Récupérer les catégories
    getCategories: async (req, res) => {
        try {
            const categories = await Book.getCategories();
            res.json(categories);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Récupérer les statistiques
    getStats: async (req, res) => {
        try {
            const stats = await Book.getStats();
            res.json(stats);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Servir les images
    getBookImage: async (req, res) => {
        try {
            const imageName = req.params.imageName;
            const imagePath = path.join(__dirname, '..', 'uploads', imageName);
            
            if (fs.existsSync(imagePath)) {
                res.sendFile(imagePath);
            } else {
                res.status(404).json({ message: 'Image non trouvée' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = bookController;