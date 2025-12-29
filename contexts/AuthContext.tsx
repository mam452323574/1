import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { UserProfile, OAuthProvider } from '@/types';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ needsVerification: boolean; userId: string }>;
  signUp: (email: string, password: string) => Promise<{ userId: string; email: string }>;
  completeSignUp: (userId: string, username: string, avatarUrl?: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isDisposableEmail: (email: string) => Promise<boolean>;
  sendVerificationEmail: (email: string, userId: string, type?: 'signup' | 'login') => Promise<void>;
  verifyEmailCode: (code: string, userId: string, type?: 'signup' | 'login') => Promise<boolean>;
  checkTrustedDevice: (deviceFingerprint: string, userId: string) => Promise<boolean>;
  addTrustedDevice: (deviceFingerprint: string, deviceName: string, userId: string) => Promise<void>;
  cleanupOrphanUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('[AuthProvider] Error loading session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await loadUserProfile(session.user.id);
          } catch (profileError) {
            console.error('[Auth] Error loading profile on state change:', profileError);
          }
        } else {
          setUserProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('[Auth] Error loading user profile:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ needsVerification: boolean; userId: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const userId = data.user.id;

    const { getDeviceFingerprint } = await import('@/services/deviceFingerprint');
    const fingerprint = await getDeviceFingerprint();
    const isTrusted = await checkTrustedDevice(fingerprint, userId);

    if (!isTrusted) {
      return { needsVerification: true, userId };
    }

    return { needsVerification: false, userId };
  };

  const signUp = async (email: string, password: string): Promise<{ userId: string; email: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Erreur lors de la creation du compte');
    }

    return { userId: data.user.id, email: data.user.email! };
  };

  const completeSignUp = async (userId: string, username: string, avatarUrl?: string) => {
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      throw new Error('Ce nom d\'utilisateur est deja pris. Veuillez en choisir un autre.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error('Session invalide');
    }

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: user.email!,
          username,
          avatar_url: avatarUrl || null,
          account_tier: 'free',
          email_verified: false,
        });

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Ce nom d\'utilisateur a ete pris. Veuillez en choisir un autre.');
        }
        throw profileError;
      }

      await supabase.from('oauth_connections').insert({
        user_id: userId,
        provider: 'email',
        provider_user_id: userId,
        provider_email: user.email,
      });

      const today = new Date().toISOString().split('T')[0];
      await supabase.from('health_scores').insert({
        user_id: userId,
        score: 50,
        calories_current: 0,
        calories_goal: 2000,
        bodyfat: 20,
        muscle: 40,
        date: today,
      });

      await loadUserProfile(userId);
    } catch (profileError) {
      console.error('[SignUp] Profile creation failed:', profileError);
      throw profileError;
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? window.location.origin
        : Linking.createURL('oauth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        console.error('[OAuth] Error initiating OAuth:', error);
        throw error;
      }

      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          const parsed = Linking.parse(result.url);
          const params = parsed.queryParams;

          if (params?.access_token && params?.refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token as string,
              refresh_token: params.refresh_token as string,
            });

            if (sessionError) {
              console.error('[OAuth] Error setting session:', sessionError);
              throw sessionError;
            }

            if (sessionData.user) {
              await handleOAuthUserSetup(sessionData.user, provider);
            }
          }
        } else if (result.type === 'cancel') {
          throw new Error('Authentication cancelled');
        }
      }
    } catch (error) {
      console.error('[OAuth] Error in OAuth flow:', error);
      throw error;
    }
  };

  const handleOAuthUserSetup = async (user: User, provider: 'google' | 'apple') => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        return;
      }

      const email = user.email || `${user.id}@oauth.temp`;
      const isDisposable = await checkDisposableEmail(email);

      if (isDisposable) {
        throw new Error('Disposable email addresses are not allowed');
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: email,
          username: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          account_tier: 'free',
        });

      if (profileError) {
        console.error('[OAuth] Error creating profile:', profileError);
        throw profileError;
      }

      const { error: oauthError } = await supabase
        .from('oauth_connections')
        .insert({
          user_id: user.id,
          provider: provider,
          provider_user_id: user.user_metadata?.sub || user.id,
          provider_email: email,
        });

      if (oauthError && !oauthError.message.includes('duplicate')) {
        console.error('[OAuth] Error creating OAuth connection:', oauthError);
      }

      const today = new Date().toISOString().split('T')[0];
      await supabase.from('health_scores').insert({
        user_id: user.id,
        score: 50,
        calories_current: 0,
        calories_goal: 2000,
        bodyfat: 20,
        muscle: 40,
        date: today,
      });
    } catch (error) {
      console.error('[OAuth] Error in user setup:', error);
      throw error;
    }
  };

  const checkDisposableEmail = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const { data } = await supabase
      .from('disposable_email_domains')
      .select('domain')
      .eq('domain', domain)
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const checkUsernameAvailability = async (username: string, retryCount = 0): Promise<boolean> => {
    if (!username || username.length < 3) return false;

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    const queryTimeout = 8000;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout exceeded')), queryTimeout);
      });

      const queryPromise = supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        throw error;
      }
      return !data;
    } catch (error) {
      if (retryCount < maxRetries && error instanceof Error &&
          (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('Query timeout'))) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return checkUsernameAvailability(username, retryCount + 1);
      }
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('[ProfileUpdate] Error checking profile existence:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error('[ProfileUpdate] UPDATE failed:', updateError);
          throw updateError;
        }
      } else {
        const profileData = {
          id: user.id,
          email: user.email || `${user.id}@oauth.temp`,
          account_tier: 'free',
          ...updates,
        };

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (insertError) {
          console.error('[ProfileUpdate] INSERT failed:', insertError);
          throw insertError;
        }
      }

      await loadUserProfile(user.id);
    } catch (error) {
      console.error('[ProfileUpdate] Critical error in updateUserProfile:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) throw new Error('User not authenticated');
    await loadUserProfile(user.id);
  };

  const isDisposableEmail = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const { data } = await supabase
      .from('disposable_email_domains')
      .select('domain')
      .eq('domain', domain)
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const sendVerificationEmail = async (email: string, userId: string, type: 'signup' | 'login' = 'signup'): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-verification-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, userId, type }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Echec de l\'envoi du code de verification');
      }
    } catch (error) {
      console.error('[Verification] Error sending email:', error);
      throw error;
    }
  };

  const verifyEmailCode = async (code: string, userId: string, type: 'signup' | 'login' = 'signup'): Promise<boolean> => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-email-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, userId, type }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('[Verification] Error:', data.error);
        throw new Error(data.error || 'Code incorrect');
      }

      return data.verified === true;
    } catch (error) {
      console.error('[Verification] Error verifying code:', error);
      throw error;
    }
  };

  const checkTrustedDevice = async (deviceFingerprint: string, userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .maybeSingle();

      if (error) {
        console.error('[TrustedDevice] Error checking device:', error);
        return false;
      }

      const isTrusted = !!data;

      if (isTrusted) {
        await supabase
          .from('trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', data.id);
      }

      return isTrusted;
    } catch (error) {
      console.error('[TrustedDevice] Error checking device:', error);
      return false;
    }
  };

  const addTrustedDevice = async (deviceFingerprint: string, deviceName: string, userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_fingerprint',
        });

      if (error) {
        console.error('[TrustedDevice] Error adding device:', error);
        throw error;
      }
    } catch (error) {
      console.error('[TrustedDevice] Error adding device:', error);
      throw error;
    }
  };

  const cleanupOrphanUser = async (userId: string): Promise<void> => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-orphan-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error('[Cleanup] Error:', data.error);
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  };

  const signOut = async () => {
    try {
      setUserProfile(null);
      setUser(null);
      setSession(null);

      try {
        await AsyncStorage.multiRemove([
          'supabase.auth.token',
          '@supabase.auth.token',
        ]);
      } catch (storageError) {
        console.error('[SignOut] AsyncStorage cleanup error:', storageError);
      }

      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('[SignOut] Supabase sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SignOut] Error during sign out:', error);
      setUserProfile(null);
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      signIn,
      signUp,
      completeSignUp,
      signInWithOAuth,
      signOut,
      checkUsernameAvailability,
      updateUserProfile,
      refreshUserProfile,
      isDisposableEmail,
      sendVerificationEmail,
      verifyEmailCode,
      checkTrustedDevice,
      addTrustedDevice,
      cleanupOrphanUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
