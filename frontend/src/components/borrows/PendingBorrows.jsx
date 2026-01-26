import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Alert, Badge, 
    Modal, Form, Spinner, Row, Col, Card 
} from 'react-bootstrap';
import { borrowService } from '../../services/api';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const PendingBorrows = () => {
    const [pendingBorrows, setPendingBorrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal pour refus
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [selectedBorrow, setSelectedBorrow] = useState(null);
    const [refuseReason, setRefuseReason] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    const { user } = useAuth();

    useEffect(() => {
        fetchPendingBorrows();
    }, [pagination.page]);

    const fetchPendingBorrows = async () => {
        try {
            setLoading(true);
            const response = await borrowService.getPendingBorrows({
                page: pagination.page,
                limit: pagination.limit
            });
            
            setPendingBorrows(response.data.borrows);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                totalPages: response.data.totalPages
            }));
        } catch (err) {
            setError('Erreur lors du chargement des demandes en attente');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (borrowId) => {
        if (!window.confirm('Valider cette demande d\'emprunt ?')) {
            return;
        }

        try {
            await borrowService.validateBorrow(borrowId);
            setSuccess('Demande validée avec succès');
            fetchPendingBorrows();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleOpenRefuseModal = (borrow) => {
        setSelectedBorrow(borrow);
        setRefuseReason('');
        setShowRefuseModal(true);
    };

    const handleRefuse = async () => {
        if (!refuseReason.trim()) {
            setError('Veuillez saisir une raison pour le refus');
            return;
        }

        setProcessing(true);
        try {
            await borrowService.refuseBorrow(selectedBorrow.id, refuseReason);
            setSuccess('Demande refusée avec succès');
            setShowRefuseModal(false);
            fetchPendingBorrows();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du refus');
        } finally {
            setProcessing(false);
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const renderPagination = () => {
        const items = [];
        for (let number = 1; number <= pagination.totalPages; number++) {
            items.push(
                <Button
                    key={number}
                    variant={number === pagination.page ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handlePageChange(number)}
                    className="mx-1"
                >
                    {number}
                </Button>
            );
        }
        
        return (
            <div className="d-flex justify-content-center mt-4">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                >
                    Précédent
                </Button>
                {items}
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                    disabled={pagination.page === pagination.totalPages}
                >
                    Suivant
                </Button>
            </div>
        );
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement des demandes en attente...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">📋 Demandes d'Emprunt en Attente</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                            {pendingBorrows.length} demande(s) en attente de validation
                        </h5>
                        <Badge bg="warning" className="fs-6">
                            {pagination.total} total
                        </Badge>
                    </div>
                </Card.Body>
            </Card>
            
            {pendingBorrows.length === 0 ? (
                <Alert variant="info" className="text-center">
                    Aucune demande d'emprunt en attente de validation.
                </Alert>
            ) : (
                <>
                    <Table responsive striped bordered hover className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Livre</th>
                                <th>Utilisateur</th>
                                <th>Date Demande</th>
                                <th>Retour Prévu</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingBorrows.map((borrow) => (
                                <tr key={borrow.id}>
                                    <td>#{borrow.id}</td>
                                    <td>
                                        <strong>{borrow.titre}</strong>
                                        <br />
                                        <small className="text-muted">par {borrow.auteur}</small>
                                    </td>
                                    <td>
                                        {borrow.user_name}
                                        <br />
                                        <small className="text-muted">{borrow.email}</small>
                                    </td>
                                    <td>
                                        {format(new Date(borrow.date_emprunt), 'dd/MM/yyyy')}
                                        <br />
                                        <small className="text-muted">
                                            {format(new Date(borrow.date_emprunt), 'HH:mm')}
                                        </small>
                                    </td>
                                    <td>
                                        {format(new Date(borrow.date_retour_prevue), 'dd/MM/yyyy')}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleValidate(borrow.id)}
                                            >
                                                ✓ Valider
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleOpenRefuseModal(borrow)}
                                            >
                                                ✗ Refuser
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    
                    {pagination.totalPages > 1 && renderPagination()}
                </>
            )}
            
            {/* Modal de refus */}
            <Modal show={showRefuseModal} onHide={() => setShowRefuseModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Refuser la demande d'emprunt</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBorrow && (
                        <>
                            <p>
                                <strong>Livre:</strong> {selectedBorrow.titre}
                                <br />
                                <strong>Utilisateur:</strong> {selectedBorrow.user_name}
                            </p>
                            <Form.Group>
                                <Form.Label>Raison du refus *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={refuseReason}
                                    onChange={(e) => setRefuseReason(e.target.value)}
                                    placeholder="Ex: Livre indisponible, utilisateur en retard..."
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Cette raison sera visible par l'utilisateur.
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowRefuseModal(false)}
                        disabled={processing}
                    >
                        Annuler
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleRefuse}
                        disabled={processing || !refuseReason.trim()}
                    >
                        {processing ? 'Traitement...' : 'Confirmer le refus'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Instructions */}
            <Card className="mt-4 border-info">
                <Card.Header className="bg-info text-white">
                    <strong>Instructions pour l'admin</strong>
                </Card.Header>
                <Card.Body>
                    <ul className="mb-0">
                        <li>Valider les demandes lorsque le livre est disponible</li>
                        <li>Refuser les demandes avec une raison claire</li>
                        <li>Vérifier l'historique des emprunts de l'utilisateur</li>
                        <li>Considérer les retards éventuels de l'utilisateur</li>
                    </ul>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PendingBorrows;