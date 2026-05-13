# Jolie Lab Beauty Sanity Studio

Ce dossier prépare l'interface admin des produits Jolie Lab Beauty.

## Mise en route

1. Créer un projet sur Sanity.
2. Le projet Sanity actuel est `fkziz8e9`. Si besoin, il peut être remplacé dans `sanity.config.js`, `sanity.cli.js` et `../data/sanity-config.js`.
3. Garder le dataset `production`, sauf besoin spécifique.
4. Installer les dépendances :

```bash
npm install
```

5. Lancer le studio :

```bash
npm run dev
```

6. Importer les produits actuels dans Sanity. Le token doit rester privé et ne doit jamais être écrit dans Git :

```powershell
$env:SANITY_PROJECT_ID="votre_project_id"
$env:SANITY_DATASET="production"
$env:SANITY_AUTH_TOKEN="votre_token_sanity"
npm run import:products
```

Pour écraser les produits déjà importés avec les données locales :

```powershell
npm run import:products -- --replace
```

7. Ajouter les origines CORS dans Sanity :
   - `http://localhost:8080`
   - `https://jolielabbeauty.com`
   - `https://www.jolielabbeauty.com`

8. Déployer le studio :

```bash
npm run deploy
```

Studio deploye : `https://jolie-lab-beauty.sanity.studio/`

Le site public lit les produits en direct depuis Sanity quand `projectId` est renseigné. Si Sanity est indisponible ou non configuré, il utilise le catalogue local `data/products.js`.
