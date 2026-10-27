---
title: "Nexus Dashboard — Cahier des charges"
version: "1.0"
date: "2026-10-27"
audience: "Développeur professionnel"
---

NEXUS
# Cahier des charges
Dashboard de gestion pour serveur domestique Ubuntu
Interface web d’administration • Monitoring système • Docker / Portainer • Réseau • Sauvegardes
> *Objet : définir le périmètre, les exigences, les contraintes de sécurité, les livrables et les critères de recette. Ce document ne constitue pas une implémentation et ne prescrit pas inutilement chaque choix interne : le développeur doit proposer une architecture argumentée et signaler toute hypothèse nécessitant validation.*

## 1. Contexte et objectifs
Le projet consiste à créer une console web privée permettant de superviser et d’administrer un serveur domestique Ubuntu hébergeant Docker. Portainer est déjà utilisé ou prévu comme couche de gestion des conteneurs ; le dashboard doit exploiter son API REST plutôt que réimplémenter son rôle.

### 1.1 Objectifs principaux
- Centraliser dans une interface unique l’état du serveur, les ressources système, les conteneurs, le réseau et les sauvegardes.
- Fournir des informations compréhensibles et actualisées, avec horodatage et indication explicite des données indisponibles.
- Permettre certaines actions d’administration à risque maîtrisé, notamment les actions autorisées sur les conteneurs Docker via Portainer.
- Réduire le besoin d’utiliser plusieurs interfaces pour les opérations quotidiennes, sans remplacer Portainer pour ses fonctions avancées.
- Fournir un projet maintenable, documenté, testable et déployable sur le serveur Ubuntu.

### 1.2 Hors objectifs / exclusions du périmètre initial
- Exposition publique sur Internet, accès depuis l’extérieur du réseau local ou mise en place d’un service cloud.
- Remplacement complet de Portainer ou de ses fonctions avancées de gestion des stacks, images, volumes et réseaux.
- Terminal web arbitraire, exécution de commandes shell libres, éditeur de fichiers système ou accès root depuis l’interface.
- Mise à jour automatique non contrôlée du système, de Docker, des images ou des stacks.
- Garantie de compatibilité avec toutes les versions d’Ubuntu, Docker ou Portainer sans matrice de versions convenue.

## 2. Utilisateurs, périmètre et hypothèses
> *Le développeur doit produire une liste des informations manquantes avant de figer les choix de déploiement. Les valeurs d’exemple (adresse IP, ports, sous-réseau, identifiants, endpoint Portainer) ne doivent jamais être considérées comme réelles.*

## 3. Périmètre fonctionnel

### 3.1 Vue d’ensemble / tableau de bord
- Afficher l’état global : serveur joignable, date/heure du dernier relevé, état des dépendances et éventuelles alertes.
- Présenter des cartes pour CPU, mémoire, stockage, uptime, conteneurs actifs/arrêtés et état des sauvegardes.
- Afficher des courbes temporelles pour CPU, RAM, trafic réseau et stockage si les mesures historiques sont disponibles.
- Indiquer clairement l’unité, la période, l’heure du dernier relevé et la provenance des données.
- Distinguer les valeurs réelles, les données périmées, les erreurs de collecte et les fonctionnalités non prises en charge.
- Ne pas afficher de chiffres fictifs dans l’environnement de production ; utiliser des états vides explicites avant la première collecte.

### 3.2 Monitoring système
La collecte doit limiter la charge induite. Les intervalles de rafraîchissement et de rétention seront configurables ; une proposition de départ est un rafraîchissement de l’interface toutes les 5 à 10 secondes et une collecte historique toutes les 30 à 60 secondes, à valider selon le matériel et les besoins.

