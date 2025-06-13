
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
          cursosInscritos: data.cursosInscritos || [],
          referidosExitosos: data.referidosExitosos,
          balanceCredito: data.balanceCredito,
        };
        // console.log(`[AuthContext] Fetched user profile for ${user.uid}:`, { role: fetchedRole, cursosInscritos: userProfileData.cursosInscritos });
      } else {
         console.warn(`[AuthContext] User document for ${user.uid} not found in Firestore. Defaulting role to student and empty enrollments.`);
      }
      
      const combinedUser: UserProfile = {
        ...user, 
        displayName: userProfileData.nombre && userProfileData.apellido ? `${userProfileData.nombre} ${userProfileData.apellido}` : user.displayName,
        photoURL: userProfileData.photoURL !== undefined ? userProfileData.photoURL : user.photoURL, 
        ...userProfileData, 
        role: fetchedRole,
        cursosInscritos: userProfileData.cursosInscritos || [], 
      };
      
      console.log('[AuthContext] fetchAndSetUserProfile - combinedUser to be set:', { 
          uid: combinedUser.uid, 
          email: combinedUser.email, 
          role: combinedUser.role, 
          cursosInscritos: combinedUser.cursosInscritos 
      });
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
      console.log("[AuthContext] User signed out.");
    } catch (error) {
      console.error("[AuthContext] Error signing out: ", error);
    }
    // No necesitas setCurrentUser(null) aquí; onAuthStateChanged lo manejará.
    // setLoading(false) también se maneja por onAuthStateChanged.
  };

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      console.log(`[AuthContext] refreshUserProfile START for UID: ${auth.currentUser.uid}. Current cursosInscritos in context (before fetch):`, JSON.stringify(currentUser?.cursosInscritos));
      await fetchAndSetUserProfile(auth.currentUser);
      console.log(`[AuthContext] refreshUserProfile END for UID: ${auth.currentUser.uid}. Current cursosInscritos in context (after fetch):`, JSON.stringify(currentUser?.cursosInscritos));
    } else {
        console.log("[AuthContext] No current user to refresh.");
    }
  }, [fetchAndSetUserProfile, currentUser]); 
  
  const value = {
    currentUser,
    userRole,
    loading,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
