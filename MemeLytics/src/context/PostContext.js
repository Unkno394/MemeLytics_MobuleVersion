import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { postApi } from '../../api/postApi';
import { useAuth } from './AuthContext';

const PostContext = createContext();

// Типы действий
const POST_ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_POST: 'ADD_POST',
  SET_USER_POSTS: 'SET_USER_POSTS',
  UPDATE_POST: 'UPDATE_POST',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Начальное состояние
const initialState = {
  loading: false,
  error: null,
  userPosts: {
    created: [],
    saved: [],
  },
  feedPosts: [],
};

// Редуктор
const postReducer = (state, action) => {
  switch (action.type) {
    case POST_ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case POST_ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case POST_ACTION_TYPES.ADD_POST:
      return {
        ...state,
        userPosts: {
          ...state.userPosts,
          created: [action.payload, ...state.userPosts.created],
        },
        loading: false,
        error: null,
      };
    
    case POST_ACTION_TYPES.SET_USER_POSTS:
      return {
        ...state,
        userPosts: {
          ...state.userPosts,
          [action.payload.type]: action.payload.posts,
        },
        loading: false,
        error: null,
      };
    
    case POST_ACTION_TYPES.UPDATE_POST:
      return {
        ...state,
        userPosts: {
          created: state.userPosts.created.map(post =>
            post.id === action.payload.id ? { ...post, ...action.payload } : post
          ),
          saved: state.userPosts.saved.map(post =>
            post.id === action.payload.id ? { ...post, ...action.payload } : post
          ),
        },
        feedPosts: state.feedPosts.map(post =>
          post.id === action.payload.id ? { ...post, ...action.payload } : post
        ),
      };
    
    case POST_ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

export const PostProvider = ({ children }) => {
  const [state, dispatch] = useReducer(postReducer, initialState);
  const { user } = useAuth();

  // Очистка ошибки
  const clearError = useCallback(() => {
    dispatch({ type: POST_ACTION_TYPES.CLEAR_ERROR });
  }, []);

  // Создание поста
  const createPost = useCallback(async (postData) => {
    try {
      dispatch({ type: POST_ACTION_TYPES.SET_LOADING, payload: true });
      
      const formData = new FormData();
      formData.append('image', {
        uri: postData.imageUri,
        type: 'image/jpeg',
        name: `meme_${Date.now()}.jpg`,
      });
      
      if (postData.title) {
        formData.append('title', postData.title);
      }
      
      if (postData.description) {
        formData.append('description', postData.description);
      }
      
      if (postData.tags && postData.tags.length > 0) {
        formData.append('tags', JSON.stringify(postData.tags));
      }

      const newPost = await postApi.createPost(formData);
      dispatch({ type: POST_ACTION_TYPES.ADD_POST, payload: newPost });
      
      return newPost;
    } catch (error) {
      dispatch({ type: POST_ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Загрузка постов пользователя
  const loadUserPosts = useCallback(async (userId = user?.id, type = 'created') => {
    try {
      dispatch({ type: POST_ACTION_TYPES.SET_LOADING, payload: true });
      
      const response = await postApi.getUserMemes(userId, type);
      dispatch({
        type: POST_ACTION_TYPES.SET_USER_POSTS,
        payload: {
          type,
          posts: response.memes || [],
        },
      });
      
      return response.memes || [];
    } catch (error) {
      dispatch({ type: POST_ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [user?.id]);

  // Обновление поста (лайки и т.д.)
  const updatePost = useCallback((postId, updates) => {
    dispatch({
      type: POST_ACTION_TYPES.UPDATE_POST,
      payload: { id: postId, ...updates },
    });
  }, []);

  const value = {
    // Состояние
    ...state,
    
    // Методы
    createPost,
    loadUserPosts,
    updatePost,
    clearError,
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

// Хук для использования контекста
export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};

export default PostContext;
