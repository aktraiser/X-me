#!/bin/bash

# Installer pdfjs-dist
yarn add pdfjs-dist@3.11.174

# Créer le dossier public s'il n'existe pas
mkdir -p public

# Télécharger le worker PDF.js
curl -L -o public/pdf.worker.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js

# Ajouter les types pour TypeScript
yarn add -D @types/pdfjs-dist 