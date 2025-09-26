import { useFonts } from 'expo-font';

// Экспорт объекта со всеми шрифтами
export const fontAssets = {
  'RussoOne': require('./RussoOne-Regular.ttf'),
  'Lobster': require('./Lobster-Regular.ttf'),
  'Merriweather': require('./Merriweather-VariableFont_opsz,wdth,wght.ttf'),
  'Roboto': require('./Roboto-VariableFont_wdth,wght.ttf'),
  'RubikBubbles': require('./RubikBubbles-Regular.ttf'),
  'RubikPixels': require('./RubikPixels-Regular.ttf'),
  'RubikWetPaint': require('./RubikWetPaint-Regular.ttf'),
  'Underdog': require('./Underdog-Regular.ttf'),
};

// Хук для загрузки шрифтов
export const useAppFonts = () => {
  return useFonts(fontAssets);
};

// Список доступных шрифтов для интерфейса
export const fontList = [
  { name: "Roboto", displayName: "Roboto" },
  { name: "Merriweather", displayName: "Merriweather" },
  { name: "RussoOne", displayName: "Russo One" },
  { name: "Lobster", displayName: "Lobster" },
  { name: "RubikBubbles", displayName: "Rubik Bubbles" },
  { name: "RubikPixels", displayName: "Rubik Pixels" },
  { name: "RubikWetPaint", displayName: "Rubik Wet Paint" },
  { name: "Underdog", displayName: "Underdog" },
];