import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import { bookService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const BookForm = ({ edit = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    
    const [formData, setFormData] = useState({
        titre: '',
        auteur: '',
        description: '',
        categorie: '',
        isbn: '',
        date_publication: '',
        nombre_exemplaires: 1,
        image: null
    });
    const [previewImage, setPreviewImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
        if (edit && id) {
            fetchBookData();
        }
    }, [edit, id]);

    const fetchCategories = async () => {
        try {
            const response = await bookService.getCategories();
            setCategories(response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des catégories:', err);
        }
    };

    const fetchBookData = async () => {
        try {
            const response = await bookService.getBookById(id);
            const book = response.data;
            
            setFormData({
                titre: book.titre || '',
                auteur: book.auteur || '',
                description: book.description || '',
                categorie: book.categorie || '',
                isbn: book.isbn || '',
                date_publication: book.date_publication 
                    ? new Date(book.date_publication).toISOString().split('T')[0]
                    : '',
                nombre_exemplaires: book.nombre_exemplaires || 1,
                image: null
            });
            
            if (book.image) {
                setPreviewImage(`http://localhost:5000/uploads/${book.image}`);
            }
        } catch (err) {
            setError('Erreur lors du chargement du livre');
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            setFormData({
                ...formData,
                [name]: parseInt(value) || 0
            });
        } else if (type === 'file') {
            const file = e.target.files[0];
            setFormData({
                ...formData,
                image: file
            });
            
            // Prévisualisation
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result);
                };
                reader.readAsDataURL(file);
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.titre || !formData.auteur) {
            setError('Le titre et l\'auteur sont requis');
            setLoading(false);
            return;
        }

        try {
            if (edit) {
                await bookService.updateBook(id, formData);
            } else {
                await bookService.createBook(formData);
            }
            
            navigate('/admin/books');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
            setLoading(false);
        }
    };

    if (!isAdmin) {
        navigate('/');
        return null;
    }

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <h3 className="mb-0">
                                {edit ? 'Modifier le Livre' : 'Ajouter un Nouveau Livre'}
                            </h3>
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Titre *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="titre"
                                                value={formData.titre}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Auteur *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="auteur"
                                                value={formData.auteur}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ISBN</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="isbn"
                                                value={formData.isbn}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Catégorie</Form.Label>
                                            <Form.Select
                                                name="categorie"
                                                value={formData.categorie}
                                                onChange={handleChange}
                                            >
                                                <option value="">Sélectionner une catégorie</option>
                                                {categories.map((cat, index) => (
                                                    <option key={index} value={cat}>{cat}</option>
                                                ))}
                                                <option value="new-category">+ Nouvelle catégorie</option>
                                            </Form.Select>
                                            
                                            {formData.categorie === 'new-category' && (
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Entrer la nouvelle catégorie"
                                                    className="mt-2"
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        categorie: e.target.value
                                                    })}
                                                />
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date de publication</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_publication"
                                                value={formData.date_publication}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nombre d'exemplaires</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="nombre_exemplaires"
                                                value={formData.nombre_exemplaires}
                                                onChange={handleChange}
                                                min="1"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Image de couverture</Form.Label>
                                    <Form.Control
                                        type="file"
                                        name="image"
                                        onChange={handleChange}
                                        accept="image/*"
                                    />
                                    <Form.Text className="text-muted">
                                        Formats acceptés: JPG, PNG, GIF. Taille max: 5MB
                                    </Form.Text>
                                </Form.Group>
                                
                                {previewImage && (
                                    <div className="mb-3 text-center">
                                        <img 
                                            src={previewImage} 
                                            alt="Preview" 
                                            style={{ maxWidth: '200px', maxHeight: '300px' }}
                                            className="img-thumbnail"
                                        />
                                    </div>
                                )}
                                
                                <div className="d-flex justify-content-between">
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => navigate('/admin/books')}
                                    >
                                        Annuler
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Enregistrement...' : 
                                         edit ? 'Mettre à jour' : 'Ajouter le livre'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default BookForm;