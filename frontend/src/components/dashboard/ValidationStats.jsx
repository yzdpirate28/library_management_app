import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { borrowService } from '../../services/api';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const ValidationStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await borrowService.getBorrowStats();
            setStats(response.data);
        } catch (err) {
            setError('Erreur lors du chargement des statistiques');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

    const pieData = stats ? [
        { name: 'En attente', value: stats.en_attente },
        { name: 'Validés', value: stats.valides },
        { name: 'Refusés', value: stats.refuses },
        { name: 'En cours', value: stats.en_cours },
        { name: 'Retournés', value: stats.retournes },
        { name: 'En retard', value: stats.en_retard }
    ].filter(item => item.value > 0) : [];

    const barData = stats ? [
        { 
            statut: 'En Attente', 
            demandes: stats.en_attente,
            fill: '#FFBB28'
        },
        { 
            statut: 'Validés', 
            demandes: stats.valides,
            fill: '#00C49F'
        },
        { 
            statut: 'Refusés', 
            demandes: stats.refuses,
            fill: '#FF8042'
        },
        { 
            statut: 'En Cours', 
            demandes: stats.en_cours,
            fill: '#0088FE'
        }
    ] : [];

    if (loading) {
        return <Spinner animation="border" size="sm" />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <Row className="mt-4">
            <Col md={6}>
                <Card className="shadow-sm h-100">
                    <Card.Header>
                        <Card.Title>Répartition des Statuts</Card.Title>
                    </Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card.Body>
                </Card>
            </Col>
            
            <Col md={6}>
                <Card className="shadow-sm h-100">
                    <Card.Header>
                        <Card.Title>Statistiques de Validation</Card.Title>
                    </Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="statut" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="demandes" fill="#8884d8">
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card.Body>
                    <Card.Footer className="text-center">
                        <small className="text-muted">
                            Total des demandes: {stats?.total || 0}
                        </small>
                    </Card.Footer>
                </Card>
            </Col>
            
            {/* Cartes de résumé */}
            <Col md={12} className="mt-4">
                <Row>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-warning">
                            <Card.Body>
                                <Card.Title>En Attente</Card.Title>
                                <h2 className="text-warning">{stats?.en_attente || 0}</h2>
                                <small className="text-muted">Demandes à traiter</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-success">
                            <Card.Body>
                                <Card.Title>Taux Validation</Card.Title>
                                <h2 className="text-success">
                                    {stats?.total ? 
                                        `${((stats.valides / stats.total) * 100).toFixed(1)}%` 
                                        : '0%'
                                    }
                                </h2>
                                <small className="text-muted">Demandes acceptées</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-danger">
                            <Card.Body>
                                <Card.Title>Taux Refus</Card.Title>
                                <h2 className="text-danger">
                                    {stats?.total ? 
                                        `${((stats.refuses / stats.total) * 100).toFixed(1)}%` 
                                        : '0%'
                                    }
                                </h2>
                                <small className="text-muted">Demandes refusées</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-info">
                            <Card.Body>
                                <Card.Title>Retards</Card.Title>
                                <h2 className="text-info">{stats?.en_retard || 0}</h2>
                                <small className="text-muted">Emprunts en retard</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default ValidationStats;