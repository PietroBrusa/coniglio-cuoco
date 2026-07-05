import type { Food } from '../types';

/**
 * Curated catalogue of foods available for selection at setup.
 *
 * Each item renders with its system `emoji`, so the list works everywhere with
 * no external assets or network. The first five ids (carota, mela, broccolo,
 * pomodoro, banana) are preserved from the original list so previously saved
 * sessions still resolve.
 */
export const FOODS: Food[] = [
  // Frutta
  { id: 'mela', label: 'Mela', emoji: '🍎' },
  { id: 'mela-verde', label: 'Mela verde', emoji: '🍏' },
  { id: 'pera', label: 'Pera', emoji: '🍐' },
  { id: 'banana', label: 'Banana', emoji: '🍌' },
  { id: 'arancia', label: 'Arancia', emoji: '🍊' },
  { id: 'limone', label: 'Limone', emoji: '🍋' },
  { id: 'uva', label: 'Uva', emoji: '🍇' },
  { id: 'fragola', label: 'Fragola', emoji: '🍓' },
  { id: 'mirtilli', label: 'Mirtilli', emoji: '🫐' },
  { id: 'ciliegie', label: 'Ciliegie', emoji: '🍒' },
  { id: 'pesca', label: 'Pesca', emoji: '🍑' },
  { id: 'mango', label: 'Mango', emoji: '🥭' },
  { id: 'ananas', label: 'Ananas', emoji: '🍍' },
  { id: 'cocco', label: 'Cocco', emoji: '🥥' },
  { id: 'kiwi', label: 'Kiwi', emoji: '🥝' },
  { id: 'anguria', label: 'Anguria', emoji: '🍉' },
  { id: 'melone', label: 'Melone', emoji: '🍈' },
  { id: 'pomodoro', label: 'Pomodoro', emoji: '🍅' },
  { id: 'oliva', label: 'Oliva', emoji: '🫒' },
  { id: 'avocado', label: 'Avocado', emoji: '🥑' },

  // Verdura
  { id: 'carota', label: 'Carota', emoji: '🥕' },
  { id: 'broccolo', label: 'Broccolo', emoji: '🥦' },
  { id: 'mais', label: 'Mais', emoji: '🌽' },
  { id: 'peperoncino', label: 'Peperoncino', emoji: '🌶️' },
  { id: 'peperone', label: 'Peperone', emoji: '🫑' },
  { id: 'cetriolo', label: 'Cetriolo', emoji: '🥒' },
  { id: 'lattuga', label: 'Lattuga', emoji: '🥬' },
  { id: 'melanzana', label: 'Melanzana', emoji: '🍆' },
  { id: 'patata', label: 'Patata', emoji: '🥔' },
  { id: 'patata-dolce', label: 'Patata dolce', emoji: '🍠' },
  { id: 'aglio', label: 'Aglio', emoji: '🧄' },
  { id: 'cipolla', label: 'Cipolla', emoji: '🧅' },
  { id: 'fungo', label: 'Fungo', emoji: '🍄' },
  { id: 'arachidi', label: 'Arachidi', emoji: '🥜' },
  { id: 'castagna', label: 'Castagna', emoji: '🌰' },
  { id: 'fagioli', label: 'Fagioli', emoji: '🫘' },
  { id: 'piselli', label: 'Piselli', emoji: '🫛' },
  { id: 'zenzero', label: 'Zenzero', emoji: '🫚' },

  // Pane, cereali e derivati
  { id: 'pane', label: 'Pane', emoji: '🍞' },
  { id: 'baguette', label: 'Baguette', emoji: '🥖' },
  { id: 'pretzel', label: 'Pretzel', emoji: '🥨' },
  { id: 'bagel', label: 'Bagel', emoji: '🥯' },
  { id: 'pancake', label: 'Pancake', emoji: '🥞' },
  { id: 'waffle', label: 'Waffle', emoji: '🧇' },
  { id: 'formaggio', label: 'Formaggio', emoji: '🧀' },
  { id: 'burro', label: 'Burro', emoji: '🧈' },
  { id: 'riso', label: 'Riso', emoji: '🍚' },
  { id: 'onigiri', label: 'Onigiri', emoji: '🍙' },
  { id: 'riso-curry', label: 'Riso al curry', emoji: '🍛' },
  { id: 'ramen', label: 'Ramen', emoji: '🍜' },
  { id: 'spaghetti', label: 'Spaghetti', emoji: '🍝' },
  { id: 'popcorn', label: 'Popcorn', emoji: '🍿' },

  // Piatti pronti
  { id: 'uovo', label: 'Uovo', emoji: '🍳' },
  { id: 'carne', label: 'Carne', emoji: '🍖' },
  { id: 'pollo', label: 'Pollo', emoji: '🍗' },
  { id: 'bacon', label: 'Bacon', emoji: '🥓' },
  { id: 'hamburger', label: 'Hamburger', emoji: '🍔' },
  { id: 'patatine-fritte', label: 'Patatine fritte', emoji: '🍟' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'hotdog', label: 'Hot dog', emoji: '🌭' },
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪' },
  { id: 'taco', label: 'Taco', emoji: '🌮' },
  { id: 'burrito', label: 'Burrito', emoji: '🌯' },
  { id: 'piadina', label: 'Piadina', emoji: '🫓' },
  { id: 'falafel', label: 'Falafel', emoji: '🧆' },
  { id: 'padella', label: 'Padella', emoji: '🥘' },
  { id: 'zuppa', label: 'Zuppa', emoji: '🍲' },
  { id: 'fonduta', label: 'Fonduta', emoji: '🫕' },
  { id: 'insalata', label: 'Insalata', emoji: '🥗' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'gambero-fritto', label: 'Gambero fritto', emoji: '🍤' },
  { id: 'raviolo', label: 'Raviolo', emoji: '🥟' },
  { id: 'spiedino', label: 'Spiedino', emoji: '🍢' },

  // Pesce e frutti di mare
  { id: 'granchio', label: 'Granchio', emoji: '🦀' },
  { id: 'gambero', label: 'Gambero', emoji: '🦐' },
  { id: 'calamaro', label: 'Calamaro', emoji: '🦑' },

  // Dolci
  { id: 'gelato-cono', label: 'Cono gelato', emoji: '🍦' },
  { id: 'gelato', label: 'Gelato', emoji: '🍨' },
  { id: 'ghiacciolo', label: 'Ghiacciolo', emoji: '🍧' },
  { id: 'ciambella', label: 'Ciambella', emoji: '🍩' },
  { id: 'biscotto', label: 'Biscotto', emoji: '🍪' },
  { id: 'torta', label: 'Torta', emoji: '🍰' },
  { id: 'torta-compleanno', label: 'Torta di compleanno', emoji: '🎂' },
  { id: 'cupcake', label: 'Cupcake', emoji: '🧁' },
  { id: 'crostata', label: 'Crostata', emoji: '🥧' },
  { id: 'cioccolato', label: 'Cioccolato', emoji: '🍫' },
  { id: 'caramella', label: 'Caramella', emoji: '🍬' },
  { id: 'lecca-lecca', label: 'Lecca-lecca', emoji: '🍭' },
  { id: 'budino', label: 'Budino', emoji: '🍮' },
  { id: 'miele', label: 'Miele', emoji: '🍯' },

  // Bevande
  { id: 'latte', label: 'Latte', emoji: '🥛' },
  { id: 'caffe', label: 'Caffè', emoji: '☕' },
  { id: 'te', label: 'Tè', emoji: '🍵' },
  { id: 'succo', label: 'Succo', emoji: '🧃' },
  { id: 'bibita', label: 'Bibita', emoji: '🥤' },
  { id: 'frullato', label: 'Frullato', emoji: '🧋' },
];
