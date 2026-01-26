-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 21 jan. 2026 à 23:06
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `library_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `emprunts`
--

CREATE TABLE `emprunts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `livre_id` int(11) NOT NULL,
  `date_emprunt` date NOT NULL,
  `date_retour_prevue` date NOT NULL,
  `date_retour_reelle` date DEFAULT NULL,
  `statut` enum('EN_ATTENTE','VALIDE','REFUSE','EN_COURS','RETOURNE','EN_RETARD') DEFAULT 'EN_ATTENTE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_validation` date DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `raison_refus` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `emprunts`
--

INSERT INTO `emprunts` (`id`, `user_id`, `livre_id`, `date_emprunt`, `date_retour_prevue`, `date_retour_reelle`, `statut`, `created_at`, `updated_at`, `date_validation`, `admin_id`, `raison_refus`) VALUES
(6, 2, 1, '2026-01-21', '2026-02-04', NULL, 'EN_COURS', '2026-01-21 21:55:24', '2026-01-21 21:55:47', '2026-01-21', 1, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `livres`
--

CREATE TABLE `livres` (
  `id` int(11) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `auteur` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `categorie` varchar(100) DEFAULT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `date_publication` date DEFAULT NULL,
  `nombre_exemplaires` int(11) DEFAULT 1,
  `exemplaires_disponibles` int(11) DEFAULT 1,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `livres`
--

INSERT INTO `livres` (`id`, `titre`, `auteur`, `description`, `categorie`, `isbn`, `date_publication`, `nombre_exemplaires`, `exemplaires_disponibles`, `image`, `created_at`, `updated_at`) VALUES
(1, 'Le Petit Prince', 'Antoine de Saint-Exupéry', 'Un classique de la littérature française', 'Littérature', '9782070612758', '1943-04-02', 1, 4, '1769030343371-24019849.png', '2026-01-21 20:40:52', '2026-01-21 21:55:47');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') DEFAULT 'USER',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@library.com', '$2b$10$8iBaX0u5MEci6Q1HKx./5OqlH3.AFVtHwd.HosahCBj2uICssFTaO', 'ADMIN', '2026-01-21 20:40:52', '2026-01-21 20:47:48'),
(2, 'simo', 'simo@gmail.com', '$2b$10$8iBaX0u5MEci6Q1HKx./5OqlH3.AFVtHwd.HosahCBj2uICssFTaO', 'USER', '2026-01-21 20:47:27', '2026-01-21 20:47:27'),
(3, 'yazid', 'yazid@gmail.com', '$2a$10$Y/veJHENSh.LHedqoircE.PPLoelJ5VOu/9oY4GPCcng0v5NvvCO2', 'USER', '2026-01-21 21:22:05', '2026-01-21 21:22:05');

-- --------------------------------------------------------

--
-- Structure de la table `validation_historique`
--

CREATE TABLE `validation_historique` (
  `id` int(11) NOT NULL,
  `emprunt_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `action` enum('VALIDATION','REFUS','ANNULATION') NOT NULL,
  `raison` text DEFAULT NULL,
  `date_action` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `validation_historique`
--

INSERT INTO `validation_historique` (`id`, `emprunt_id`, `admin_id`, `action`, `raison`, `date_action`) VALUES
(2, 6, 1, 'VALIDATION', NULL, '2026-01-21 21:55:47');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `emprunts`
--
ALTER TABLE `emprunts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `livre_id` (`livre_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Index pour la table `livres`
--
ALTER TABLE `livres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `isbn` (`isbn`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `validation_historique`
--
ALTER TABLE `validation_historique`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emprunt_id` (`emprunt_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `emprunts`
--
ALTER TABLE `emprunts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `livres`
--
ALTER TABLE `livres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `validation_historique`
--
ALTER TABLE `validation_historique`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `emprunts`
--
ALTER TABLE `emprunts`
  ADD CONSTRAINT `emprunts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `emprunts_ibfk_2` FOREIGN KEY (`livre_id`) REFERENCES `livres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `emprunts_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `validation_historique`
--
ALTER TABLE `validation_historique`
  ADD CONSTRAINT `validation_historique_ibfk_1` FOREIGN KEY (`emprunt_id`) REFERENCES `emprunts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `validation_historique_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
