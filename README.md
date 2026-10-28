# Nexus Dashboard — Console d'Administration Serveur Ubuntu

> Console web privée de supervision et d'administration pour serveur domestique Ubuntu hébergeant Docker & Portainer.

![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2F%20Python-emerald)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![UI](https://img.shields.io/badge/UI-Tailwind%20%2B%20Framer%20Motion-purple)
![License](https://img.shields.io/badge/License-MIT-green)

```
                  +-----------------------------------+
                  |   Client Web (LAN Local Browser)   |
                  +-----------------------------------+
                                    |
                                    v HTTP (Port 80)
                  +-----------------------------------+
                  |     Serveur Domestique Ubuntu     |
                  |  - Nginx Reverse Proxy (Port 80)  |
                  |  - Backend FastAPI (Port 8000)    |
                  |  - Systemd Service (Autostart)    |
                  +-----------------------------------+
```

---

## 🌟 Fonctionnalités Principales

- 📊 **Vue d'Ensemble & Métriques en Temps Réel** : CPU, Mémoire RAM, Stockage Disque, Uptime et graphiques temporels d'utilisation (Recharts).
- 🐳 **Gestion Docker via Portainer API** : Liste des conteneurs, états, ports, logs récents, stacks Compose, et actions sécurisées (Start / Stop / Restart) avec confirmations.
- 🌐 **Réseau & Diagnostics** : Débits entrant/sortant en temps réel, interfaces IP locales et pings de disponibilité de dépendances.
- 💾 **Stockage & Volumes** : Progression d'occupation des disques, seuils d'avertissement (80%) et critiques (90%).
- 📁 **Gestionnaire de Fichiers (File Manager)** : Explorateur de répertoires système et prévisualisation sécurisée de fichiers texte.
- 🛡️ **Sécurité & Mises à Jour APT** : Audit des vulnérabilités, liste des paquets APT à mettre à jour et commandes d'extinction/redémarrage du serveur.
- 💾 **Sauvegardes Encadrées** : Lancement de jobs prédéfinis, historique d'exécution avec contrôle d'intégrité et guide de restauration.
- 📜 **Journal d'Audit & Événements** : Traçabilité complète des connexions et des opérations système.
- 🔒 **Sécurité Réseau LAN** : Restriction d'accès au réseau local, authentification JWT, hachage `bcrypt`.

---

## 🛠️ 1. Tests & Développement Local (Avant Déploiement)

Vous pouvez exécuter et tester la console localement sur votre poste de travail (macOS, Linux, Windows WSL) sans avoir besoin d'un serveur Portainer actif.

### Lancement Rapide en une Commande (Script Local)
```bash
# 1. Cloner le dépôt et entrer dans le dossier
git clone https://github.com/votre-repo/nexus-dashboard.git
cd nexus-dashboard

# 2. Lancer le script autonome
./start-local.sh
```
ou via Make :
```bash
make dev
```

- **Application Web React** : `http://localhost:5173`
- **Documentation Swagger API** : `http://localhost:8000/api/v1/docs`
- **Identifiants de test** : `admin` / `admin123`

*En développement local (`DEV_MODE=true`), l'application simule automatiquement les conteneurs et métriques pour offrir un test fluide de l'ensemble des pages.*

### Exécution des Tests Automatisés Locaux
```bash
# Exécuter tous les tests backend et vérifier le build frontend
make test
```

---

## 🚀 2. Installation Pas à Pas sur Serveur Ubuntu (par SSH)

### Étape 1 : Connexion SSH à votre serveur Ubuntu
```bash
ssh utilisateur@ip_de_votre_serveur
```

### Étape 2 : Mettre à jour le système et installer Docker & Git
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl docker.io docker-compose-v2
sudo usermod -aG docker $USER
newgrp docker
```

### Étape 3 : Cloner le projet Nexus Dashboard
```bash
cd /opt
sudo git clone https://github.com/votre-repo/nexus-dashboard.git
sudo chown -R $USER:$USER /opt/nexus-dashboard
cd /opt/nexus-dashboard
```

### Étape 4 : Configurer le fichier d'environnement `.env`
```bash
cp .env.example .env
nano .env
```
*Renseigner `SECRET_KEY`, `ADMIN_PASSWORD` et insérer votre `PORTAINER_API_TOKEN`.*

---

## ⚙️ 3. Configuration du Démarrage Automatique (Autostart)

### Méthode A : Autostart via Docker Compose (Recommandé)
Le fichier `docker-compose.yml` inclut la politique `restart: unless-stopped`.
```bash
docker compose up -d --build
```
*Docker relancera automatiquement Nexus Dashboard à chaque démarrage du serveur.*

---

### Méthode B : Autostart via Service Systemd (Recommandé en entreprise)

1. Créer le fichier de service Systemd :
```bash
sudo nano /etc/systemd/system/nexus-dashboard.service
```

2. Coller la configuration suivante :
```ini
[Unit]
Description=Nexus Dashboard Container Stack
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/nexus-dashboard
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

3. Activer et démarrer le service :
```bash
sudo systemctl daemon-reload
sudo systemctl enable nexus-dashboard.service
sudo systemctl start nexus-dashboard.service
```

---

## 📚 4. Documentation Technique Complète

Pour consulter l'intégralité du manuel d'utilisation, des spécifications d'architecture et de la procédure de restauration, référez-vous au fichier unique :
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**
