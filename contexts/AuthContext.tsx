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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, avatarUrl?: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isDisposableEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Initializing authentication...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthProvider] Session loaded:', session ? 'with user' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('[AuthProvider] Loading user profile for:', session.user.id);
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
      console.log('[AuthProvider] Initialization complete');
    }).catch((error) => {
      console.error('[AuthProvider] Error loading session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      (async () => {
        console.log('[Auth] Auth state changed:', event, session ? 'with session' : 'no session');

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
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
      console.error('Error loading user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string, avatarUrl?: string) => {
    console.log('[SignUp] Starting signup process for username:', username);

    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      throw new Error('Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            username,
            avatar_url: avatarUrl || null,
            account_tier: 'free',
          });

        if (profileError) {
          if (profileError.code === '23505') {
            await supabase.auth.admin.deleteUser(data.user.id);
            throw new Error('Ce nom d\'utilisateur a été pris pendant la création du compte. Veuillez réessayer.');
          }
          throw profileError;
        }

        await supabase.from('oauth_connections').insert({
          user_id: data.user.id,
          provider: 'email',
          provider_user_id: data.user.id,
          provider_email: email,
        });

        const today = new Date().toISOString().split('T')[0];
        await supabase.from('health_scores').insert({
          user_id: data.user.id,
          score: 50,
          calories_current: 0,
          calories_goal: 2000,
          bodyfat: 20,
          muscle: 40,
          date: today,
        });

        console.log('[SignUp] Signup completed successfully');
      } catch (profileError) {
        console.error('[SignUp] Profile creation failed, cleaning up auth user:', profileError);
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('[SignUp] Cleanup error:', cleanupError);
        }
        throw profileError;
      }
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      console.log('[OAuth] Starting OAuth flow for provider:', provider);

      const redirectUrl = Platform.OS === 'web'
        ? window.location.origin
        : Linking.createURL('oauth/callback');

      console.log('[OAuth] Redirect URL:', redirectUrl);

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
        console.log('[OAuth] Opening browser for authentication...');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('[OAuth] Browser result:', result.type);

        if (result.type === 'success' && result.url) {
          console.log('[OAuth] Success! Processing callback URL...');
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

            console.log('[OAuth] Session established successfully');

            if (sessionData.user) {
              await handleOAuthUserSetup(sessionData.user, provider);
            }
          }
        } else if (result.type === 'cancel') {
          console.log('[OAuth] User cancelled authentication');
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
      console.log('[OAuth] Setting up OAuth user:', user.id);

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('[OAuth] Existing user profile found');
        return;
      }

      console.log('[OAuth] Creating new user profile for OAuth user');

      const email = user.email || `${user.id}@oauth.temp`;
      const isDisposable = await checkDisposableEmail(email);

      if (isDisposable) {
        console.error('[OAuth] Disposable email detected');
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

      console.log('[OAuth] User setup completed successfully');
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
        console.log(`[Username Check] Error, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return checkUsernameAvailability(username, retryCount + 1);
      }
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[ProfileUpdate] Starting profile update for user:', user.id);
    console.log('[ProfileUpdate] Updates:', JSON.stringify(updates));

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
        console.log('[ProfileUpdate] Profile exists, performing UPDATE');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error('[ProfileUpdate] UPDATE failed:', updateError);
          throw updateError;
        }
        console.log('[ProfileUpdate] UPDATE successful');
      } else {
        console.log('[ProfileUpdate] Profile does not exist, performing INSERT');
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
        console.log('[ProfileUpdate] INSERT successful');
      }

      await loadUserProfile(user.id);
      console.log('[ProfileUpdate] Profile reloaded successfully');
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

  const signOut = async () => {
    try {
      console.log('[SignOut] Starting complete cleanup...');

      console.log('[SignOut] Step 1: Clearing local state');
      setUserProfile(null);
      setUser(null);
      setSession(null);

      console.log('[SignOut] Step 2: Clearing AsyncStorage');
      try {
        await AsyncStorage.multiRemove([
          'supabase.auth.token',
          '@supabase.auth.token',
        ]);
      } catch (storageError) {
        console.error('[SignOut] AsyncStorage cleanup error:', storageError);
      }

      console.log('[SignOut] Step 3: Signing out from Supabase');
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('[SignOut] Supabase sign out error:', error);
        throw error;
      }

      console.log('[SignOut] Complete cleanup finished successfully');
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
      signInWithOAuth,
      signOut,
      checkUsernameAvailability,
      updateUserProfile,
      refreshUserProfile,
      isDisposableEmail,
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
