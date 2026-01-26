import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Spinner, Button } from 'react-bootstrap';
import { bookService, borrowService } from '../../services/api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ValidationStats from './ValidationStats';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentBorrows, setRecentBorrows] = useState([]);
    const [recentBooks, setRecentBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Récupérer les statistiques
            const statsResponse = await bookService.getStats();
            setStats(statsResponse.data);
            
            // Récupérer les emprunts récents
            const borrowsResponse = await borrowService.getAllBorrows({
                page: 1,
                limit: 5
            });
            setRecentBorrows(borrowsResponse.data.borrows);
            
            // Récupérer les livres récents
            const booksResponse = await bookService.getAllBooks({
                page: 1,
                limit: 5,
                sortBy: 'created_at',
                order: 'DESC'
            });
            setRecentBooks(booksResponse.data.books);
            
        } catch (err) {
            setError('Erreur lors du chargement du tableau de bord');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOverdue = async () => {
        try {
            await borrowService.checkOverdue();
            fetchDashboardData(); // Rafraîchir les données
        } catch (err) {
            setError('Erreur lors de la vérification des retards');
        }
    };

    const chartData = stats ? [
        { name: 'Livres', Total: stats.total, Disponibles: stats.available },
        { name: 'Emprunts', EnCours: stats.borrowed }
    ] : [];

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement du tableau de bord...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Tableau de Bord Administrateur</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Cartes de statistiques */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Livres Totaux</Card.Title>
                            <h2 className="text-primary">{stats?.total || 0}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Livres Disponibles</Card.Title>
                            <h2 className="text-success">{stats?.available || 0}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Emprunts en Cours</Card.Title>
                            <h2 className="text-warning">{stats?.borrowed || 0}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Actions</Card.Title>
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={handleCheckOverdue}
                                className="w-100 mb-2"
                            >
                                Vérifier les retards
                            </Button>
                            <Link to="/admin/books/add" className="w-100">
                                <Button variant="success" size="sm" className="w-100">
                                    + Ajouter un livre
                                </Button>
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4">
    <Col>
        <ValidationStats />
    </Col>
</Row>
            
            {/* Graphique */}
            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <Card.Title>Statistiques</Card.Title>
                        </Card.Header>
                        <Card.Body style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Total" fill="#8884d8" />
                                    <Bar dataKey="Disponibles" fill="#82ca9d" />
                                    <Bar dataKey="EnCours" fill="#ffc658" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Emprunts récents */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title>Emprunts Récents</Card.Title>
                            <Link to="/admin/borrows">
                                <Button size="sm">Voir tout</Button>
                            </Link>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Livre</th>
                                        <th>Utilisateur</th>
                                        <th>Statut</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBorrows.map((borrow) => (
                                        <tr key={borrow.id}>
                                            <td>{borrow.titre}</td>
                                            <td>{borrow.user_name}</td>
                                            <td>
                                                <span className={`badge bg-${
                                                    borrow.statut === 'RETOURNE' ? 'success' : 
                                                    borrow.statut === 'EN_RETARD' ? 'danger' : 'warning'
                                                }`}>
                                                    {borrow.statut}
                                                </span>
                                            </td>
                                            <td>{format(new Date(borrow.date_emprunt), 'dd/MM')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                
                {/* Livres récents */}
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title>Livres Récents</Card.Title>
                            <Link to="/admin/books">
                                <Button size="sm">Voir tout</Button>
                            </Link>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Titre</th>
                                        <th>Auteur</th>
                                        <th>Catégorie</th>
                                        <th>Disponibilité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBooks.map((book) => (
                                        <tr key={book.id}>
                                            <td>{book.titre}</td>
                                            <td>{book.auteur}</td>
                                            <td>{book.categorie}</td>
                                            <td>
                                                {book.exemplaires_disponibles > 0 ? (
                                                    <span className="badge bg-success">Disponible</span>
                                                ) : (
                                                    <span className="badge bg-danger">Indisponible</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Liens rapides */}
            <Row>
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <Card.Title>Actions Rapides</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3} className="mb-2">
                                    <Link to="/admin/books/add">
                                        <Button variant="primary" className="w-100">
                                            Ajouter un livre
                                        </Button>
                                    </Link>
                                </Col>
                                <Col md={3} className="mb-2">
                                    <Link to="/admin/books">
                                        <Button variant="secondary" className="w-100">
                                            Gérer les livres
                                        </Button>
                                    </Link>
                                </Col>
                                <Col md={3} className="mb-2">
                                    <Link to="/admin/borrows">
                                        <Button variant="warning" className="w-100">
                                            Gérer les emprunts
                                        </Button>
                                    </Link>
                                </Col>
                                <Col md={3} className="mb-2">
                                    <Button 
                                        variant="danger" 
                                        className="w-100"
                                        onClick={handleCheckOverdue}
                                    >
                                        Vérifier retards
                                    </Button>
                                </Col>
                                <Col md={3} className="mb-2">
    <Link to="/admin/pending-borrows">
        <Button variant="warning" className="w-100">
            📋 Demandes en attente
        </Button>
    </Link>
</Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminDashboard;