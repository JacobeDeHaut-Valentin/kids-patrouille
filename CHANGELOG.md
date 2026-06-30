# Changelog

# Changelog

## v4.1.0 - Multi-enfants local & récompenses personnalisées

- 👧👦 Ajout du modèle multi-enfants en local
- 🔄 Migration automatique des anciennes données vers un premier enfant
- 🎯 Chaque enfant possède ses propres missions, points, monstres, statistiques et réglages de récompense
- 🎁 Ajout des récompenses personnalisées avec coût en points
- ⭐ Possibilité d’utiliser une récompense et de déduire les points
- ♻️ Ajout d’un bouton “Reset missions du jour” sans toucher aux points, monstres ou statistiques
- 👾 Les monstres déjà débloqués sont maintenant cliquables dans la galerie
- ✨ Relecture de l’animation de révélation pour les monstres déjà débloqués
- 🔧 Refonte de la zone parent avec sections plus lisibles
- 🧱 Préparation technique pour une future V5 avec Supabase et code foyer

## v4.0.0 - Architecture modulaire
- 🏗️ Refonte en architecture modulaire : 4 fichiers CSS + 13 modules JS ES6
- 📦 Manifest, Service Worker et favicon externalisés
- 📛 Renommage : "Monstres & Missions" → "Kids Patrouille — Monstres & Missions"
- 🔄 Migration auto des données depuis l'ancien storage key `MonstresEtMissions`
- 📂 Préparation pour évolution multi-enfants + sync Supabase

## v3.3.0
- 🐾 Bestiaire enrichi : 35 monstres (20 communs + 10 rares + 5 épiques)
- ⏰ Sonnerie d'alarme à la fin du timer + Wake Lock robuste

## v3.2.0
- 🔄 Bouton "Refaire" sur tâches validées
- ✅❌ Boutons "Réussi" / "Pas réussi" en fin de timer (+10 / +1 pt)
- 🔑 Mot de passe parent à 4 chiffres (hash SHA-256)
- 🎨 5 thèmes : Classique / Aventurier / Petit Éclair / Nature / Robot
- 🔊 3 packs sonores : Classique / Bulles / Arcade
- 📈 Mini-graphique 7 jours dans stats parent

## v3.1.0
- 🌙 Mode nuit avec planification automatique (20:30 → 06:30)
- 📱 Layout responsive 600px centré

## v3.0.0 — Initial
- PWA monopage avec timer, bestiaire de 20 monstres, zone parent