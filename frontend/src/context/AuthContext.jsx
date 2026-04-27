import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isAuthenticated: false, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default: return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem('cwos_token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('cwos_token');
    if (token) {
      authAPI.getMe()
        .then(res => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: res.data.user, token } });
          initSocket(token);
        })
        .catch(() => {
          localStorage.removeItem('cwos_token');
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const res = await authAPI.login(credentials);
    const { token, user } = res.data;
    localStorage.setItem('cwos_token', token);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    initSocket(token);
    return user;
  }, []);

  const signup = useCallback(async (data) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const res = await authAPI.signup(data);
    const { token, user } = res.data;
    localStorage.setItem('cwos_token', token);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    initSocket(token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('cwos_token');
    disconnectSocket();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
