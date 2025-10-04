// constants/modalConfigs.js
export const modalConfigs = {
  // Для собственных постов пользователя
  ownPost: (theme) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: () => console.log('Download own post'),
      },
      {
        id: 'edit',
        label: 'Редактировать',
        icon: 'edit',
        onPress: () => console.log('Edit post'),
      },
      {
        id: 'delete',
        label: 'Удалить',
        icon: 'trash-2',
        danger: true,
        onPress: () => console.log('Delete post'),
      },
    ],
    theme: theme,
  }),

  // Для чужих постов (только просмотр)
  otherPost: (theme) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: () => console.log('Download other post'),
      },
      {
        id: 'hide',
        label: 'Скрыть',
        icon: 'eye-off',
        onPress: () => console.log('Hide post'),
      },
      {
        id: 'report',
        label: 'Пожаловаться',
        icon: 'flag',
        danger: true,
        onPress: () => console.log('Report post'),
      },
    ],
    theme: theme,
  }),

  // Для сохраненных постов
  savedPost: (theme) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: () => console.log('Download saved post'),
      },
      {
        id: 'unsave',
        label: 'Удалить из сохраненных',
        icon: 'bookmark',
        onPress: () => console.log('Unsave post'),
      },
      {
        id: 'report',
        label: 'Пожаловаться',
        icon: 'flag',
        danger: true,
        onPress: () => console.log('Report saved post'),
      },
    ],
    theme: theme,
  }),

  // Для постов в ленте (index.js)
  feedPost: (theme) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: () => console.log('Download feed post'),
      },
      {
        id: 'hide',
        label: 'Скрыть',
        icon: 'eye-off',
        onPress: () => console.log('Hide feed post'),
      },
      {
        id: 'report',
        label: 'Пожаловаться',
        icon: 'flag',
        danger: true,
        onPress: () => console.log('Report feed post'),
      },
    ],
    theme: theme,
  }),
};