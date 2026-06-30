export const APP_VERSION = 4;

export const STORAGE_KEY = 'KidsPatrouille';

export const OLD_STORAGE_KEYS = [
  'MonstresEtMissions',
  'monstresDePoche'
];

export const DEFAULT_TASKS = [
  { id: 1, emoji: "😊", name: "Se lever de bonne humeur", duration: 5, active: true },
  { id: 2, emoji: "🍞", name: "Petit-déjeuner", duration: 20, active: true },
  { id: 3, emoji: "🦷", name: "Brosser les dents", duration: 3, active: true },
  { id: 4, emoji: "👕", name: "S'habiller", duration: 3, active: true },
  { id: 5, emoji: "🍽️", name: "Mettre la table", duration: 5, active: true },
  { id: 6, emoji: "🚿", name: "Prendre sa douche", duration: 10, active: true },
  { id: 7, emoji: "🧸", name: "Ranger ses affaires", duration: 10, active: true },
  { id: 8, emoji: "📚", name: "Temps calme livre", duration: 15, active: true },
  { id: 9, emoji: "🚀", name: "Points Bonus", duration: 1, active: true }
];

export const BESTIARY = [
  { id: 'c1', emoji: '👾', name: 'Pixou', rarity: 'common' },
  { id: 'c2', emoji: '🐛', name: 'Vermichou', rarity: 'common' },
  { id: 'c3', emoji: '🦎', name: 'Lizzou', rarity: 'common' },
  { id: 'c4', emoji: '🐸', name: 'Coâcoâ', rarity: 'common' },
  { id: 'c5', emoji: '🦔', name: 'Picpic', rarity: 'common' },
  { id: 'c6', emoji: '🐭', name: 'Trotti', rarity: 'common' },
  { id: 'c7', emoji: '🐹', name: 'Joufflou', rarity: 'common' },
  { id: 'c8', emoji: '🐰', name: 'Saltou', rarity: 'common' },
  { id: 'c9', emoji: '🐱', name: 'Miaouille', rarity: 'common' },
  { id: 'c10', emoji: '🐶', name: 'Wafou', rarity: 'common' },
  { id: 'c11', emoji: '🦊', name: 'Rouxto', rarity: 'common' },
  { id: 'c12', emoji: '🐻', name: 'Calinours', rarity: 'common' },
  { id: 'c13', emoji: '🐨', name: 'Doumou', rarity: 'common' },
  { id: 'c14', emoji: '🐼', name: 'Bambouille', rarity: 'common' },
  { id: 'c15', emoji: '🦝', name: 'Masqueton', rarity: 'common' },
  { id: 'c16', emoji: '🐿️', name: 'Glandouille', rarity: 'common' },
  { id: 'c17', emoji: '🦇', name: 'Nyctou', rarity: 'common' },
  { id: 'c18', emoji: '🐧', name: 'Plouf', rarity: 'common' },
  { id: 'c19', emoji: '🐢', name: 'Carapou', rarity: 'common' },
  { id: 'c20', emoji: '🐙', name: 'Tentaclou', rarity: 'common' },

  { id: 'r1', emoji: '🦁', name: 'Rugiroi', rarity: 'rare' },
  { id: 'r2', emoji: '🐯', name: 'Stripius', rarity: 'rare' },
  { id: 'r3', emoji: '🦄', name: 'Licornia', rarity: 'rare' },
  { id: 'r4', emoji: '🐲', name: 'Flammito', rarity: 'rare' },
  { id: 'r5', emoji: '🦅', name: 'Aigleon', rarity: 'rare' },
  { id: 'r6', emoji: '🦉', name: 'Saggio', rarity: 'rare' },
  { id: 'r7', emoji: '🦚', name: 'Plumarc', rarity: 'rare' },
  { id: 'r8', emoji: '🐺', name: 'Lunaclaw', rarity: 'rare' },
  { id: 'r9', emoji: '🦌', name: 'Bramor', rarity: 'rare' },
  { id: 'r10', emoji: '🐊', name: 'Marécrok', rarity: 'rare' },

  { id: 'e1', emoji: '🐉', name: 'Dragor Suprême', rarity: 'epic' },
  { id: 'e2', emoji: '🦖', name: 'Rexor Antique', rarity: 'epic' },
  { id: 'e3', emoji: '🦣', name: 'Mammoutar', rarity: 'epic' },
  { id: 'e4', emoji: '🦂', name: 'Scorpinox', rarity: 'epic' },
  { id: 'e5', emoji: '👹', name: 'Onimaster', rarity: 'epic' }
];

export const RARITY_LABEL = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique'
};

export const EMOJI_CHOICES = [
  '🦷', '😊', '👕', '🍞', '🧸', '🛏️', '📚', '✏️',
  '🚿', '🥣', '🦶', '🪥', '🧦', '🎒', '🧹', '🚰',
  '🎨', '⚽', '🎵', '💧', '🍽️', '🚀'
];

export const THEMES = [
  { id: 'classic', name: 'Classique', emoji: '🌟', colors: ['#6c5ce7', '#fdcb6e'] },
  { id: 'adventurer', name: 'Aventurier', emoji: '🍄', colors: ['#e74c3c', '#f1c40f'] },
  { id: 'spark', name: 'Petit Éclair', emoji: '⚡', colors: ['#f1c40f', '#e67e22'] },
  { id: 'nature', name: 'Nature', emoji: '🌿', colors: ['#27ae60', '#8b6f47'] },
  { id: 'robot', name: 'Robot', emoji: '🤖', colors: ['#00d4ff', '#2c3e50'] }
];

export const SOUND_PACKS = [
  { id: 'classic', name: 'Classique', emoji: '🎵' },
  { id: 'bubbles', name: 'Bulles', emoji: '🫧' },
  { id: 'arcade', name: 'Arcade', emoji: '🕹️' }
];