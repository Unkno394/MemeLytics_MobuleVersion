// constants/modalConfigs.js
export const modalConfigs = {
  // Для собственных постов пользователя
  ownPost: (theme, handlers = {}) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: handlers.onDownload || (() => console.log('Download own post')),
      },
      {
        id: 'edit',
        label: 'Редактировать',
        icon: 'edit',
        onPress: handlers.onEdit || (() => console.log('Edit post')),
      },
      {
        id: 'delete',
        label: 'Удалить',
        icon: 'trash-2',
        danger: true,
        onPress: handlers.onDelete || (() => console.log('Delete post')),
      },
    ],
    theme: theme,
  }),

  // Для чужих постов (только просмотр)
  otherPost: (theme, handlers = {}) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: handlers.onDownload || (() => console.log('Download other post')),
      },
      {
        id: 'hide',
        label: 'Скрыть',
        icon: 'eye-off',
        onPress: handlers.onHide || (() => console.log('Hide post')),
      },
      {
        id: 'report',
        label: 'Пожаловаться',
        icon: 'flag',
        danger: true,
        onPress: handlers.onReport || (() => console.log('Report post')),
      },
    ],
    theme: theme,
  }),

  // Для сохраненных постов
  savedPost: (theme, handlers = {}) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: handlers.onDownload || (() => console.log('Download saved post')),
      },
      {
        id: 'unsave',
        label: 'Удалить из сохраненных',
        icon: 'bookmark',
        onPress: handlers.onUnsave || (() => console.log('Unsave post')),
      },
      {
        id: 'report',
        label: 'Пожаловаться',
        icon: 'flag',
        danger: true,
        onPress: handlers.onReport || (() => console.log('Report saved post')),
      },
    ],
    theme: theme,
  }),

  // Для постов в ленте (index.js)
  feedPost: (theme, handlers = {}) => ({
    items: [
      {
        id: 'download',
        label: 'Скачать изображение',
        icon: 'download',
        onPress: handlers.onDownload || (() => console.log('Download feed post')),
      },
      {
        id: 'hide',
        label: 'Скрыть',
        icon: 'eye-off',
        onPress: handlers.onHide || (() => console.log('Hide feed post')),
      },
      {
        id: 'report',
        label: 'Пожаловаться',
        icon: 'flag',
        danger: true,
        onPress: handlers.onReport || (() => console.log('Report feed post')),
      },
    ],
    theme: theme,
  }),
};