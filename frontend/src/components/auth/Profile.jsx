import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        nom: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                nom: user.nom,
                email: user.email
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await authService.updateProfile(profileData);
            updateUser(profileData);
            setSuccess('Profil mis à jour avec succès');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setError('Les nouveaux mots de passe ne correspondent pas');
        }

        if (passwordData.newPassword.length < 6) {
            return setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
        }

        setLoading(true);

        try {
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            setSuccess('Mot de passe changé avec succès');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Header>
                            <h4 className="mb-0">Mon Profil</h4>
                        </Card.Header>
                        <Card.Body>
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-3"
                            >
                                <Tab eventKey="profile" title="Informations personnelles">
                                    {error && <Alert variant="danger">{error}</Alert>}
                                    {success && <Alert variant="success">{success}</Alert>}
                                    
                                    <Form onSubmit={handleProfileSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nom complet</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nom"
                                                value={profileData.nom}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Rôle</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={user?.role}
                                                disabled
                                            />
                                        </Form.Group>

                                        <Button 
                                            variant="primary" 
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? 'Mise à jour...' : 'Mettre à jour'}
                                        </Button>
                                    </Form>
                                </Tab>

                                <Tab eventKey="password" title="Changer le mot de passe">
                                    {error && <Alert variant="danger">{error}</Alert>}
                                    {success && <Alert variant="success">{success}</Alert>}
                                    
                                    <Form onSubmit={handlePasswordSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mot de passe actuel</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Nouveau mot de passe</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Button 
                                            variant="primary" 
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? 'Changement...' : 'Changer le mot de passe'}
                                        </Button>
                                    </Form>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;