### 3.3 Conteneurs et stacks Docker via Portainer
- Lister les conteneurs accessibles via le compte Portainer dédié : nom, ID abrégé, image, état, statut, ports publiés et stack associée si disponible.
- Filtrer et rechercher par nom, état et stack ; distinguer actif, arrêté, en redémarrage, en pause et état inconnu.
- Afficher les détails disponibles, les timestamps pertinents et les logs récents avec limites de taille et de durée.
- Proposer démarrage, arrêt et redémarrage uniquement pour les conteneurs explicitement autorisés.
- Exiger une confirmation pour toute action qui interrompra un service ; afficher le résultat et rafraîchir l’état après l’action.
- Présenter les erreurs de Portainer sans exposer les jetons, en-têtes d’authentification ou détails sensibles.
- Afficher les stacks et leur état si l’API et les permissions de la version installée le permettent ; toute modification de stack est hors V1 par défaut.
- Prévoir pagination, timeout, gestion des réponses incomplètes et états de chargement.

### 3.4 Réseau
- Afficher le débit entrant/sortant par interface, avec unités et période de calcul.
- Afficher les interfaces et adresses nécessaires au diagnostic local ; ne pas publier de données réseau vers un tiers.
- Permettre des contrôles de disponibilité simples et bornés pour les dépendances configurées (backend, Portainer, collecteur).
- Ne pas effectuer de scan réseau général, de découverte agressive ni d’ouverture automatique de ports.
- Présenter les erreurs de connectivité avec horodatage et état de la dernière tentative.

### 3.5 Stockage et volumes
- Afficher l’utilisation des systèmes de fichiers pertinents et alerter sur des seuils configurables.
- Identifier, lorsque c’est possible, les volumes Docker sans exposer de contenu sensible.
- Ne pas proposer de suppression de volume, d’image ou de fichier depuis la V1.
- Prévoir des seuils par défaut proposés à la validation, par exemple avertissement à 80 % et critique à 90 % ; ces seuils doivent être configurables.

### 3.6 Sauvegardes
- Définir explicitement les éléments sauvegardés : fichiers de configuration, fichiers de déploiement, données persistantes et/ou volumes sélectionnés.
- Afficher la dernière exécution, son statut, l’heure, la durée, la taille lorsque disponible, la destination logique et le message d’erreur expurgé.
- Permettre de lancer une tâche de sauvegarde prédéfinie ; ne pas accepter une commande, un chemin ou une destination arbitraire fournie par l’utilisateur.
- Conserver un historique des exécutions et signaler les sauvegardes trop anciennes selon un seuil configurable.
- Prévoir une vérification d’intégrité et documenter un test de restauration ; une sauvegarde n’est pas considérée comme validée par sa seule création.
- Privilégier une destination distincte du disque source ; chiffrement au repos si la destination ou le contexte l’exige.
- La suppression de sauvegardes et la restauration destructive sont hors périmètre V1 ou nécessitent un processus de confirmation renforcé.
> *Le choix de l’outil de sauvegarde (par exemple Restic, Borg ou scripts encadrés) est à proposer par le développeur. Le dashboard doit s’intégrer à des tâches définies et contrôlées ; il ne doit pas improviser une stratégie de sauvegarde.*

### 3.7 Journaux, événements et alertes
- Afficher les événements récents : démarrage/arrêt de conteneur, échec d’appel Portainer, collecte impossible, tâche de sauvegarde échouée.
- Horodater les événements et inclure le résultat sans enregistrer de secrets ni de données superflues.
- Afficher les erreurs de façon compréhensible et proposer une action corrective sûre lorsque possible.
- Définir en V1 les alertes visibles dans l’interface ; les notifications par e-mail ou messagerie restent optionnelles et hors périmètre tant qu’elles ne sont pas validées.

