const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const auth = require('../middleware/auth');

// Routes protégées - Utilisateurs
router.post('/', auth.verifyToken, borrowController.borrowBookRequest);
router.get('/my-borrows', auth.verifyToken, borrowController.getUserBorrows);
router.put('/return/:id', auth.verifyToken, borrowController.returnBook);
router.put('/cancel/:id', auth.verifyToken, borrowController.cancelBorrowRequest);

// Routes protégées - Admin seulement
router.get('/', auth.verifyToken, auth.isAdmin, borrowController.getAllBorrows);
router.get('/pending', auth.verifyToken, auth.isAdmin, borrowController.getPendingBorrows);
router.put('/validate/:id', auth.verifyToken, auth.isAdmin, borrowController.validateBorrow);
router.put('/refuse/:id', auth.verifyToken, auth.isAdmin, borrowController.refuseBorrow);
router.get('/stats/borrows', auth.verifyToken, auth.isAdmin, borrowController.getBorrowStats);
router.post('/check-overdue', auth.verifyToken, auth.isAdmin, borrowController.checkOverdue);

// Routes protégées - Générales (doivent être en dernier)
router.get('/history/:id', auth.verifyToken, borrowController.getValidationHistory);
router.get('/:id', auth.verifyToken, borrowController.getBorrowById); // Doit être en dernier

module.exports = router;