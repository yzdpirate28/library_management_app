import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const Loading = () => {
    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
            </Spinner>
        </Container>
    );
};

export default Loading;