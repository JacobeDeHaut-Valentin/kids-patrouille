# Kids Patrouille — Monstres & Missions

PWA gamifiée pour motiver un enfant à réaliser ses routines quotidiennes,
avec un univers de collection "Monstres de Poche".

## 🗂️ Structure
```
kids-patrouille/
├── index.html              ← Squelette HTML
├── manifest.json           ← Manifest PWA
├── favicon.svg             ← Icône
├── service-worker.js       ← SW pour offline
├── README.md, CHANGELOG.md
├── css/
│   ├── core.css            ← Variables + reset + layout
│   ├── themes.css          ← 5 thèmes + mode nuit
│   ├── components.css      ← Composants visuels
│   └── animations.css      ← Confetti, feux d'artifice
└── js/
    ├── app.js              ← Point d'entrée
    ├── data.js             ← BESTIARY, TASKS, THEMES, SOUND_PACKS
    ├── state.js            ← localStorage + migration + crypto
    ├── helpers.js          ← Utilitaires
    ├── audio.js            ← Web Audio + packs sonores
    ├── timer.js            ← Minuteur + Wake Lock
    ├── rewards.js          ← Tirage + confettis + animations
    ├── theme.js            ← Application thème + mode nuit
    ├── modal.js            ← Modale générique
    ├── ui-home.js          ← Écran d'accueil
    ├── ui-gallery.js       ← Galerie de monstres
    ├── ui-custom.js        ← Personnalisation
    └── ui-parent.js        ← Zone parent (CRUD + stats)
```

## 🚀 Installation locale (test)

1. Installer **VS Code** + l'extension **Live Server**
2. Ouvrir le dossier `kids-patrouille/`
3. Clic droit sur `index.html` → **Open with Live Server**
4. ⚠️ Indispensable : les modules ES6 ne marchent pas en double-clic (file://)

## 🌐 Déploiement GitHub Pages

1. Pousser le dossier sur ton repo GitHub
2. Settings → Pages → Source = `main` branch, dossier `/`
3. Attendre ~1 minute, l'URL `https://USER.github.io/REPO/` est active

## 📲 Installation PWA

- **Android Chrome** : ouvrir l'URL → menu ⋮ → "Ajouter à l'écran d'accueil"
- **iOS Safari** : ouvrir l'URL → Partager ↑ → "Sur l'écran d'accueil"

## 🔐 Zone Parent

- **Appui long 2s** sur le cadenas 🔒 en bas à droite
- **Première fois** : calcul mental `(A × B) + C`
- **Ensuite** : code PIN à 4 chiffres au choix

## 🛠️ Debug

- Console navigateur : F12 → onglet Console
- Sur mobile Android : `chrome://inspect` depuis Chrome desktop (USB debugging)