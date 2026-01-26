-- Création de la base de données
CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'USER') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des livres
CREATE TABLE livres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    auteur VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100),
    isbn VARCHAR(20) UNIQUE,
    date_publication DATE,
    nombre_exemplaires INT DEFAULT 1,
    exemplaires_disponibles INT DEFAULT 1,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des emprunts
CREATE TABLE emprunts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    livre_id INT NOT NULL,
    date_emprunt DATE NOT NULL,
    date_retour_prevue DATE NOT NULL,
    date_retour_reelle DATE,
    statut ENUM('EN_COURS', 'RETOURNE', 'EN_RETARD') DEFAULT 'EN_COURS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (livre_id) REFERENCES livres(id) ON DELETE CASCADE
);

-- Insertion d'un admin par défaut (mot de passe: admin123)
INSERT INTO users (nom, email, password, role) VALUES 
('Admin', 'admin@library.com', '$2a$10$YourHashedPasswordHere', 'ADMIN');

-- Insertion de quelques livres exemples
INSERT INTO livres (titre, auteur, description, categorie, isbn, date_publication, nombre_exemplaires, exemplaires_disponibles) VALUES
('Le Petit Prince', 'Antoine de Saint-Exupéry', 'Un classique de la littérature française', 'Littérature', '9782070612758', '1943-04-06', 5, 5),
('1984', 'George Orwell', 'Roman dystopique', 'Science-fiction', '9782070368226', '1949-06-08', 3, 3),
('Harry Potter à l école des sorciers', 'J.K. Rowling', 'Premier tome de la série Harry Potter', 'Fantasy', '9782070518425', '1997-06-26', 4, 4);