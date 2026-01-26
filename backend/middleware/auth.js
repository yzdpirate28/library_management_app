const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const auth = {
    // Vérifier le token
    verifyToken: (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token invalide.' });
        }
    },

    // Vérifier le rôle admin
    isAdmin: (req, res, next) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Accès refusé. Admin seulement.' });
        }
        next();
    },

    // Vérifier le rôle utilisateur
    isUser: (req, res, next) => {
        if (req.user.role !== 'USER') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }
        next();
    },

    // Vérifier si c'est l'utilisateur lui-même ou admin
    isOwnerOrAdmin: (req, res, next) => {
        const userId = parseInt(req.params.id || req.body.user_id);
        if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }
        next();
    }
};

module.exports = auth;