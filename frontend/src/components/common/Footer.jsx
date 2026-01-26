import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-dark text-white py-4 mt-5">
            <Container>
                <div className="text-center">
                    <p className="mb-2">
                        📚 Système de Gestion de Bibliothèque &copy; {currentYear}
                    </p>
                    <p className="mb-0">
                        <small>
                            Développé par Yazid Abdelmonem Sied Ahmed
                        </small>
                    </p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;