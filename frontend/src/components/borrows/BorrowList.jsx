import React, { useState, useEffect } from 'react';
import { 
    Container, Card, Table, Button, Alert, Badge, 
    Form, Row, Col, Pagination, Spinner, Modal 
} from 'react-bootstrap';
import { borrowService } from '../../services/api';
import { format, isAfter, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const BorrowList = () => {
    const [borrows, setBorrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [returning, setReturning] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [selectedBorrow, setSelectedBorrow] = useState(null);
    
    // Filtres et pagination
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        sortBy: 'date_emprunt',
        order: 'DESC'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    useEffect(() => {
        fetchBorrows();
    }, [filters, pagination.page]);

    const fetchBorrows = async () => {
        try {
            setLoading(true);
            const response = await borrowService.getAllBorrows({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });
            
            setBorrows(response.data.borrows);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                totalPages: response.data.totalPages
            }));
        } catch (err) {
            setError('Erreur lors du chargement des emprunts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (borrowId) => {
        setReturning({ ...returning, [borrowId]: true });
        setError('');
        setSuccess('');

        try {
            await borrowService.returnBook(borrowId);
            setSuccess('Livre retourné avec succès');
            fetchBorrows();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du retour');
            setTimeout(() => setError(''), 3000);
        } finally {
            setReturning({ ...returning, [borrowId]: false });
        }
    };

    const handleValidate = async (borrowId) => {
        if (!window.confirm('Valider cet emprunt ?')) {
            return;
        }

        try {
            await borrowService.validateBorrow(borrowId);
            setSuccess('Emprunt validé avec succès');
            fetchBorrows();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleShowModal = (borrow) => {
        setSelectedBorrow(borrow);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedBorrow(null);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const getStatusBadge = (status, dateRetourPrevue) => {
        const today = new Date();
        const retourPrevue = parseISO(dateRetourPrevue);
        const isOverdue = isAfter(today, retourPrevue) && (status === 'EN_COURS' || status === 'EN_RETARD');
        
        switch (status) {
            case 'EN_ATTENTE':
                return <Badge bg="warning">En attente</Badge>;
            case 'VALIDE':
                return <Badge bg="success">Validé</Badge>;
            case 'REFUSE':
                return <Badge bg="danger">Refusé</Badge>;
            case 'EN_COURS':
                return isOverdue ? 
                    <Badge bg="danger">En retard</Badge> : 
                    <Badge bg="primary">En cours</Badge>;
            case 'RETOURNE':
                return <Badge bg="secondary">Retourné</Badge>;
            case 'EN_RETARD':
                return <Badge bg="danger">En retard</Badge>;
            default:
                return <Badge bg="dark">{status || 'Inconnu'}</Badge>;
        }
    };

    const calculateDaysLate = (dateRetourPrevue) => {
        const today = new Date();
        const retourPrevue = parseISO(dateRetourPrevue);
        
        if (isAfter(retourPrevue, today)) return 0;
        
        const diffTime = Math.abs(today - retourPrevue);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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

    const getStatusOptions = () => [
        { value: '', label: 'Tous les statuts' },
        { value: 'EN_ATTENTE', label: 'En attente' },
        { value: 'VALIDE', label: 'Validé' },
        { value: 'REFUSE', label: 'Refusé' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'RETOURNE', label: 'Retourné' },
        { value: 'EN_RETARD', label: 'En retard' }
    ];

    const renderActions = (borrow) => {
        switch (borrow.statut) {
            case 'EN_ATTENTE':
                return (
                    <div className="d-flex gap-2">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleValidate(borrow.id)}
                        >
                            Valider
                        </Button>
                    </div>
                );
            case 'EN_COURS':
            case 'EN_RETARD':
                return (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReturn(borrow.id)}
                        disabled={returning[borrow.id]}
                    >
                        {returning[borrow.id] ? 'Retour...' : 'Retourner'}
                    </Button>
                );
            default:
                return <small className="text-muted">Aucune action</small>;
        }
    };

    if (loading && pagination.page === 1) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement des emprunts...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Gestion des Emprunts</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            {/* Filtres */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Statut</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                    >
                                        {getStatusOptions().map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Recherche</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="search"
                                        placeholder="Rechercher par livre ou utilisateur..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Trier par</Form.Label>
                                    <Form.Select
                                        name="sortBy"
                                        value={filters.sortBy}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="date_emprunt">Date d'emprunt</option>
                                        <option value="date_retour_prevue">Date de retour</option>
                                        <option value="statut">Statut</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
            
            {/* Liste des emprunts */}
            {borrows.length === 0 ? (
                <Alert variant="info" className="text-center">
                    Aucun emprunt trouvé
                </Alert>
            ) : (
                <>
                    <Table responsive striped bordered hover className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>Livre</th>
                                <th>Utilisateur</th>
                                <th>Date d'emprunt</th>
                                <th>Date de retour prévue</th>
                                <th>Date de retour réelle</th>
                                <th>Statut</th>
                                <th>Jours de retard</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {borrows.map((borrow) => {
                                const daysLate = calculateDaysLate(borrow.date_retour_prevue);
                                
                                return (
                                    <tr key={borrow.id}>
                                        <td>
                                            <strong 
                                                style={{ cursor: 'pointer', color: '#0d6efd' }}
                                                onClick={() => handleShowModal(borrow)}
                                            >
                                                {borrow.titre}
                                            </strong>
                                            <br />
                                            <small className="text-muted">par {borrow.auteur}</small>
                                        </td>
                                        <td>
                                            {borrow.user_name}
                                            <br />
                                            <small className="text-muted">{borrow.email}</small>
                                        </td>
                                        <td>
                                            {format(parseISO(borrow.date_emprunt), 'dd/MM/yyyy', { locale: fr })}
                                        </td>
                                        <td>
                                            {format(parseISO(borrow.date_retour_prevue), 'dd/MM/yyyy', { locale: fr })}
                                        </td>
                                        <td>
                                            {borrow.date_retour_reelle 
                                                ? format(parseISO(borrow.date_retour_reelle), 'dd/MM/yyyy', { locale: fr })
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            {getStatusBadge(borrow.statut, borrow.date_retour_prevue)}
                                        </td>
                                        <td>
                                            {daysLate > 0 ? (
                                                <Badge bg="danger">{daysLate} jour(s)</Badge>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {renderActions(borrow)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && renderPagination()}
                    
                    {/* Statistiques */}
                    <div className="mt-4">
                        <Row>
                            <Col md={3}>
                                <Card className="text-center">
                                    <Card.Body>
                                        <h6>Total</h6>
                                        <h4 className="text-primary">{pagination.total}</h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-warning">
                                    <Card.Body>
                                        <h6>En attente</h6>
                                        <h4 className="text-warning">
                                            {borrows.filter(b => b.statut === 'EN_ATTENTE').length}
                                        </h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center">
                                    <Card.Body>
                                        <h6>En cours</h6>
                                        <h4 className="text-primary">
                                            {borrows.filter(b => b.statut === 'EN_COURS').length}
                                        </h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-danger">
                                    <Card.Body>
                                        <h6>En retard</h6>
                                        <h4 className="text-danger">
                                            {borrows.filter(b => 
                                                (b.statut === 'EN_COURS' || b.statut === 'EN_RETARD') && 
                                                calculateDaysLate(b.date_retour_prevue) > 0
                                            ).length}
                                        </h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </>
            )}
            
            {/* Modal de détails */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Détails de l'emprunt</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBorrow && (
                        <Row>
                            <Col md={6}>
                                <h5>Informations du livre</h5>
                                <p>
                                    <strong>Titre:</strong> {selectedBorrow.titre}
                                </p>
                                <p>
                                    <strong>Auteur:</strong> {selectedBorrow.auteur}
                                </p>
                                {selectedBorrow.raison_refus && (
                                    <p className="text-danger">
                                        <strong>Raison du refus:</strong><br />
                                        <em>{selectedBorrow.raison_refus}</em>
                                    </p>
                                )}
                            </Col>
                            <Col md={6}>
                                <h5>Informations de l'utilisateur</h5>
                                <p>
                                    <strong>Nom:</strong> {selectedBorrow.user_name}
                                </p>
                                <p>
                                    <strong>Email:</strong> {selectedBorrow.email}
                                </p>
                            </Col>
                            <Col md={12} className="mt-3">
                                <h5>Détails de l'emprunt</h5>
                                <Row>
                                    <Col md={4}>
                                        <p>
                                            <strong>Date d'emprunt:</strong><br />
                                            {format(parseISO(selectedBorrow.date_emprunt), 'dd/MM/yyyy', { locale: fr })}
                                        </p>
                                    </Col>
                                    <Col md={4}>
                                        <p>
                                            <strong>Date de retour prévue:</strong><br />
                                            {format(parseISO(selectedBorrow.date_retour_prevue), 'dd/MM/yyyy', { locale: fr })}
                                        </p>
                                    </Col>
                                    <Col md={4}>
                                        <p>
                                            <strong>Date de retour réelle:</strong><br />
                                            {selectedBorrow.date_retour_reelle 
                                                ? format(parseISO(selectedBorrow.date_retour_reelle), 'dd/MM/yyyy', { locale: fr })
                                                : 'Non retourné'
                                            }
                                        </p>
                                    </Col>
                                </Row>
                                <p>
                                    <strong>Statut:</strong> {' '}
                                    {getStatusBadge(selectedBorrow.statut, selectedBorrow.date_retour_prevue)}
                                    {selectedBorrow.statut === 'EN_COURS' && 
                                     calculateDaysLate(selectedBorrow.date_retour_prevue) > 0 && (
                                        <Badge bg="danger" className="ms-2">
                                            {calculateDaysLate(selectedBorrow.date_retour_prevue)} jour(s) de retard
                                        </Badge>
                                    )}
                                </p>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedBorrow && selectedBorrow.statut === 'EN_ATTENTE' && (
                        <Button
                            variant="success"
                            onClick={() => {
                                handleValidate(selectedBorrow.id);
                                handleCloseModal();
                            }}
                        >
                            Valider l'emprunt
                        </Button>
                    )}
                    {selectedBorrow && (selectedBorrow.statut === 'EN_COURS' || selectedBorrow.statut === 'EN_RETARD') && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                handleReturn(selectedBorrow.id);
                                handleCloseModal();
                            }}
                            disabled={returning[selectedBorrow.id]}
                        >
                            {returning[selectedBorrow.id] ? 'Retour en cours...' : 'Marquer comme retourné'}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default BorrowList;