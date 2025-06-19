
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

type UserRole = 'student' | 'creator' | 'superadmin' | null;

// Placeholder email for superadmin role during development
const SUPERADMIN_DEV_EMAIL = 'superadmin@example.com'; // Puedes cambiar esto a tu email de prueba

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
  balanceComisionesPendientes?: number;
  balanceIngresosPendientes?: number; // Revenue from own courses pending payout
  bio?: string;
  creatorVideoUrl?: string | null; // Added this line
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
        console.log(`[AuthContext] Raw Firestore data for ${user.uid} during fetchAndSetUserProfile:`, JSON.stringify(data));
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
          referidosExitosos: data.referidosExitosos || 0,
          balanceCredito: data.balanceCredito || 0,
          balanceComisionesPendientes: data.balanceComisionesPendientes === undefined ? 0 : data.balanceComisionesPendientes,
          balanceIngresosPendientes: data.balanceIngresosPendientes === undefined ? 0 : data.balanceIngresosPendientes,
          bio: data.bio, // Added
          creatorVideoUrl: data.creatorVideoUrl, // Added
        };
      } else {
         console.warn(`[AuthContext] User document for ${user.uid} not found in Firestore. Defaulting profile fields.`);
         userProfileData = {
             cursosInscritos: [],
             referidosExitosos: 0,
             balanceCredito: 0,
             balanceComisionesPendientes: 0,
             balanceIngresosPendientes: 0,
             bio: '', // Default for new field
             creatorVideoUrl: null, // Default for new field
         };
      }

      if (user.email === process.env.NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL || user.email === SUPERADMIN_DEV_EMAIL) { // Check both env and fallback
        console.warn(`[AuthContext] DEV MODE: User ${user.email} is being assigned 'superadmin' role.`);
        fetchedRole = 'superadmin';
      }


      const combinedUser: UserProfile = {
        ...(user as UserProfile),
        displayName: userProfileData.nombre && userProfileData.apellido ? `${userProfileData.nombre} ${userProfileData.apellido}` : user.displayName,
        photoURL: userProfileData.photoURL !== undefined ? userProfileData.photoURL : user.photoURL,
        ...userProfileData,
        role: fetchedRole,
      };

      console.log('[AuthContext] fetchAndSetUserProfile - combinedUser to be set:', {
          uid: combinedUser.uid,
          email: combinedUser.email,
          role: combinedUser.role,
          cursosInscritosLength: combinedUser.cursosInscritos?.length,
          referidosExitosos: combinedUser.referidosExitosos,
          balanceComisionesPendientes: combinedUser.balanceComisionesPendientes,
          balanceIngresosPendientes: combinedUser.balanceIngresosPendientes,
          bioExists: !!combinedUser.bio, // Added for logging
          creatorVideoUrlExists: !!combinedUser.creatorVideoUrl, // Added for logging
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
    // setCurrentUser and setUserRole will be handled by onAuthStateChanged
  };

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      console.log(`[AuthContext] refreshUserProfile START for UID: ${auth.currentUser.uid}.`);
      await fetchAndSetUserProfile(auth.currentUser);
      console.log(`[AuthContext] refreshUserProfile END for UID: ${auth.currentUser.uid}. CurrentUser in context should now be updated.`);
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
