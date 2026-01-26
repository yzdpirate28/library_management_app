const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const dotenv = require('dotenv');

dotenv.config();

const authController = {
    // Inscription
    register: async (req, res) => {
        try {
            const { nom, email, password } = req.body;
            
            // Validation
            if (!nom || !email || !password) {
                return res.status(400).json({ message: 'Tous les champs sont requis' });
            }
            
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
            
            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Créer l'utilisateur
            const userId = await User.create({
                nom,
                email,
                password: hashedPassword,
                role: 'USER'
            });
            
            res.status(201).json({ 
                message: 'Utilisateur créé avec succès',
                userId 
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Connexion
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Validation
            if (!email || !password) {
                return res.status(400).json({ message: 'Email et mot de passe requis' });
            }
            
            // Vérifier l'utilisateur
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }
            
            // Vérifier le mot de passe
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }
            
            // Créer le token JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    nom: user.nom
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );
            
            res.json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    nom: user.nom,
                    email: user.email,
                    role: user.role
                }
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Profil utilisateur
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            res.json(user);
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Mettre à jour le profil
    updateProfile: async (req, res) => {
        try {
            const { nom, email } = req.body;
            
            // Validation
            if (!nom || !email) {
                return res.status(400).json({ message: 'Nom et email requis' });
            }
            
            await User.update(req.user.id, { nom, email, role: req.user.role });
            
            res.json({ message: 'Profil mis à jour avec succès' });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Changer le mot de passe
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            // Validation
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Tous les champs sont requis' });
            }
            
            // Récupérer l'utilisateur avec mot de passe
            const user = await User.findByEmail(req.user.email);
            
            // Vérifier l'ancien mot de passe
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
            }
            
            // Hacher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Mettre à jour le mot de passe
            await User.update(req.user.id, { 
                nom: user.nom, 
                email: user.email, 
                role: user.role,
                password: hashedPassword 
            });
            
            res.json({ message: 'Mot de passe changé avec succès' });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = authController;