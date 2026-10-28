# NEXUS DASHBOARD — DOCUMENTATION TECHNIQUE ET MANUEL D'UTILISATION EXHAUSTIF

> **Version :** 1.0  
> **Auteur :** Équipe de Développement Nexus  
> **Cible :** Administrateurs système, Développeurs & Utilisateurs de serveur domestique Ubuntu  

---

## TABLE DES MATIÈRES
1. [Architecture & Conception Technique](#1-architecture--conception-technique)
2. [Modèle de Données & Sécurité](#2-modèle-de-données--sécurité)
3. [Intégration API Portainer & Docker](#3-intégration-api-portainer--docker)
4. [Manuel Utilisateur Complet](#4-manuel-utilisateur-complet)
5. [Procédure de Sauvegarde & Test de Restauration](#5-procédure-de-sauvegarde--test-de-restauration)
6. [Audit de Sécurité & Mises à Jour APT](#6-audit-de-sécurité--mises-à-jour-apt)
7. [Dépannage & Maintenance](#7-dépannage--maintenance)

---

## 1. ARCHITECTURE & CONCEPTION TECHNIQUE

Nexus Dashboard repose sur une séparation stricte des responsabilités entre une interface Single Page Application (SPA) en React + TypeScript et un backend d'API REST haute performance en Python (FastAPI).

### 1.1 Diagramme des Composants & Flux Réseau

```
+-------------------------------------------------------------------------+
|                      Navigateur Client (LAN Local)                      |
+-------------------------------------------------------------------------+
                                     |
                                     v HTTP / HTTPS (Port 80 / 443)
+-------------------------------------------------------------------------+
|                        Proxy Reverse Local Nginx                        |
|   - Sert l'application React SPA compilée (static bundle)               |
|   - Redirige le préfixe /api vers le serveur d'application backend      |
+-------------------------------------------------------------------------+
                                     |
                                     v FastAPI / Uvicorn (Port 8000)
+-------------------------------------------------------------------------+
|                           Nexus Backend API                             |
|  - Checkers Middleware (IP LAN, JWT Auth, CORS)                         |
|  - System Monitor (`psutil` : CPU, RAM, Disk, Temp, Network Rate)       |
|  - Portainer REST API Client (`httpx` avec SSL & retries)               |
|  - File Manager Service (Explorateur de fichiers & contrôles de sécurité)|
|  - Backup Execution Engine & Audit Event Logger                         |
+-------------------------------------------------------------------------+
              |                                        |
              v SQLite Database (`nexus.db`)           v Appels API / OS
     +----------------------------------+    +----------------------------------+
     | - Users & Hashed Passwords       |    | - Portainer REST API (Port 9000) |
     | - Metrics History Snapshots      |    | - Métriques & Fichiers Ubuntu    |
     | - Backup Records & Audit Logs    |    | - Tâches Sudo Power (Reboot/Off) |
     +----------------------------------+    +----------------------------------+
```

### 1.2 Isolation & Sécurité de l'Architecture
- **Pas d'exposition directe du Docker Socket** : Le navigateur ne communique **jamais** directement avec Docker Engine ni avec Portainer.
- **Backend Privilégié Réduit** : Le backend FastAPI sert de passerelle unique d'autorisation, appliquant des validations strictes sur tous les identifiants et paramètres reçus.

---

## 2. MODÈLE DE DONNÉES & SÉCURITÉ

### 2.1 Authentification & Jetons JWT
- **OAuth2 Password Bearer** : Les connexions utilisent un flux OAuth2 standard (`/api/v1/auth/login`).
- **Hachage Bcrypt** : Les mots de passe sont hachés directement avec `bcrypt` (salage dynamique, max 72 octets).
- **Jetons JWT HS256** : Signés avec une clé secrète configurée via `SECRET_KEY`, valides 24 heures par défaut.

### 2.2 Restriction Réseau Local (LAN)
Un middleware vérifie chaque requête entrante par rapport aux plages sous-réseau autorisées (`ALLOWED_LAN_SUBNETS=127.0.0.1/32,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12`). Lorsque `ENFORCE_LAN_ONLY=true`, les appels WAN hors réseau local sont rejetés avec un statut HTTP 403 Forbidden.

---

## 3. INTÉGRATION API PORTAINER & DOCKER

### 3.1 Authentification par Jeton API
La communication avec Portainer s'effectue au moyen d'un **API Token** dédié configuré dans le fichier `.env` (`PORTAINER_API_TOKEN`). Le jeton est transmis dans l'en-tête HTTP `X-API-Key`.

### 3.2 Actions Autorisées & Protection du Système
Afin d'éviter toute interruption critique involontaire :
- **Actions autorisées** : `start`, `stop`, `restart`.
- **Interdictions V1** : La suppression de conteneurs (`rm`), la modification de Stacks ou l'exécution de shells arbitraires sont bloquées côté backend.

### 3.3 Mode Développeur Local & Simulation (MOCK)
Lorsque `DEV_MODE=true` ou lorsque l'instance Portainer est inaccessible, le backend bascule automatiquement en mode **Simulation MOCK**. L'IHM continue de fonctionner de manière fluide avec des conteneurs et stacks de démonstration.

---

## 4. MANUEL UTILISATEUR COMPLET

### 4.1 Vue d'Ensemble (Dashboard)
- **KPIs Temps Réel** : Cartes animées indiquant le pourcentage de CPU, la mémoire RAM utilisée/totale, l'occupation du disque racine `/` et l'uptime serveur.
- **Graphiques Temporaires** : Courbes de tendance temporelle d'utilisation du CPU et de la RAM construites avec Recharts.
- **Synthèse Docker & Sauvegardes** : Récapitulatif instantané des conteneurs actifs/arrêtés et du statut de la dernière sauvegarde.

### 4.2 Conteneurs & Stacks Docker
- **Recherche & Filtrage** : Filtrez par nom, image ou nom de stack, ou par état (`running`, `exited`, `paused`).
- **Consultation des Logs** : Cliquez sur l'icône de document pour ouvrir une boîte modale affichant les 200 dernières lignes de journaux Docker du conteneur.
- **Actions de Cycle de Vie** : Boutons démarrer (vert), arrêter (rouge) et redémarrer (jaune) munis d'une boîte de dialogue de confirmation explicite.
- **Gestion des Stacks** : Onglet dédié listant les groupes Compose avec leur nombre de conteneurs rattachés.

### 4.3 Réseau & Connectivité
- **Suivi des Débits** : Cartes indiquant le débit descendant (Download) et montant (Upload) calculés en temps réel.
- **Interfaces Locales** : Liste complète des cartes réseau physiques (`eth0`, `wlan0`, etc.) et adresses IP associées.
- **Testeur de Dépendances** : Outil interactif permettant d'effectuer un ping HTTP vers n'importe quel service local pour vérifier sa réactivité et son code retour HTTP.

### 4.4 Stockage & Points de Montage
- **Barres de Progression Animées** : Représentation visuelle de la capacité utilisée et restante par point de montage.
- **Seuils d'Alerte Automatiques** : Change de couleur vers le jaune au-delà du seuil d'avertissement (80%) et vers le rouge au-delà du seuil critique (90%).

### 4.5 Gestionnaire de Fichiers (File Manager)
- **Navigation Arborescente** : Parcourez les répertoires système avec fil d'ariane (Breadcrumb).
- **Prévisualisation de Fichiers Texte** : Cliquez sur un fichier texte pour ouvrir la visionneuse intégrée.
- **Protection des Droits** : Contrôles stricts de sécurité empêchant la remontée hors des racines autorisées.

### 4.6 Sécurité & Mises à Jour APT
- **Score de Sécurité** : Indice global calculé en fonction des vulnérabilités actives (mots de passe par défaut, filtrage LAN).
- **Auditeur de Ports** : Liste des 10 premiers ports réseau en écoute sur le serveur avec leur PID.
- **Gestionnaire de Mises à Jour APT** : Liste détaillée des paquets mis à jour en attente et indication des patchs de sécurité.
- **Contrôles d'Alimentation Hôte** : Boutons pour redémarrer (`sudo reboot`) ou éteindre (`sudo shutdown`) le serveur Ubuntu avec double confirmation.

### 4.7 Sauvegardes Encadrées
- **Jobs Prédéfinis** : Déclenchement en un clic de sauvegardes pour la configuration `/etc/nexus`, la base SQLite ou les fichiers Compose.
- **Historique & Intégrité** : Tableau traçant l'heure de début, la durée, la taille générée et la vérification d'intégrité de la sauvegarde.

### 4.8 Événements & Journal d'Audit
- **Traçabilité Totale** : Consigne chaque connexion utilisateur, action sur un conteneur, exécution de sauvegarde ou commande d'alimentation.
- **Filtres Avancés** : Recherche par mot-clé, par niveau (`INFO`, `WARNING`, `ERROR`) ou par source (`AUTH`, `CONTAINER`, `BACKUP`, `SYSTEM`).

### 4.9 Paramètres & Diagnostics
- **Ajustement des Seuils** : Modification des seuils d'avertissement CPU, RAM et Disque.
- **Santé des Composants** : Vérification en direct de la connexion au backend FastAPI et à Portainer.

---

## 5. PROCÉDURE DE SAUVEGARDE & TEST DE RESTAURATION

### 5.1 Génération d'une Sauvegarde Snapshot
Lorsqu'un job de sauvegarde est exécuté, le backend crée une copie instantanée (snapshot) des fichiers de données cibles dans le dossier configuré (`/var/backups/nexus/`). Une empreinte d'intégrité est calculée et enregistrée en base.

### 5.2 Procédure de Restauration Étape par Étape (Vérifiée)
En V1, la restauration est effectuée manuellement par SSH afin d'éviter tout écrasement ponctuel destructeur :

1. Connexion au serveur Ubuntu par SSH.
2. Arrêt temporaire des conteneurs applicatifs impactés :
   ```bash
   docker compose down
   ```
3. Restauration de la base SQLite snapshot :
   ```bash
   cp /var/backups/nexus/db/nexus_snapshot.db ./nexus.db
   ```
4. Relancement des services :
   ```bash
   docker compose up -d
   ```
5. Vérification du journal d'audit dans l'IHM web Nexus Dashboard.

---

## 6. AUDIT DE SÉCURITÉ & MISES À JOUR APT

### 6.1 Règles d'Audit Automatique
Le scanner de sécurité interne évalue en permanence :
1. **Mot de passe Administrateur** : Alerte de sévérité haute si `ADMIN_PASSWORD` utilise la valeur par défaut `admin123`.
2. **Filtrage LAN** : Avertissement de sévérité moyenne si `ENFORCE_LAN_ONLY` est désactivé.
3. **Ports Ouverts** : Inspection des sockets TCP en écoute via `psutil`.

---

## 7. DÉPANNAGE & MAINTENANCE

### 7.1 Réinitialisation du Mot de Passe Admin
En cas d'oubli du mot de passe administrateur :
```bash
# Supprimer la base SQLite locale
rm nexus.db

# Redémarrer l'application (le compte admin/admin123 sera recréé automatiquement)
docker compose restart
```

### 7.2 Consultation des Logs de l'Application
```bash
# Tous les conteneurs
docker compose logs -f --tail=100

# Backend uniquement
docker compose logs -f backend
```
