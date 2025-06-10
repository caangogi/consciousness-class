
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

type UserRole = 'student' | 'creator' | 'superadmin' | null;

interface UserProfile extends FirebaseUser {
  role?: UserRole;
  // Add other custom user properties from Firestore if needed
  nombre?: string;
  apellido?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let fetchedRole: UserRole = 'student'; // Default role
        let userProfileData: Partial<UserProfile> = {};

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          fetchedRole = data.role || 'student';
          userProfileData = {
            nombre: data.nombre,
            apellido: data.apellido,
            // map other fields from Firestore doc to UserProfile
          };
        }
        
        setCurrentUser({ ...user, ...userProfileData, role: fetchedRole });
        setUserRole(fetchedRole);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      // onAuthStateChanged will handle setting currentUser to null
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error appropriately, e.g., show a toast
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };
  
  const value = {
    currentUser,
    userRole,
    loading,
    logout,
  };

  // Optional: Show a global loading spinner or skeleton while auth state is resolving initially
  // For simplicity, we'll just render children, but you might want a loading screen
  // if (loading && currentUser === null) { // Or a more sophisticated check
  //   return <div className="flex h-screen items-center justify-center"><p>Loading application...</p></div>;
  // }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
