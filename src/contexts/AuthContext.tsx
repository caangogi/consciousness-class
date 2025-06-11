
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

type UserRole = 'student' | 'creator' | 'superadmin' | null;

export interface UserProfile extends FirebaseUser {
  role?: UserRole;
  nombre?: string;
  apellido?: string;
  createdAt?: string; 
  updatedAt?: string | null; 
  referralCodeGenerated?: string;
  referredBy?: string | null; 
  cursosInscritos?: string[]; // Array of course IDs
  referidosExitosos?: number;
  balanceCredito?: number;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUserProfile = useCallback(async (user: FirebaseUser | null) => {
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let fetchedRole: UserRole = 'student'; 
      let userProfileData: Partial<UserProfile> = {};

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        fetchedRole = data.role || 'student';
        userProfileData = {
          nombre: data.nombre,
          apellido: data.apellido,
          photoURL: data.photoURL, 
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          referralCodeGenerated: data.referralCodeGenerated,
          referredBy: data.referredBy,
          cursosInscritos: data.cursosInscritos || [], // Ensure cursosInscritos is fetched
          referidosExitosos: data.referidosExitosos,
          balanceCredito: data.balanceCredito,
        };
      }
      
      const combinedUser: UserProfile = {
        ...user, 
        displayName: userProfileData.nombre && userProfileData.apellido ? `${userProfileData.nombre} ${userProfileData.apellido}` : user.displayName,
        photoURL: userProfileData.photoURL !== undefined ? userProfileData.photoURL : user.photoURL, 
        ...userProfileData, 
        role: fetchedRole,
      };
      
      setCurrentUser(combinedUser);
      setUserRole(fetchedRole);
    } else {
      setCurrentUser(null);
      setUserRole(null);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      await fetchAndSetUserProfile(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSetUserProfile]);

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      setLoading(true);
      await fetchAndSetUserProfile(auth.currentUser);
      setLoading(false);
    }
  }, [fetchAndSetUserProfile]);
  
  const value = {
    currentUser,
    userRole,
    loading,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
