import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Alert, Badge, 
    Modal, Form, Spinner, Card, Row, Col 
} from 'react-bootstrap';
import { borrowService } from '../../services/api';
import { format } from 'date-fns';

const MyBorrowRequests = () => {
    const [borrows, setBorrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal d'annulation
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBorrow, setSelectedBorrow] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchMyBorrows();
    }, []);

    const fetchMyBorrows = async () => {
        try {
            setLoading(true);
            const response = await borrowService.getMyBorrows();
            setBorrows(response.data);
        } catch (err) {
            setError('Erreur lors du chargement de vos emprunts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!cancelReason.trim()) {
            setError('Veuillez saisir une raison pour l\'annulation');
            return;
        }

        setProcessing(true);
        try {
            await borrowService.cancelBorrowRequest(selectedBorrow.id, cancelReason);
            setSuccess('Demande annulée avec succès');
            setShowCancelModal(false);
            fetchMyBorrows();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'annulation');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status, dateRetourPrevue) => {
        const now = new Date();
        const retourDate = new Date(dateRetourPrevue);
        const isOverdue = now > retourDate && status === 'EN_COURS';
        
        switch (status) {
            case 'EN_ATTENTE':
                return <Badge bg="warning">En attente de validation</Badge>;
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
            default:
                return <Badge bg="dark">Inconnu</Badge>;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'EN_ATTENTE': return '⏳';
            case 'VALIDE': return '✅';
            case 'REFUSE': return '❌';
            case 'EN_COURS': return '📚';
            case 'RETOURNE': return '↩️';
            default: return '❓';
        }
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement de vos demandes...</p>
            </Container>
        );
    }

    // Filtrer pour n'afficher que les demandes en attente
    const pendingBorrows = borrows.filter(b => b.statut === 'EN_ATTENTE');
    const otherBorrows = borrows.filter(b => b.statut !== 'EN_ATTENTE');

    return (
        <Container className="py-4">
            <h2 className="mb-4">📝 Mes Demandes d'Emprunt</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            {/* Demandes en attente */}
            <Card className="mb-4 shadow-sm border-warning">
                <Card.Header className="bg-warning text-dark">
                    <h5 className="mb-0">
                        {getStatusIcon('EN_ATTENTE')} Demandes en Attente de Validation ({pendingBorrows.length})
                    </h5>
                </Card.Header>
                <Card.Body>
                    {pendingBorrows.length === 0 ? (
                        <Alert variant="info" className="mb-0">
                            Aucune demande en attente de validation.
                        </Alert>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Livre</th>
                                    <th>Date Demande</th>
                                    <th>Retour Prévu</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingBorrows.map((borrow) => (
                                    <tr key={borrow.id}>
                                        <td>
                                            <strong>{borrow.titre}</strong>
                                            <br />
                                            <small className="text-muted">{borrow.auteur}</small>
                                        </td>
                                        <td>
                                            {format(new Date(borrow.date_emprunt), 'dd/MM/yyyy')}
                                        </td>
                                        <td>
                                            {format(new Date(borrow.date_retour_prevue), 'dd/MM/yyyy')}
                                        </td>
                                        <td>
                                            {getStatusBadge(borrow.statut, borrow.date_retour_prevue)}
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedBorrow(borrow);
                                                    setCancelReason('');
                                                    setShowCancelModal(true);
                                                }}
                                            >
                                                Annuler la demande
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
            
            {/* Autres emprunts */}
            <Card className="shadow-sm">
                <Card.Header>
                    <h5 className="mb-0">Historique de mes Emprunts</h5>
                </Card.Header>
                <Card.Body>
                    {otherBorrows.length === 0 ? (
                        <Alert variant="info" className="mb-0">
                            Aucun emprunt dans votre historique.
                        </Alert>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Livre</th>
                                    <th>Date Emprunt</th>
                                    <th>Date Retour</th>
                                    <th>Statut</th>
                                    <th>Raison (si refusé)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherBorrows.map((borrow) => (
                                    <tr key={borrow.id}>
                                        <td>
                                            <strong>{borrow.titre}</strong>
                                            <br />
                                            <small className="text-muted">{borrow.auteur}</small>
                                        </td>
                                        <td>
                                            {format(new Date(borrow.date_emprunt), 'dd/MM/yyyy')}
                                        </td>
                                        <td>
                                            {borrow.date_retour_reelle ? 
                                                format(new Date(borrow.date_retour_reelle), 'dd/MM/yyyy') :
                                                format(new Date(borrow.date_retour_prevue), 'dd/MM/yyyy')
                                            }
                                        </td>
                                        <td>
                                            {getStatusBadge(borrow.statut, borrow.date_retour_prevue)}
                                        </td>
                                        <td>
                                            {borrow.raison_refus ? (
                                                <small className="text-danger">
                                                    <em>{borrow.raison_refus}</em>
                                                </small>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
            
            {/* Informations */}
            <Row className="mt-4">
                <Col md={6}>
                    <Card className="border-info">
                        <Card.Header className="bg-info text-white">
                            <strong>Information</strong>
                        </Card.Header>
                        <Card.Body>
                            <ul className="mb-0">
                                <li>Les demandes sont traitées sous 48h</li>
                                <li>Vous pouvez annuler une demande avant validation</li>
                                <li>Maximum 3 demandes en attente simultanément</li>
                                <li>En cas de refus, la raison vous sera communiquée</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-success">
                        <Card.Header className="bg-success text-white">
                            <strong>Statistiques</strong>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col>
                                    <div className="text-center">
                                        <h3>{pendingBorrows.length}/3</h3>
                                        <small className="text-muted">Demandes en attente</small>
                                    </div>
                                </Col>
                                <Col>
                                    <div className="text-center">
                                        <h3>
                                            {borrows.filter(b => b.statut === 'REFUSE').length}
                                        </h3>
                                        <small className="text-muted">Demandes refusées</small>
                                    </div>
                                </Col>
                                <Col>
                                    <div className="text-center">
                                        <h3>
                                            {borrows.filter(b => b.statut === 'RETOURNE').length}
                                        </h3>
                                        <small className="text-muted">Livres retournés</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Modal d'annulation */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Annuler la demande d'emprunt</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBorrow && (
                        <>
                            <p>
                                Êtes-vous sûr de vouloir annuler votre demande pour le livre :
                                <br />
                                <strong>"{selectedBorrow.titre}"</strong> ?
                            </p>
                            <Form.Group>
                                <Form.Label>Raison de l'annulation (optionnel)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Ex: Plus besoin, trouvé ailleurs..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowCancelModal(false)}
                        disabled={processing}
                    >
                        Non, garder la demande
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleCancelRequest}
                        disabled={processing}
                    >
                        {processing ? 'Annulation...' : 'Oui, annuler'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MyBorrowRequests;