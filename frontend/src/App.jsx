import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import NavigationBar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages publiques
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Pages utilisateur
import BookList from './components/books/BookList';
import BookDetails from './components/books/BookDetails';
import Profile from './components/auth/Profile';
import MyBorrows from './components/borrows/MyBorrows';

// Pages admin
import AdminDashboard from './components/dashboard/AdminDashboard';
import AdminBookList from './components/books/BookList';
import AdminBorrowList from './components/borrows/BorrowList'; // Maintenant ce fichier existe
import BookForm from './components/books/BookForm';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

// Import Card pour le composant BorrowList si nécessaire
import { Card } from 'react-bootstrap';
import MyBorrowRequests from './components/borrows/MyBorrowRequests';
import PendingBorrows from './components/borrows/PendingBorrows';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="d-flex flex-column min-vh-100">
                    <NavigationBar />
                    <main className="flex-grow-1">
                        <Routes>
                            {/* Routes publiques */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/books" element={<BookList />} />
                            <Route path="/books/:id" element={<BookDetails />} />
                            
                            {/* Routes utilisateur */}
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            } />
                            <Route path="/my-borrows" element={
                                <PrivateRoute>
                                    <MyBorrows />
                                </PrivateRoute>
                            } />
                            
                            {/* Routes admin */}
                            <Route path="/admin/dashboard" element={
                                <PrivateRoute adminOnly>
                                    <AdminDashboard />
                                </PrivateRoute>
                            } />
                            <Route path="/admin/books" element={
                                <PrivateRoute adminOnly>
                                    <AdminBookList adminMode />
                                </PrivateRoute>
                            } />
                            <Route path="/admin/books/add" element={
                                <PrivateRoute adminOnly>
                                    <BookForm />
                                </PrivateRoute>
                            } />
                            <Route path="/admin/books/edit/:id" element={
                                <PrivateRoute adminOnly>
                                    <BookForm edit />
                                </PrivateRoute>
                            } />
                            <Route path="/admin/borrows" element={
                                <PrivateRoute adminOnly>
                                    <AdminBorrowList />
                                </PrivateRoute>
                            } />

                            <Route path="/my-requests" element={
                                <PrivateRoute>
                                    <MyBorrowRequests />
                                </PrivateRoute>
                            } />

                            <Route path="/admin/pending-borrows" element={
                                <PrivateRoute adminOnly>
                                    <PendingBorrows />
                                </PrivateRoute>
                            } />
                            
                            {/* Route par défaut */}
                            <Route path="/" element={<Navigate to="/books" />} />
                            <Route path="*" element={<Navigate to="/books" />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;