## 4. Exigences d’interface et d’expérience utilisateur
- Direction artistique : fond noir/anthracite, accents violets et bleus, contrastes lisibles, esthétique technique sobre.
- Navigation latérale ou équivalent : Vue d’ensemble, Conteneurs, Réseau, Stockage, Sauvegardes, Événements, Paramètres.
- Interface responsive : desktop prioritaire, tablette et téléphone utilisables pour consulter l’état et effectuer les actions autorisées.
- États standardisés : chargement, aucune donnée, succès, erreur, accès refusé, données périmées et dépendance indisponible.
- Les actions dangereuses doivent être clairement distinguées des actions de consultation ; confirmation explicite et feedback après action.
- Graphiques lisibles avec légendes, unités, plages de temps et valeurs accessibles sans dépendre uniquement de la couleur.
- Accessibilité de base : navigation clavier, libellés explicites, focus visible et contrastes suffisants.
- Pas de données factices en production, pas de liens morts, pas de boutons décoratifs sans action réelle.

## 5. Architecture et contraintes techniques

### 5.1 Architecture cible
Architecture recommandée à valider par le développeur : frontend React + TypeScript, backend API (FastAPI/Python ou technologie équivalente justifiée), collecte système via bibliothèque ou interfaces OS, intégration Portainer côté backend, et persistance légère pour l’historique et les événements.
- Le navigateur ne communique jamais directement avec l’API Portainer ni avec Docker Engine.
- Le backend sert de point de contrôle unique : authentification, autorisation, validation, journalisation et gestion des erreurs.
- Les métriques système sont collectées via des méthodes en lecture seule autant que possible.
- Les versions de runtime, dépendances, images de base et services doivent être fixées ou verrouillées pour assurer des déploiements reproductibles.
- Le frontend et le backend doivent être séparés logiquement, avec contrats d’API documentés.
- La communication avec Portainer doit vérifier le certificat TLS ; désactiver la validation TLS est interdit en production.
- La configuration d’environnement doit être externalisée et validée au démarrage ; absence d’un secret obligatoire = échec de démarrage sûr.

### 5.2 Portainer REST API
- Utiliser la documentation officielle correspondant à la version réellement installée et vérifier les endpoints dans le cadre de l’intégration.
- Utiliser un jeton API dédié, avec le périmètre de permissions minimal compatible avec les fonctions retenues.
- Stocker le jeton uniquement côté backend, hors du dépôt Git et hors des bundles frontend.
- Définir timeouts, gestion des codes HTTP, retries limités pour les lectures idempotentes et erreurs non ambiguës.
- Ne pas réessayer aveuglément une action d’écriture susceptible d’être exécutée deux fois.
- Limiter les logs de conteneurs en volume et durée ; ne pas exposer des logs sensibles à des utilisateurs non autorisés.
- Ne pas faire confiance à un ID reçu du navigateur : vérifier son format, son existence et son périmètre d’accès côté serveur.
- Documenter les écarts entre versions Portainer et le comportement de repli si une fonction n’est pas prise en charge.

### 5.3 Déploiement
- Déploiement reproductible sur Ubuntu via Docker Compose ou mécanisme équivalent documenté.
- Le service web doit écouter uniquement sur l’interface ou l’adresse prévue pour le LAN ; ne pas exposer par défaut le backend à toutes les interfaces.
- Préférer un reverse proxy local avec HTTPS ; si HTTP est retenu temporairement, documenter les risques et interdire l’accès hors LAN.
- Configurer les ports explicitement et réduire la surface réseau exposée.
- Ne pas monter le socket Docker dans le backend par défaut. Si une exigence l’impose, la justifier comme accès hautement privilégié, isoler le composant et réduire les capacités.
- Éviter le mode privilégié, les capacités Linux inutiles et l’exécution du conteneur en root ; utiliser un utilisateur non privilégié lorsque compatible.
- Fournir une procédure de mise à jour, de retour arrière, de sauvegarde de configuration et de désinstallation.

## 6. Exigences de sécurité — obligatoires
> *Le dashboard est un outil d’administration : une compromission peut permettre l’arrêt de services ou l’accès à des données sensibles. Le développeur doit traiter l’application et son backend comme une surface à privilèges élevés, même si l’accès est limité au LAN.*

