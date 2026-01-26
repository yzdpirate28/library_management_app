import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { borrowService } from '../../services/api';
import { format, isAfter } from 'date-fns';

const MyBorrows = () => {
    const [borrows, setBorrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [returning, setReturning] = useState({});

    useEffect(() => {
        fetchBorrows();
    }, []);

    const fetchBorrows = async () => {
        try {
            setLoading(true);
            const response = await borrowService.getMyBorrows();
            setBorrows(response.data);
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

        try {
            await borrowService.returnBook(borrowId);
            fetchBorrows(); // Rafraîchir la liste
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du retour');
        } finally {
            setReturning({ ...returning, [borrowId]: false });
        }
    };

    const getStatusBadge = (status, dateRetourPrevue) => {
        const now = new Date();
        const retourDate = new Date(dateRetourPrevue);
        
        // Pour les statuts EN_COURS, vérifier s'il y a retard
        if (status === 'EN_COURS' && now > retourDate) {
            return <Badge bg="danger">En retard</Badge>;
        }
        
        switch (status) {
            case 'EN_ATTENTE':
                return <Badge bg="warning">En attente</Badge>;
            case 'VALIDE':
                return <Badge bg="success">Validé</Badge>;
            case 'REFUSE':
                return <Badge bg="danger">Refusé</Badge>;
            case 'EN_COURS':
                return <Badge bg="primary">En cours</Badge>;
            case 'RETOURNE':
                return <Badge bg="secondary">Retourné</Badge>;
            case 'EN_RETARD':
                return <Badge bg="danger">En retard</Badge>;
            default:
                return <Badge bg="dark">{status || 'Inconnu'}</Badge>;
        }
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Chargement de vos emprunts...</p>
            </Container>
        );
    }

    // Trier les emprunts : d'abord les en attente, puis les en cours, puis les autres
    const sortedBorrows = [...borrows].sort((a, b) => {
        const statusOrder = {
            'EN_ATTENTE': 1,
            'EN_COURS': 2,
            'EN_RETARD': 3,
            'RETOURNE': 4,
            'REFUSE': 5,
            'VALIDE': 6
        };
        return statusOrder[a.statut] - statusOrder[b.statut];
    });

    return (
        <Container className="py-4">
            <h2 className="mb-4">Mes Emprunts</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            {sortedBorrows.length === 0 ? (
                <Alert variant="info">
                    Vous n'avez aucun emprunt en cours.
                </Alert>
            ) : (
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th>Livre</th>
                            <th>Date d'emprunt</th>
                            <th>Date de retour prévue</th>
                            <th>Date de retour réelle</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBorrows.map((borrow) => (
                            <tr key={borrow.id}>
                                <td>
                                    <strong>{borrow.titre}</strong>
                                    <br />
                                    <small className="text-muted">par {borrow.auteur}</small>
                                </td>
                                <td>
                                    {format(new Date(borrow.date_emprunt), 'dd/MM/yyyy')}
                                </td>
                                <td>
                                    {format(new Date(borrow.date_retour_prevue), 'dd/MM/yyyy')}
                                </td>
                                <td>
                                    {borrow.date_retour_reelle 
                                        ? format(new Date(borrow.date_retour_reelle), 'dd/MM/yyyy')
                                        : '-'
                                    }
                                </td>
                                <td>
                                    {getStatusBadge(borrow.statut, borrow.date_retour_prevue)}
                                    {borrow.raison_refus && borrow.statut === 'REFUSE' && (
                                        <div className="mt-1">
                                            <small className="text-danger">
                                                <em>Raison : {borrow.raison_refus}</em>
                                            </small>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {borrow.statut === 'EN_COURS' && (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleReturn(borrow.id)}
                                            disabled={returning[borrow.id]}
                                        >
                                            {returning[borrow.id] ? 'Retour...' : 'Retourner'}
                                        </Button>
                                    )}
                                    {borrow.statut === 'EN_ATTENTE' && (
                                        <small className="text-muted">
                                            En attente de validation
                                        </small>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            
            <div className="text-muted mt-3">
                <small>
                    * Vous pouvez emprunter jusqu'à 5 livres simultanément.
                    <br />
                    * La durée d'emprunt est de 14 jours.
                    <br />
                    * Les demandes sont traitées sous 48h.
                </small>
            </div>
        </Container>
    );
};

export default MyBorrows;