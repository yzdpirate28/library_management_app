import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Créer une instance axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Services d'authentification
export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (userData) => api.put('/auth/profile', userData),
    changePassword: (passwords) => api.put('/auth/change-password', passwords)
};

// Services de livres
export const bookService = {
    getAllBooks: (params) => api.get('/books', { params }),
    getBookById: (id) => api.get(`/books/${id}`),
createBook: (bookData) => {
  const formData = new FormData();

Object.keys(bookData).forEach((key) => {
    if (bookData[key] === undefined) bookData[key] = null;
});

  return api.post('/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

,
    updateBook: (id, bookData) => {
        const formData = new FormData();
        Object.keys(bookData).forEach(key => {
            if (bookData[key] !== undefined && bookData[key] !== null) {
                formData.append(key, bookData[key]);
            }
        });
        return api.put(`/books/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteBook: (id) => api.delete(`/books/${id}`),
    getCategories: () => api.get('/books/categories'),
    getStats: () => api.get('/books/stats')
};

// Services d'emprunts
export const borrowService = {
    borrowBook: (bookId) => api.post('/borrows', { livre_id: bookId }),
    returnBook: (borrowId) => api.put(`/borrows/return/${borrowId}`),
    getMyBorrows: () => api.get('/borrows/my-borrows'),
    getAllBorrows: (params) => api.get('/borrows', { params }),
    getBorrowById: (id) => api.get(`/borrows/${id}`),
    checkOverdue: () => api.post('/borrows/check-overdue'),
    
    // Nouvelles fonctionnalités de validation
    getPendingBorrows: (params) => api.get('/borrows/pending', { params }),
    validateBorrow: (borrowId) => api.put(`/borrows/validate/${borrowId}`),
    refuseBorrow: (borrowId, raison) => api.put(`/borrows/refuse/${borrowId}`, { raison }),
    cancelBorrowRequest: (borrowId, raison) => api.put(`/borrows/cancel/${borrowId}`, { raison }),
    getValidationHistory: (borrowId) => api.get(`/borrows/history/${borrowId}`),
    getBorrowStats: () => api.get('/borrows/stats/borrows')
};

export default api;