## 7. Données, configuration et observabilité

### 7.1 Configuration
- Externaliser au minimum : URL Portainer, jeton API, identifiant d’environnement, plage LAN autorisée, port d’écoute, paramètres de session, intervalles de collecte et politique de rétention.
- Fournir un fichier `.env.example` sans aucune valeur secrète réelle.
- Exclure `.env`, bases de données locales, journaux et sauvegardes du contrôle de version.
- Documenter les permissions de fichiers nécessaires pour les secrets et données persistantes.

### 7.2 Historique et rétention
- Proposer une politique de rétention configurable et documentée pour les métriques et événements.
- Limiter la volumétrie des journaux et éviter d’enregistrer les données sensibles ou les logs complets par défaut.
- Fournir une procédure de purge contrôlée de l’historique expiré.
- Les dates doivent être stockées dans un format non ambigu et affichées selon le fuseau horaire configuré.

### 7.3 Santé des composants
- Fournir un endpoint de santé interne ne révélant aucune information sensible.
- Distinguer l’état de l’application, du collecteur système et de Portainer.
- Prévoir des timeouts et éviter qu’une panne Portainer bloque l’ensemble de l’interface.

## 8. Exigences non fonctionnelles

## 9. API interne — principes attendus
Le développeur définit et documente le contrat de l’API interne. Les chemins ci-dessous sont indicatifs et ne constituent pas une obligation de nommage.
Les endpoints d’écriture doivent appliquer des contrôles CSRF adaptés, des limites de débit, des permissions côté serveur et une journalisation d’audit. L’API doit utiliser des codes HTTP cohérents et un format d’erreur stable.

## 10. Livrables attendus
- Code source complet du frontend et du backend, versionné dans un dépôt livré au commanditaire.
- Fichiers de déploiement : Dockerfiles, Compose et configuration de proxy si retenue.
- Fichier `.env.example` documenté, sans secret, avec liste exhaustive des variables nécessaires.
- Documentation d’architecture et diagramme des flux réseau, des composants et des dépendances.
- Documentation de l’intégration Portainer : version supportée, endpoints, permissions requises, exemples expurgés et erreurs gérées.
- Documentation d’installation, configuration, mise à jour, retour arrière, sauvegarde et désinstallation.
- Guide utilisateur en français décrivant chaque page, les actions autorisées et les erreurs courantes.
- Tests automatisés : tests unitaires, tests d’intégration avec Portainer simulé ou environnement de test, et tests de sécurité essentiels.
- Rapport de tests de recette avec résultats, anomalies connues et éléments non couverts.
- Inventaire des dépendances et licences, ainsi qu’une procédure de mise à jour de sécurité.
- Procédure de restauration des données et démonstration documentée d’un test de restauration.

## 11. Plan de recette et critères d’acceptation
La livraison est acceptée lorsque les critères obligatoires ci-dessous sont satisfaits sur l’environnement cible convenu. Les tests doivent être reproductibles et leurs résultats consignés.

## 12. Plan de réalisation proposé

## 13. Risques et points de vigilance
- Le jeton Portainer peut conférer des privilèges importants : compte dédié, droits minimaux, rotation et révocation documentées.
- Une action Docker mal conçue peut interrompre un service ou entraîner une perte de données : limiter les actions et exiger confirmation.
- Les règles UFW ne suffisent pas toujours à contrôler les ports publiés par Docker : tester la politique réseau effective.
- Les métriques de température ou certains détails réseau peuvent ne pas être disponibles sur tous les matériels.
- Les endpoints et permissions Portainer peuvent varier selon la version et le type d’environnement ; effectuer une validation précoce.
- Une sauvegarde stockée sur le même disque physique que les données d’origine ne protège pas d’une panne de ce disque.
- Le dashboard ne doit pas être considéré comme un système de supervision haute disponibilité ; définir les limites d’usage dans la documentation.

## 14. Questions à trancher au lancement

