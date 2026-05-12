# Jolie Lab Beauty Sanity Studio

Ce dossier prépare l'interface admin des produits Jolie Lab Beauty.

## Mise en route

1. Créer un projet sur Sanity.
2. Remplacer `REMPLACER_PROJECT_ID` dans `sanity.config.js`.
3. Renseigner le même `projectId` dans `../data/sanity-config.js`.
4. Installer les dépendances :

```bash
npm install
```

5. Lancer le studio :

```bash
npm run dev
```

6. Ajouter les origines CORS dans Sanity :
   - `http://localhost:8080`
   - `https://jolielabbeauty.com`
   - `https://www.jolielabbeauty.com`

7. Déployer le studio :

```bash
npm run deploy
```

Le site public lit les produits en direct depuis Sanity quand `projectId` est renseigné. Si Sanity est indisponible ou non configuré, il utilise le catalogue local `data/products.js`.
