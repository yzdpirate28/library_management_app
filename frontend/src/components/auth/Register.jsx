import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        // Validation
        if (formData.password !== formData.confirmPassword) {
            return setError('Les mots de passe ne correspondent pas');
        }
        
        if (formData.password.length < 6) {
            return setError('Le mot de passe doit contenir au moins 6 caractères');
        }

        setLoading(true);

        try {
            await authService.register({
                nom: formData.nom,
                email: formData.email,
                password: formData.password
            });
            
            setSuccess('Compte créé avec succès ! Redirection...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur d\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Card style={{ width: '100%', maxWidth: '400px' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Inscription</h2>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom complet</Form.Label>
                            <Form.Control
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Mot de passe</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Confirmer le mot de passe</Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? 'Inscription...' : 'S\'inscrire'}
                        </Button>
                    </Form>
                    
                    <div className="text-center mt-3">
                        <p>
                            Déjà un compte ? <Link to="/login">Se connecter</Link>
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Register;