## 15. Références officielles
- Portainer — documentation API : https://docs.portainer.io/api
- Portainer — accès à l’API : https://docs.portainer.io/api/access
- Docker Engine — sécurité : https://docs.docker.com/engine/security/
- Docker Engine — réseau : https://docs.docker.com/engine/network/
- Ubuntu Server — pare-feu : https://ubuntu.com/server/docs/how-to/security/firewalls/
- OWASP — Application Security Verification Standard : https://owasp.org/www-project-application-security-verification-standard/
- OWASP — Cheat Sheet Series : https://cheatsheetseries.owasp.org/

## 16. Conditions de validation du cahier des charges
Avant le démarrage, le commanditaire et le développeur valident le périmètre de la V1, les versions supportées, les actions d’administration autorisées, la destination des sauvegardes, la politique d’accès LAN, les critères de performance et les livrables. Toute modification du périmètre est documentée et fait l’objet d’un accord avant réalisation.
FIN DU CAHIER DES CHARGES

| Élément | Cible |
| --- | --- |
| Commanditaire | Propriétaire d’un serveur domestique sous Ubuntu |
| Destinataire | Développeur professionnel / équipe de développement |
| Nom de travail | Nexus Dashboard |
| Frontend demandé | React + TypeScript |
| Gestion Docker | Portainer via sa REST API officielle |
| Accès prévu | Réseau local uniquement |
| Direction artistique | Noir / violet / bleu, interface moderne et responsive |
| Statut du document | Spécification initiale à valider lors du cadrage technique |


| Sujet | Exigence / hypothèse |
| --- | --- |
| Utilisateurs | Usage privé par le propriétaire du serveur ; possibilité d’un compte administrateur unique en V1. |
| Réseau | Accès autorisé uniquement depuis le LAN explicitement configuré ; plage CIDR à confirmer. |
| Hôte | Ubuntu Server ; version, architecture CPU, mémoire, stockage et interfaces à confirmer. |
| Docker | Docker Engine installé et fonctionnel. |
| Portainer | Portainer déjà disponible ; version, URL, TLS, endpoint ID et modèle de permissions à confirmer. |
| Navigateur | Versions récentes de Chrome, Edge et Firefox ; affichage desktop prioritaire, mobile utilisable. |
| Données persistantes | Historique minimal nécessaire pour les métriques, événements et sauvegardes ; politique de rétention à définir. |
| Langue | Interface en français en V1. |


| Donnée | Comportement attendu |
| --- | --- |
| CPU | Utilisation globale en pourcentage ; charge système si disponible ; période de mesure documentée. |
| RAM | Mémoire totale, utilisée, disponible et pourcentage d’occupation ; distinction cache/buffers si pertinente. |
| Stockage | Capacité totale, utilisée, disponible et pourcentage par point de montage pertinent ; signaler les erreurs d’accès. |
| Uptime | Durée depuis le dernier démarrage du système. |
| Températures | Afficher uniquement si des capteurs sont exposés et lisibles ; sinon indiquer « indisponible » sans erreur bloquante. |
| Réseau | Interfaces pertinentes, débit entrant/sortant calculé sur un intervalle, adresses locales autorisées à l’affichage. |
| Charge / disponibilité | État du collecteur, date de dernière collecte et durée éventuelle d’indisponibilité. |


