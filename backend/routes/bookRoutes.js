import express from 'express';
import bookController from '../controllers/bookController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Routes publiques
router.get('/', bookController.getAllBooks);
router.get('/categories', bookController.getCategories);
router.get('/stats', bookController.getStats);
router.get('/:id', bookController.getBookById);
router.get('/image/:imageName', bookController.getBookImage);

// Routes protégées - Admin seulement
router.post(
  '/',
  auth.verifyToken,
  auth.isAdmin,
  upload.single('image'),
  bookController.createBook
);

router.put(
  '/:id',
  auth.verifyToken,
  auth.isAdmin,
  upload.single('image'),
  bookController.updateBook
);

router.delete(
  '/:id',
  auth.verifyToken,
  auth.isAdmin,
  bookController.deleteBook
);

// Préflight CORS
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

router.options('/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

export default router;
