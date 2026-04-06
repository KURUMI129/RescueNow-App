import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "./firebase";
import { updateAppPreferences } from "@/constants/app-preferences";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signOutUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Sync Firestore profile → local preferences
        try {
          const userDoc = await getDoc(doc(firestoreDb, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            await updateAppPreferences({
              subscriptionPlan: data.subscriptionPlan === "premium" ? "premium" : "free",
              accountRole: data.role === "technician" ? "technician" : "user",
              language: data.language === "en" ? "en" : "es",
            });
          }

          const medDoc = await getDoc(doc(firestoreDb, "medical-profiles", firebaseUser.uid));
          if (medDoc.exists()) {
            const med = medDoc.data();
            await updateAppPreferences({
              bloodType: med.bloodType ?? "",
              allergies: med.allergies ?? "",
              medicalConditions: med.medicalConditions ?? "",
            });
          }
        } catch (e) {
          // Offline — use local preferences as fallback
          console.warn("Could not sync Firestore profile (likely offline):", e);
        }
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOutUser = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
