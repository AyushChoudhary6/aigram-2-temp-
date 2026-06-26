import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: any | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (user: AppUser) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoaded: false,
  isSignedIn: false,
  signIn: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);
// Provide a mock useUser for drop-in replacement if needed, or update components to useAuth
export const useUser = () => {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // DEVELOPMENT: Bypass auth with mock user
  const mockUser: AppUser = {
    userId: 'dev-user-001',
    name: 'Dev User',
    email: 'dev@aigram.com',
    phoneNumber: '+1234567890',
    role: 'REGISTERED',
    bio: 'Development user for testing',
    createdAt: new Date().toISOString(),
  };

  const [user, setUser] = useState<AppUser | null>(mockUser);
  const [isLoaded, setIsLoaded] = useState(true);

  const signInHandler = (user: AppUser) => {
    setUser(user);
  };

  const signOutHandler = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser: null,
        isLoaded,
        isSignedIn: !!user,
        signIn: signInHandler,
        signOut: signOutHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
