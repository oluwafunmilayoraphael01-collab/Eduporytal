
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/superbase";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProfile(authUser) {
      if (!authUser) {
        if (active) setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, school_id, status")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Could not load profile:", error.message);
        setProfile(null);
        return;
      }

      setProfile(data);
    }

    async function initializeAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!active) return;

        const currentUser = data.session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Could not restore session:", error.message);

        if (active) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    // Listen for login, logout, and session changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Avoid querying Supabase directly inside the auth callback.
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setLoading(true);

        Promise.resolve().then(async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("id, full_name, role, school_id, status")
              .eq("id", currentUser.id)
              .maybeSingle();

            if (!active) return;

            if (error) {
              console.error("Could not load profile:", error.message);
              setProfile(null);
            } else {
              setProfile(data);
            }
          } finally {
            if (active) setLoading(false);
          }
        });
      }
    });

    initializeAuth();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    if (!supabase) {
      return {
        error: new Error("Configure Supabase in your .env file."),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    if (data.user) {
      setUser(data.user);

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, school_id, status")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        return { error: profileError };
      }

      setProfile(userProfile);
    }

    return { error: null };
  }

  async function register(email, password, fullName) {
    if (!supabase) {
      return {
        error: new Error("Configure Supabase in your .env file."),
      };
    }

    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
  }

  async function logout() {
    if (!supabase) {
      return {
        error: new Error("Supabase is not configured."),
      };
    }

    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUser(null);
      setProfile(null);
    }

    return { error };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
