import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';
import { UserProfile, OAuthProvider, SendVerificationCodeResponse, VerificationResult } from '@/types';
import { getDeviceInfo } from '@/utils/deviceIdentifier';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  pendingVerification: { email: string; userId: string } | null;
  signIn: (email: string, password: string) => Promise<{ needsVerification: boolean; isOAuth: boolean }>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isDisposableEmail: (email: string) => Promise<boolean>;
  sendVerificationCode: (email: string) => Promise<SendVerificationCodeResponse>;
  verifyEmailCode: (code: string, trustDevice: boolean) => Promise<void>;
  isDeviceTrusted: () => Promise<boolean>;
  getTrustedDevices: () => Promise<any[]>;
  removeTrustedDevice: (deviceId: string) => Promise<void>;
  cancelVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; userId: string } | null>(null);

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Login failed');
    }

    const { data: connections } = await supabase
      .from('oauth_connections')
      .select('provider')
      .eq('user_id', data.user.id);

    const isEmailProvider = connections?.some(conn => conn.provider === 'email');
    const isOAuthProvider = connections?.some(conn => conn.provider === 'google' || conn.provider === 'apple');

    if (isOAuthProvider && !isEmailProvider) {
      console.log('[SignIn] OAuth user, skipping verification');
      return { needsVerification: false, isOAuth: true };
    }

    const deviceTrusted = await checkIfDeviceTrusted(data.user.id);

    if (deviceTrusted) {
      console.log('[SignIn] Device is trusted, updating last used time');
      const deviceInfo = await getDeviceInfo();
      await supabase
        .from('trusted_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', data.user.id)
        .eq('device_identifier', deviceInfo.device_identifier);

      return { needsVerification: false, isOAuth: false };
    }

    console.log('[SignIn] Device not trusted, verification required');
    console.log('[SignIn] Keeping session active for verification process');
    setPendingVerification({ email, userId: data.user.id });
    return { needsVerification: true, isOAuth: false };
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('[SignUp] Starting signup process for username:', username);
    console.log('[SignUp] Email:', email);

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
            avatar_url: null,
            account_tier: 'free',
          });

        if (profileError) {
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
      console.log('[OAuth] Provider:', provider);
      console.log('[OAuth] Email:', user.email);

      const email = user.email || `${user.id}@oauth.temp`;

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('[OAuth] Existing user profile found for this auth user');

        const { data: oauthCheck } = await supabase
          .from('oauth_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .maybeSingle();

        if (!oauthCheck) {
          console.log('[OAuth] Adding OAuth connection to existing profile');
          await supabase.from('oauth_connections').insert({
            user_id: user.id,
            provider: provider,
            provider_user_id: user.user_metadata?.sub || user.id,
            provider_email: email,
          });
        }

        return;
      }

      console.log('[OAuth] No profile found for auth user, creating new user profile');

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
          avatar_url: null,
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

      console.log('[OAuth] New user setup completed successfully');
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

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    return true;
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

  const sendVerificationCode = async (email: string): Promise<SendVerificationCodeResponse> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const { data: tempSession, error: tempAuthError } = await supabase.auth.signInWithPassword({
        email,
        password: 'temp',
      });

      if (tempAuthError) {
        throw new Error('Authentication required to send verification code');
      }
    }

    const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { data: { session: currentSession } } = await supabase.auth.getSession();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-verification-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send verification code');
    }

    return result;
  };

  const verifyEmailCode = async (code: string, trustDevice: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Session required for verification');
    }

    const { data: result, error } = await supabase.rpc('verify_email_code', {
      p_user_id: session.user.id,
      p_code: code,
    });

    if (error || !result?.success) {
      throw new Error(result?.error || 'Invalid verification code');
    }

    if (trustDevice) {
      const deviceInfo = await getDeviceInfo();
      const trustedUntil = new Date();
      trustedUntil.setDate(trustedUntil.getDate() + 30);

      await supabase.from('trusted_devices').insert({
        user_id: session.user.id,
        device_identifier: deviceInfo.device_identifier,
        device_name: deviceInfo.device_name,
        platform: deviceInfo.platform,
        trusted_until: trustedUntil.toISOString(),
      });
    }

    console.log('[VerifyEmail] Verification successful, clearing pending state');
    setPendingVerification(null);
    await loadUserProfile(session.user.id);
  };

  const checkIfDeviceTrusted = async (userId: string): Promise<boolean> => {
    const deviceInfo = await getDeviceInfo();

    const { data } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_identifier', deviceInfo.device_identifier)
      .gt('trusted_until', new Date().toISOString())
      .maybeSingle();

    return !!data;
  };

  const isDeviceTrusted = async (): Promise<boolean> => {
    if (!user) return false;
    return await checkIfDeviceTrusted(user.id);
  };

  const getTrustedDevices = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const removeTrustedDevice = async (deviceId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  const cancelVerification = async () => {
    console.log('[CancelVerification] User cancelled verification process');
    setPendingVerification(null);
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const signOut = async () => {
    try {
      console.log('[SignOut] Starting complete cleanup...');

      console.log('[SignOut] Step 1: Clearing local state');
      setUserProfile(null);
      setUser(null);
      setSession(null);
      setPendingVerification(null);

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
      setPendingVerification(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      pendingVerification,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
      checkUsernameAvailability,
      updateUserProfile,
      refreshUserProfile,
      isDisposableEmail,
      sendVerificationCode,
      verifyEmailCode,
      isDeviceTrusted,
      getTrustedDevices,
      removeTrustedDevice,
      cancelVerification,
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
