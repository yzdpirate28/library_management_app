import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NavigationBar = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    📚 Bibliothèque
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/books">Livres</Nav.Link>
                        
                        {isAuthenticated && (
                            <>
                                <Nav.Link as={Link} to="/my-borrows">Mes Emprunts</Nav.Link>
                                {isAdmin && (
                                    <>
                                        <Nav.Link as={Link} to="/admin/books">Gestion Livres</Nav.Link>
                                        <Nav.Link as={Link} to="/admin/borrows">Gestion Emprunts</Nav.Link>
                                        <Nav.Link as={Link} to="/admin/pending-borrows">Demandes en Attente</Nav.Link> 
                                        <Nav.Link as={Link} to="/admin/dashboard">Tableau de Bord</Nav.Link>
                                    </>
                                )}
                            </>
                        )}
                    </Nav>
                    
                    <Nav>
                        {isAuthenticated ? (
                            <NavDropdown title={`👤 ${user?.nom}`} id="user-dropdown">
                                <NavDropdown.Item as={Link} to="/profile">
                                    Profil
                                </NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>
                                    Déconnexion
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Button 
                                    variant="outline-light" 
                                    className="me-2" 
                                    as={Link} 
                                    to="/login"
                                >
                                    Connexion
                                </Button>
                                <Button 
                                    variant="light" 
                                    as={Link} 
                                    to="/register"
                                >
                                    Inscription
                                </Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;