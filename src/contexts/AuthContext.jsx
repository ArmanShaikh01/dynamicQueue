import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getPermissionsForRole } from '../utils/permissions';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);


    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const profile = userDoc.data();

                // Auto-sync permissions if missing or outdated
                const expectedPermissions = getPermissionsForRole(profile.role);
                const currentPermissions = profile.permissions || [];

                // Check if permissions need updating
                const needsUpdate = expectedPermissions.length !== currentPermissions.length ||
                    expectedPermissions.some(p => !currentPermissions.includes(p));

                if (needsUpdate) {
                    console.log(`Syncing permissions for user ${uid} with role ${profile.role}`);
                    const updatedProfile = {
                        ...profile,
                        permissions: expectedPermissions,
                        updatedAt: new Date()
                    };

                    // Update Firestore
                    await setDoc(doc(db, 'users', uid), updatedProfile, { merge: true });
                    return updatedProfile;
                }

                return profile;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };


    // Sign up new user
    const signup = async (email, password, userData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get default permissions for role
            const permissions = getPermissionsForRole(userData.role);

            // Create user profile in Firestore
            const profile = {
                uid: user.uid,
                email: user.email,
                name: userData.name,
                phone: userData.phone || '',
                role: userData.role,
                permissions: permissions,
                organizationId: userData.organizationId || null,
                createdAt: new Date(),
                updatedAt: new Date(),
                noShowCount: 0,
                isActive: true
            };

            await setDoc(doc(db, 'users', user.uid), profile);
            setUserProfile(profile);

            return { success: true, user };
        } catch (error) {
            console.error('Signup error:', error);
            // Return full error object for proper error mapping
            return { success: false, error: error };
        }
    };

    // Login user
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const profile = await fetchUserProfile(userCredential.user.uid);
            setUserProfile(profile);
            return { success: true, user: userCredential.user, profile };
        } catch (error) {
            console.error('Login error:', error);
            // Return full error object for proper error mapping
            return { success: false, error: error };
        }
    };

    // Logout user
    const logout = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Return full error object for proper error mapping
            return { success: false, error: error };
        }
    };

    // Check if user has permission
    const hasPermission = (permission) => {
        if (!userProfile || !userProfile.permissions) return false;
        return userProfile.permissions.includes(permission);
    };

    // Check if user has role
    const hasRole = (role) => {
        if (!userProfile) return false;
        return userProfile.role === role;
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const profile = await fetchUserProfile(user.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        logout,
        hasPermission,
        hasRole,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
