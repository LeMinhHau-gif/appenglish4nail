import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminService } from '../services/adminService';
import { AdminUser, Permission, ROLE_DEFINITIONS, RoleDefinition, UserRole } from '../types/rbac';
import { auth, signInWithGooglePopup, signOutFromFirebase, onAuthStateChanged } from '../services/firebase';
import { FirestoreSyncService } from '../services/firestoreSync';

interface AuthContextType {
  currentUser: AdminUser | null;
  currentRole: UserRole;
  roleDefinition: RoleDefinition;
  permissions: Permission[];
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (perm: Permission) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  login: (email?: string, password?: string, role?: UserRole) => Promise<void>;
  loginWithGooglePopup: () => Promise<void>;
  loginWithGoogle: (googleData: { email: string; name?: string; avatarUrl?: string; googleId?: string }) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCurrentUser: (user: AdminUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => AdminService.getSavedUser());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => currentUser?.role || 'learner');
  const [permissions, setPermissions] = useState<Permission[]>(
    () => ROLE_DEFINITIONS[currentRole]?.permissions || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const roleDefinition = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.learner;
  const isAdmin = currentUser !== null && currentRole !== 'learner';

  const refreshProfile = async () => {
    const token = AdminService.getToken();
    if (!token) {
      return;
    }
    try {
      setIsLoading(true);
      const res = await AdminService.getMe();
      if (res.user) {
        const role = res.user.role as UserRole;
        setCurrentUser(res.user);
        setCurrentRole(role);
        setPermissions(res.permissions || ROLE_DEFINITIONS[role]?.permissions || []);
      }
    } catch (e) {
      console.warn('Could not refresh profile from server, using local fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const syncedUser = await FirestoreSyncService.syncUserProfile({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Học Viên Nail',
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || '',
          });

          // Also notify backend for token
          const res = await AdminService.loginWithGoogle({
            email: fbUser.email || '',
            name: fbUser.displayName || '',
            avatarUrl: fbUser.photoURL || '',
            googleId: fbUser.uid,
          });

          const finalUser: AdminUser = {
            ...res.user,
            ...syncedUser,
            role: syncedUser.role || res.user.role,
          };

          const userRole = finalUser.role as UserRole;
          setCurrentUser(finalUser);
          AdminService.setSavedUser(finalUser);
          setCurrentRole(userRole);
          setPermissions(ROLE_DEFINITIONS[userRole]?.permissions || []);
        } catch (e) {
          console.warn('Firebase auth state sync error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    refreshProfile();
  }, []);

  /**
   * Real Google Sign-In with Firebase Popup + Firestore Sync
   */
  const loginWithGooglePopup = async () => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGooglePopup();
      if (fbUser.email) {
        // Sync with Firestore
        const syncedUser = await FirestoreSyncService.syncUserProfile({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          avatarUrl: fbUser.photoURL || '',
        });

        // Sync with backend API
        const res = await AdminService.loginWithGoogle({
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          avatarUrl: fbUser.photoURL || '',
          googleId: fbUser.uid,
        });

        const merged: AdminUser = {
          ...res.user,
          ...syncedUser,
          role: syncedUser.role || res.user.role,
        };

        const role = merged.role as UserRole;
        setCurrentUser(merged);
        AdminService.setSavedUser(merged);
        setCurrentRole(role);
        setPermissions(ROLE_DEFINITIONS[role]?.permissions || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Custom / Fallback Google Sign-In with Firestore and Backend Sync
   */
  const loginWithGoogle = async (googleData: {
    email: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await AdminService.loginWithGoogle(googleData);

      // Sync to Firestore
      let syncedUser = res.user;
      try {
        syncedUser = await FirestoreSyncService.syncUserProfile({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          avatarUrl: res.user.avatarUrl,
        });
      } catch (firestoreErr) {
        console.warn('Firestore user sync warning:', firestoreErr);
      }

      const merged: AdminUser = {
        ...res.user,
        ...syncedUser,
      };

      const userRole = merged.role as UserRole;
      setCurrentUser(merged);
      AdminService.setSavedUser(merged);
      setCurrentRole(userRole);
      setPermissions(res.permissions || ROLE_DEFINITIONS[userRole]?.permissions || []);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email?: string, password?: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const res = await AdminService.login(email, password, role);
      const userRole = res.user.role as UserRole;
      setCurrentUser(res.user);
      AdminService.setSavedUser(res.user);
      setCurrentRole(userRole);
      setPermissions(res.permissions || ROLE_DEFINITIONS[userRole]?.permissions || []);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await AdminService.switchDemoRole(targetRole);
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      setPermissions(res.permissions || ROLE_DEFINITIONS[targetRole]?.permissions || []);
    } catch (e: any) {
      console.error('Failed to switch demo role:', e);
      setCurrentRole(targetRole);
      setPermissions(ROLE_DEFINITIONS[targetRole]?.permissions || []);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutFromFirebase();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    AdminService.setSavedUser(null);
    AdminService.setToken('');
    setCurrentUser(null);
    setCurrentRole('learner');
    setPermissions(ROLE_DEFINITIONS.learner.permissions);
  };

  const hasPermission = (perm: Permission): boolean => {
    return permissions.includes(perm);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (Array.isArray(roles)) {
      return roles.includes(currentRole);
    }
    return currentRole === roles;
  };

  const updateCurrentUser = (user: AdminUser) => {
    setCurrentUser(user);
    AdminService.setSavedUser(user);
    // Also update in Firestore in background
    FirestoreSyncService.syncUserProfile(user).catch((e) =>
      console.warn('Background Firestore user update warning:', e)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        roleDefinition,
        permissions,
        isAdmin,
        isLoading,
        hasPermission,
        hasRole,
        switchRole,
        login,
        loginWithGooglePopup,
        loginWithGoogle,
        logout,
        refreshProfile,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
