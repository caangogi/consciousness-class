
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
          cursosInscritos: data.cursosInscritos || [], // Explicitly ensure cursosInscritos is an array
          referidosExitosos: data.referidosExitosos,
          balanceCredito: data.balanceCredito,
        };
        console.log(`[AuthContext] Fetched user profile for ${user.uid}:`, { role: fetchedRole, cursosInscritos: userProfileData.cursosInscritos });
      } else {
         console.warn(`[AuthContext] User document for ${user.uid} not found in Firestore. Defaulting role to student and empty enrollments.`);
      }
      
      const combinedUser: UserProfile = {
        ...user, 
        displayName: userProfileData.nombre && userProfileData.apellido ? `${userProfileData.nombre} ${userProfileData.apellido}` : user.displayName,
        photoURL: userProfileData.photoURL !== undefined ? userProfileData.photoURL : user.photoURL, 
        ...userProfileData, 
        role: fetchedRole,
        cursosInscritos: userProfileData.cursosInscritos || [], // Ensure it's always an array
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
      console.log("[AuthContext] Auth state changed. User:", user ? user.uid : null);
      await fetchAndSetUserProfile(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSetUserProfile]);

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      // User state will be cleared by onAuthStateChanged listener
      console.log("[AuthContext] User signed out.");
    } catch (error) {
      console.error("[AuthContext] Error signing out: ", error);
    } finally {
        // setLoading(false); // No need, onAuthStateChanged will handle loading false
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      console.log("[AuthContext] Refreshing user profile for UID:", auth.currentUser.uid);
      setLoading(true); // Indicate loading during refresh
      await fetchAndSetUserProfile(auth.currentUser);
      setLoading(false);
    } else {
        console.log("[AuthContext] No current user to refresh.");
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
