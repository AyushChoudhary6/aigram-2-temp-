import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, AuthTokens } from '../types';

// State Types
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AppState {
  auth: AuthState;
  theme: 'light' | 'dark';
  isOnline: boolean;
}

// Action Types
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' };

type AppAction =
  | AuthAction
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean };

// Initial State
const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  },
  theme: 'light',
  isOnline: true,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: true,
          error: null,
        },
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          user: action.payload,
          isLoading: false,
          error: null,
        },
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: action.payload,
        },
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        },
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        auth: {
          ...state.auth,
          error: null,
        },
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };

    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Auth Actions
  login: (phoneNumber: string, otp: string) => Promise<void>;
  register: (phoneNumber: string, otp: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (username: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  
  // App Actions
  toggleTheme: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Getters
  isGuestUser: () => boolean;
  isRegisteredUser: () => boolean;
  isAdminUser: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize authentication state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  // Network status monitoring (React Native compatible)
  useEffect(() => {
    // For React Native, we'll use a simple online status
    dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
  }, []);

  // Auth Actions
  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      
      // DEVELOPMENT: Bypass auth with mock user
      const mockUser: User = {
        userId: 'dev-user-001',
        name: 'Dev User',
        email: 'dev@aigram.com',
        phoneNumber: '+1234567890',
        role: 'REGISTERED',
        bio: 'Development user for testing',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'AUTH_SUCCESS', payload: mockUser });
      
      // Uncomment below to use real auth instead:
      // const user = await authService.initializeAuth();
      // if (user) {
      //   dispatch({ type: 'AUTH_SUCCESS', payload: user });
      // } else {
      //   dispatch({ type: 'AUTH_LOGOUT' });
      // }
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' });
    }
  };

  const login = async (phoneNumber: string, otp: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await authService.verifyLogin(phoneNumber, otp);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Login failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Login failed' });
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await authService.loginWithEmail(email, password);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Login failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Login failed' });
    }
  };

  const register = async (phoneNumber: string, otp: string, name: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await authService.verifyRegistration(phoneNumber, otp, name);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Registration failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Registration failed' });
    }
  };

  const registerWithEmail = async (username: string, email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await authService.registerWithEmail(username, email, password);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Registration failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Registration failed' });
    }
  };

  const loginAsGuest = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await authService.authenticateAsGuest();
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Guest login failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Guest login failed' });
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      if (state.auth.user?.role === 'GUEST') {
        await authService.guestLogout();
      } else {
        await authService.simpleLogout();
      }
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      console.error('Logout error:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearAuthError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // App Actions
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  const setOnlineStatus = (isOnline: boolean) => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline });
  };

  // Getters
  const isGuestUser = () => state.auth.user?.role === 'GUEST';
  const isRegisteredUser = () => state.auth.user?.role === 'REGISTERED';
  const isAdminUser = () => state.auth.user?.role === 'ADMIN';

  const contextValue: AppContextType = {
    state,
    dispatch,
    login,
    register,
    loginWithEmail,
    registerWithEmail,
    loginAsGuest,
    logout,
    clearAuthError,
    toggleTheme,
    setOnlineStatus,
    isGuestUser,
    isRegisteredUser,
    isAdminUser,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useAuth() {
  const { 
    state, 
    login, 
    register, 
    loginWithEmail, 
    registerWithEmail, 
    loginAsGuest, 
    logout, 
    clearAuthError, 
    isGuestUser, 
    isRegisteredUser, 
    isAdminUser 
  } = useApp();
  
  return {
    ...state.auth,
    isLoaded: !state.auth.isLoading,
    isSignedIn: state.auth.isAuthenticated,
    login,
    loginWithEmail,
    register,
    registerWithEmail,
    loginAsGuest,
    signOut: logout,
    clearAuthError,
    isGuestUser,
    isRegisteredUser,
    isAdminUser,
  };
}

export function useUser() {
  const { state } = useApp();
  return state.auth.user;
}

export function useTheme() {
  const { state, toggleTheme } = useApp();
  return { theme: state.theme, toggleTheme };
}

export function useNetwork() {
  const { state, setOnlineStatus } = useApp();
  return { isOnline: state.isOnline, setOnlineStatus };
}

export default AppContext;
