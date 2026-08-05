# Developpement Jolie Lab Beauty

Ce dossier sert de base de travail pour transformer le site en vrai tunnel de prise de commande avec un espace admin.

Objectif principal :
- garder WhatsApp comme canal secondaire visible ;
- orienter les clientes vers une commande directement sur le site ;
- enregistrer les commandes dans une base de donnees ;
- afficher les commandes dans un espace admin prive ;
- permettre a l'admin de gerer les produits ;
- declencher un tracking Meta Pixel plus propre.

Principe de travail :
1. Developper une phase a la fois.
2. Lancer l'audit de phase avant de passer a la suivante.
3. Corriger les points bloques par l'audit.
4. Commit et push seulement quand la phase est stable.
5. Deployer sur Hostinger apres validation.

Fichiers importants :
- `IMPLEMENTATION_PLAN.md` : vue globale des phases.
- `AUDIT_CHECKLIST.md` : controles a lancer a la fin de chaque phase.
- `AUDIT_LOG.md` : journal des audits effectues.
- `MERCI_TICKET_ANIMATION.md` : specification UX de la page de confirmation.
- `PHASE_01_TUNNEL_COMMANDE.md` : tunnel client sans WhatsApp obligatoire.
- `PHASE_02_BACKEND_COMMANDES.md` : stockage serveur des commandes.
- `PHASE_03_PAGE_MERCI.md` : page merci avec ticket anime.
- `PHASE_04_ADMIN_COMMANDES.md` : lecture et gestion des commandes.
- `PHASE_05_ADMIN_PRODUITS.md` : gestion des produits cote admin.
- `PHASE_06_NOTIFICATIONS_PIXEL.md` : notifications et tracking Meta Pixel.
- `PHASE_07_DEPLOY_FINAL.md` : preparation push, deploiement et verification live.
