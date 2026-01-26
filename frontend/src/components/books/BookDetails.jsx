import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { bookService, borrowService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useAuth();
    
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [borrowing, setBorrowing] = useState(false);

    useEffect(() => {
        fetchBookDetails();
    }, [id]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            const response = await bookService.getBookById(id);
            setBook(response.data);
        } catch (err) {
            setError('Livre non trouvé');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBorrow = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setBorrowing(true);
        setError('');
        
        try {
            await borrowService.borrowBook(id);
            setSuccess('Livre emprunté avec succès !');
            fetchBookDetails(); // Rafraîchir les détails
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'emprunt');
        } finally {
            setBorrowing(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
            return;
        }

        try {
            await bookService.deleteBook(id);
            navigate('/books');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement...</p>
            </Container>
        );
    }

    if (!book) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    Livre non trouvé
                </Alert>
                <Link to="/books">
                    <Button variant="primary">Retour à la liste</Button>
                </Link>
            </Container>
        );
    }

    const imageUrl = book.image 
        ? `http://localhost:5000/uploads/${book.image}`
        : 'https://via.placeholder.com/400x500?text=No+Image';

    return (
        <Container className="py-4">
            <Row>
                <Col lg={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Img 
                            variant="top" 
                            src={imageUrl} 
                            style={{ maxHeight: '500px', objectFit: 'cover' }}
                        />
                        <Card.Body className="text-center">
                            <Badge 
                                bg={book.exemplaires_disponibles > 0 ? 'success' : 'danger'}
                                className="mb-3"
                            >
                                {book.exemplaires_disponibles > 0 ? 'Disponible' : 'Indisponible'}
                            </Badge>
                            
                            <div className="d-grid gap-2">
                                {isAuthenticated && book.exemplaires_disponibles > 0 && !book.isBorrowed && (
                                    <Button 
                                        variant="success" 
                                        size="lg"
                                        onClick={handleBorrow}
                                        disabled={borrowing}
                                    >
                                        {borrowing ? 'Emprunt en cours...' : 'Emprunter ce livre'}
                                    </Button>
                                )}
                                
                                {book.isBorrowed && (
                                    <Alert variant="info" className="mb-0">
                                        Vous avez déjà emprunté ce livre
                                    </Alert>
                                )}
                                
                                {isAdmin && (
                                    <>
                                        <Link to={`/admin/books/edit/${book.id}`}>
                                            <Button variant="warning" className="w-100">
                                                Modifier
                                            </Button>
                                        </Link>
                                        <Button 
                                            variant="danger" 
                                            className="w-100"
                                            onClick={handleDelete}
                                        >
                                            Supprimer
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}
                            
                            <h1 className="mb-3">{book.titre}</h1>
                            <h4 className="text-muted mb-4">par {book.auteur}</h4>
                            
                            <Row className="mb-4">
                                <Col md={6}>
                                    <p>
                                        <strong>ISBN:</strong> {book.isbn || 'Non spécifié'}
                                    </p>
                                    <p>
                                        <strong>Catégorie:</strong> {book.categorie || 'Non spécifiée'}
                                    </p>
                                    <p>
                                        <strong>Date de publication:</strong>{' '}
                                        {book.date_publication 
                                            ? format(new Date(book.date_publication), 'dd/MM/yyyy')
                                            : 'Non spécifiée'
                                        }
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <p>
                                        <strong>Exemplaires disponibles:</strong>{' '}
                                        {book.exemplaires_disponibles} / {book.nombre_exemplaires}
                                    </p>
                                    <p>
                                        <strong>Ajouté le:</strong>{' '}
                                        {format(new Date(book.created_at), 'dd/MM/yyyy')}
                                    </p>
                                </Col>
                            </Row>
                            
                            <hr />
                            
                            <h5>Description</h5>
                            <p className="text-justify" style={{ whiteSpace: 'pre-wrap' }}>
                                {book.description || 'Aucune description disponible.'}
                            </p>
                            
                            <div className="mt-4">
                                <Link to="/books">
                                    <Button variant="outline-primary">
                                        ← Retour à la liste
                                    </Button>
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default BookDetails;