| ID | Exigence | Critère de conformité |
| --- | --- | --- |
| SEC-01 | Accès LAN uniquement | Ports et règles réseau documentés ; accès depuis un réseau non autorisé refusé. |
| SEC-02 | Authentification | Aucune page d’administration ni API sensible accessible sans session valide. |
| SEC-03 | Autorisation serveur | Chaque action est autorisée côté backend ; masquer un bouton côté frontend ne suffit pas. |
| SEC-04 | Protection des secrets | Jeton Portainer absent du navigateur, des logs, du dépôt Git et des erreurs publiques. |
| SEC-05 | Transport | TLS validé pour Portainer ; HTTPS local recommandé pour la session d’administration. |
| SEC-06 | CSRF / cookies | Protection CSRF adaptée aux opérations d’écriture ; cookies HttpOnly, SameSite et Secure lorsque HTTPS est activé. |
| SEC-07 | Injection / validation | Validation stricte des paramètres ; aucune exécution de shell à partir d’une entrée utilisateur. |
| SEC-08 | Moindre privilège | Compte Portainer dédié et permissions minimales ; backend non privilégié autant que possible. |
| SEC-09 | Journalisation | Journaliser les actions sensibles, utilisateur, résultat et horodatage sans secrets. |
| SEC-10 | Dépendances | Versions contrôlées, suivi des vulnérabilités et procédure de mise à jour. |
| SEC-11 | Erreurs | Réponses externes expurgées ; détails techniques conservés côté serveur avec accès contrôlé. |
| SEC-12 | CORS | Origines strictement autorisées ; pas de wildcard avec authentification. |
| SEC-13 | Rate limiting | Limiter les tentatives de connexion et les appels sensibles selon un seuil documenté. |
| SEC-14 | Sauvegardes | Accès limité aux tâches prédéfinies ; destination et chemins contrôlés ; test de restauration documenté. |
| SEC-15 | Pare-feu | Documenter les règles UFW et l’impact des ports Docker publiés ; vérifier les règles effectives depuis le LAN. |


| Domaine | Exigence cible |
| --- | --- |
| Performance | Chargement initial cible inférieur à 3 secondes sur le LAN sur matériel compatible ; à mesurer et documenter. |
| Actualisation | Valeurs de monitoring actualisées selon l’intervalle convenu ; afficher l’heure de dernière collecte. |
| Robustesse | Une API indisponible ne doit pas faire tomber l’ensemble du dashboard ; affichage d’un état dégradé. |
| Maintenabilité | Code typé, structure modulaire, lint/format, tests automatisés et documentation. |
| Compatibilité | Versions Ubuntu, Docker, Portainer, Node.js et navigateurs consignées dans la documentation de livraison. |
| Ressources | Consommation CPU/RAM de l’application mesurée et raisonnable ; seuil cible à valider après choix du matériel. |
| Accessibilité | Utilisable au clavier pour les actions principales et contrastes suffisants. |
| Confidentialité | Pas de télémétrie tierce ni de transmission de données vers un service externe sans validation explicite. |


| Famille | Exemples indicatifs | Règles |
| --- | --- | --- |
| Santé | GET /api/health | Réponse minimale, sans secret ni détail système sensible. |
| Système | GET /api/system/metrics | Lecture seule ; horodatage et indicateur de fraîcheur. |
| Réseau | GET /api/network/interfaces | Données limitées aux interfaces nécessaires. |
| Conteneurs | GET /api/containers | Données obtenues via Portainer, filtrées et normalisées. |
| Détail / logs | GET /api/containers/{id}/logs | Limite de taille, durée et validation d’identifiant. |
| Actions conteneurs | POST /api/containers/{id}/start\|stop\|restart | Authentification, autorisation, validation, confirmation UI et audit. |
| Sauvegardes | GET /api/backups ; POST /api/backups/{job}/run | Jobs prédéfinis uniquement ; statut et historique. |
| Événements | GET /api/events | Pagination, rétention et filtrage des données sensibles. |


