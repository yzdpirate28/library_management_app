import React, { useState, useEffect } from 'react';
import { Container, Row, Col,Card, Form, Button, Pagination, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { bookService, borrowService } from '../../services/api';
import BookCard from './BookCard';
import { useAuth } from '../../contexts/AuthContext';

const BookList = ({ adminMode = false }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [categories, setCategories] = useState([]);
    
    // Filtres et pagination
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        sortBy: 'created_at',
        order: 'DESC'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1
    });

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchBooks();
        fetchCategories();
    }, [filters, pagination.page]);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await bookService.getAllBooks({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });
            
            setBooks(response.data.books);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                totalPages: response.data.totalPages
            }));
        } catch (err) {
            setError('Erreur lors du chargement des livres');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await bookService.getCategories();
            setCategories(response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des catégories:', err);
        }
    };

    const handleBorrow = async (bookId) => {
        if (!isAuthenticated) {
            setError('Veuillez vous connecter pour emprunter un livre');
            return;
        }

        try {
            await borrowService.borrowBook(bookId);
            setSuccess('Livre emprunté avec succès !');
            fetchBooks(); // Rafraîchir la liste
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'emprunt');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (bookId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
            return;
        }

        try {
            await bookService.deleteBook(bookId);
            setSuccess('Livre supprimé avec succès');
            fetchBooks(); // Rafraîchir la liste
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Retour à la première page
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchBooks();
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const renderPagination = () => {
        const items = [];
        for (let number = 1; number <= pagination.totalPages; number++) {
            items.push(
                <Pagination.Item
                    key={number}
                    active={number === pagination.page}
                    onClick={() => handlePageChange(number)}
                >
                    {number}
                </Pagination.Item>
            );
        }
        
        return (
            <Pagination className="justify-content-center mt-4">
                <Pagination.Prev 
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                />
                {items}
                <Pagination.Next 
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                    disabled={pagination.page === pagination.totalPages}
                />
            </Pagination>
        );
    };

    if (loading && pagination.page === 1) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement des livres...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">{adminMode ? 'Gestion des Livres' : 'Catalogue des Livres'}</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            {/* Filtres de recherche */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSearchSubmit}>
                        <Row>
                            <Col md={6}>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="Rechercher par titre, auteur..."
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                    <Button variant="outline-secondary" type="submit">
                                        🔍
                                    </Button>
                                </InputGroup>
                            </Col>
                            
                            <Col md={3}>
                                <Form.Select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Toutes les catégories</option>
                                    {categories.map((cat, index) => (
                                        <option key={index} value={cat}>{cat}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            
                            <Col md={3}>
                                <Form.Select
                                    name="sortBy"
                                    value={filters.sortBy}
                                    onChange={handleFilterChange}
                                >
                                    <option value="created_at">Date d'ajout</option>
                                    <option value="titre">Titre</option>
                                    <option value="auteur">Auteur</option>
                                    <option value="date_publication">Date de publication</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
            
            {/* Liste des livres */}
            {books.length === 0 ? (
                <Alert variant="info" className="text-center">
                    Aucun livre trouvé
                </Alert>
            ) : (
                <>
                    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                        {books.map((book) => (
                            <Col key={book.id}>
                                <BookCard 
                                    book={book} 
                                    onBorrow={handleBorrow}
                                    onDelete={adminMode ? handleDelete : null}
                                />
                            </Col>
                        ))}
                    </Row>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && renderPagination()}
                    
                    {/* Statistiques */}
                    <div className="mt-4 text-muted text-center">
                        Affichage de {books.length} livre(s) sur {pagination.total}
                    </div>
                </>
            )}
        </Container>
    );
};

export default BookList;