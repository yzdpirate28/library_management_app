import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const BookCard = ({ book, onBorrow, onDelete }) => {
    const { isAuthenticated, isAdmin } = useAuth();
    const imageUrl = book.image 
        ? `http://localhost:5000/uploads/${book.image}`
        : 'https://via.placeholder.com/150x200?text=No+Image';

    return (
        <Card className="h-100 shadow-sm">
            <div style={{ height: '200px', overflow: 'hidden' }}>
                <Card.Img 
                    variant="top" 
                    src={imageUrl} 
                    style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                />
            </div>
            <Card.Body className="d-flex flex-column">
                <Card.Title className="text-truncate">{book.titre}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                    {book.auteur}
                </Card.Subtitle>
                <Card.Text className="flex-grow-1">
                    <small className="text-muted">
                        Catégorie: {book.categorie || 'Non spécifiée'}
                        <br />
                        Exemplaires: {book.exemplaires_disponibles}/{book.nombre_exemplaires}
                    </small>
                </Card.Text>
                
                <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg={book.exemplaires_disponibles > 0 ? 'success' : 'danger'}>
                            {book.exemplaires_disponibles > 0 ? 'Disponible' : 'Indisponible'}
                        </Badge>
                        {book.isBorrowed && (
                            <Badge bg="info">Déjà emprunté</Badge>
                        )}
                    </div>
                    
                    <div className="d-grid gap-2">
                        <Link to={`/books/${book.id}`}>
                            <Button variant="outline-primary" className="w-100">
                                Voir détails
                            </Button>
                        </Link>
                        
                        {isAuthenticated && book.exemplaires_disponibles > 0 && !book.isBorrowed && (
                            <Button 
                                variant="success" 
                                className="w-100"
                                onClick={() => onBorrow(book.id)}
                            >
                                Emprunter
                            </Button>
                        )}
                        
                        {isAdmin && onDelete && (
                            <Button 
                                variant="danger" 
                                className="w-100 mt-2"
                                onClick={() => onDelete(book.id)}
                            >
                                Supprimer
                            </Button>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default BookCard;