| ID | Test de recette | Résultat attendu |
| --- | --- | --- |
| REC-01 | Installation propre selon la documentation | Le déploiement fonctionne sans étapes non documentées ; services opérationnels. |
| REC-02 | Accès depuis un appareil du LAN autorisé | Interface accessible et authentification fonctionnelle. |
| REC-03 | Accès depuis une origine/réseau non autorisé | Connexion refusée par la configuration réseau et/ou la politique d’accès. |
| REC-04 | Connexion sans session puis appel API sensible | Accès refusé ; aucune donnée ou action sensible exposée. |
| REC-05 | Comparer CPU/RAM/disque avec Ubuntu | Valeurs cohérentes dans une tolérance convenue ; unité et timestamp visibles. |
| REC-06 | Arrêter ou rendre Portainer indisponible en environnement de test | Dashboard toujours accessible ; état Portainer signalé comme indisponible. |
| REC-07 | Lister les conteneurs | Liste cohérente avec Portainer, avec états, filtres et gestion d’erreur. |
| REC-08 | Démarrer/arrêter/redémarrer un conteneur de test | Action autorisée exécutée ; confirmation, résultat, audit et rafraîchissement visibles. |
| REC-09 | Tenter une action sur un conteneur non autorisé | Action bloquée côté backend, même en appelant l’API directement. |
| REC-10 | Entrées malformées et identifiants inconnus | Requête rejetée proprement ; aucune commande arbitraire exécutée. |
| REC-11 | Inspecter le navigateur et les bundles | Aucun jeton Portainer, secret ou identifiant sensible statique exposé. |
| REC-12 | Déclencher une sauvegarde de test | Résultat, heure, durée et erreurs disponibles dans l’interface. |
| REC-13 | Restaurer un jeu de données de test | Procédure documentée et restauration vérifiée sans affecter les données de production. |
| REC-14 | Vérifier journaux et audit | Actions sensibles consignées ; aucun secret présent dans les logs. |
| REC-15 | Redémarrer la machine ou les conteneurs applicatifs | Application redémarre selon la politique convenue et retrouve sa configuration. |
| REC-16 | Vérifier les états de chargement/erreur/vide | Aucun écran bloqué, aucune donnée fictive présentée comme réelle. |
| REC-17 | Tests automatisés | Suite de tests documentée et exécutable ; résultats remis avec la livraison. |


| Phase | Travaux | Sortie attendue |
| --- | --- | --- |
| P0 — Cadrage | Confirmer versions, IP/ports, compte Portainer, permissions, stockage sauvegarde et réseau. | Décisions techniques consignées. |
| P1 — Socle | Architecture, dépôt, pipeline de qualité, authentification, configuration et déploiement minimal. | Application accessible de façon sécurisée. |
| P2 — Monitoring | Collecte système, cartes et graphiques, états dégradés. | Vue d’ensemble connectée aux données réelles. |
| P3 — Portainer | Liste, détail, logs bornés et actions autorisées. | Gestion des conteneurs validée. |
| P4 — Réseau / stockage | Métriques et seuils d’alerte. | Pages Réseau et Stockage opérationnelles. |
| P5 — Sauvegardes | Intégration d’un outil et historique des jobs. | Sauvegarde de test et restauration démontrées. |
| P6 — Durcissement | Tests sécurité, revue de permissions, audit, documentation et recette. | Livraison acceptée. |


| Question | Décision attendue |
| --- | --- |
| Quelle version exacte d’Ubuntu ? | Version LTS, architecture et mises à jour. |
| Quelle version de Portainer et quel type d’environnement ? | Version, URL, HTTPS, endpoint ID et capacités de l’API. |
| Quel sous-réseau LAN doit être autorisé ? | CIDR et éventuelles exceptions. |
| Quel mode HTTPS local ? | Reverse proxy/certificat local ou autre solution documentée. |
| Qui utilise le dashboard ? | Compte unique ou plusieurs utilisateurs et rôles. |
| Quelle destination de sauvegarde ? | Second disque, NAS/serveur distinct ou stockage chiffré distant. |
| Quelles données doivent être sauvegardées ? | Volumes, configurations, bases, fichiers et fréquence. |
| Quelle durée de rétention ? | Métriques, événements, logs et historiques de sauvegarde. |
| Quelles actions Docker sont autorisées en V1 ? | Liste blanche explicite ; stacks modifiables ou non. |
| Quelles notifications sont nécessaires ? | Aucune en V1 ou canal additionnel validé. |
