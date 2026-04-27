import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p._id === action.payload._id ? action.payload : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p._id !== action.payload) };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t._id === action.payload._id ? action.payload : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t._id !== action.payload) };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 20) };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_TASK_VIEW':
      return { ...state, taskView: action.payload };
    default: return state;
  }
};

const initialState = {
  projects: [],
  currentProject: null,
  tasks: [],
  notifications: [],
  theme: localStorage.getItem('cwos_theme') || 'light',
  sidebarOpen: true,
  taskView: 'kanban'
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setProjects = useCallback((projects) => dispatch({ type: 'SET_PROJECTS', payload: projects }), []);
  const addProject = useCallback((project) => dispatch({ type: 'ADD_PROJECT', payload: project }), []);
  const updateProject = useCallback((project) => dispatch({ type: 'UPDATE_PROJECT', payload: project }), []);
  const deleteProject = useCallback((id) => dispatch({ type: 'DELETE_PROJECT', payload: id }), []);
  const setCurrentProject = useCallback((project) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: project }), []);

  const setTasks = useCallback((tasks) => dispatch({ type: 'SET_TASKS', payload: tasks }), []);
  const addTask = useCallback((task) => dispatch({ type: 'ADD_TASK', payload: task }), []);
  const updateTask = useCallback((task) => dispatch({ type: 'UPDATE_TASK', payload: task }), []);
  const deleteTask = useCallback((id) => dispatch({ type: 'DELETE_TASK', payload: id }), []);

  const addNotification = useCallback((notif) => dispatch({ type: 'ADD_NOTIFICATION', payload: notif }), []);
  
  const setTheme = useCallback((theme) => {
    localStorage.setItem('cwos_theme', theme);
    dispatch({ type: 'SET_THEME', payload: theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);
  const setTaskView = useCallback((view) => dispatch({ type: 'SET_TASK_VIEW', payload: view }), []);

  return (
    <AppContext.Provider value={{
      ...state,
      setProjects, addProject, updateProject, deleteProject, setCurrentProject,
      setTasks, addTask, updateTask, deleteTask,
      addNotification,
      setTheme, toggleSidebar, setTaskView
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
