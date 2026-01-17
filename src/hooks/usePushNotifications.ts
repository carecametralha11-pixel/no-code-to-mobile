import { useState, useCallback, useEffect, useRef } from 'react';
import { isNativePlatform } from '@/lib/nativeFeatures';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePushNotificationsOptions {
  userId?: string;
  autoRegister?: boolean;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();
  const isRegistered = useRef(false);
  const listenersSetup = useRef(false);
  const pendingUserId = useRef<string | null>(null);

  const saveTokenToDatabase = useCallback(async (pushToken: string, userId: string) => {
    try {
      const platform = (window as any).Capacitor?.getPlatform() || 'web';
      
      console.log('Saving push token to database:', { userId, platform, tokenLength: pushToken.length });
      
      // First, delete any existing token for this user (to avoid conflicts)
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);

      // Then insert the new token
      const { data, error } = await supabase
        .from('push_tokens')
        .insert({
          user_id: userId,
          token: pushToken,
          platform,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving push token:', error);
        // Try upsert as fallback
        const { error: upsertError } = await supabase
          .from('push_tokens')
          .upsert({
            user_id: userId,
            token: pushToken,
            platform,
          }, {
            onConflict: 'user_id,token'
          });
        
        if (upsertError) {
          console.error('Upsert also failed:', upsertError);
          return false;
        }
      }
      
      console.log('Push token saved successfully:', data?.id);
      return true;
    } catch (err) {
      console.error('Error saving push token:', err);
      return false;
    }
  }, []);

  const registerPushNotifications = useCallback(async (userId?: string) => {
    const targetUserId = userId || options.userId;
    
    // Store userId for later use in registration callback
    if (targetUserId) {
      pendingUserId.current = targetUserId;
    }

    // Prevent multiple registrations
    if (isRegistered.current) {
      console.log('Push notifications already registered, checking if token needs to be saved');
      // If we have a token and userId, make sure it's saved
      if (token && targetUserId) {
        await saveTokenToDatabase(token, targetUserId);
      }
      return true;
    }

    if (!isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    // Dynamic import to avoid issues on web
    let PushNotifications: any;
    try {
      const module = await import('@capacitor/push-notifications');
      PushNotifications = module.PushNotifications;
    } catch (err) {
      console.error('Failed to load PushNotifications module:', err);
      return false;
    }

    setLoading(true);

    try {
      // Check current permission status
      const permStatus = await PushNotifications.checkPermissions();
      console.log('Current push permission status:', permStatus);
      
      if (permStatus.receive === 'prompt') {
        // Request permission
        const permission = await PushNotifications.requestPermissions();
        console.log('Push permission request result:', permission);
        
        if (permission.receive !== 'granted') {
          toast({
            title: 'Notificações desativadas',
            description: 'Você não receberá atualizações sobre seu empréstimo',
            variant: 'destructive',
          });
          setLoading(false);
          return false;
        }
      } else if (permStatus.receive !== 'granted') {
        toast({
          title: 'Notificações bloqueadas',
          description: 'Ative as notificações nas configurações do app',
          variant: 'destructive',
        });
        setLoading(false);
        return false;
      }

      setPermissionGranted(true);

      // Setup listeners only once
      if (!listenersSetup.current) {
        listenersSetup.current = true;
        
        await PushNotifications.addListener('registration', async (tokenData: { value: string }) => {
          console.log('Push registration token received:', tokenData.value.substring(0, 20) + '...');
          setToken(tokenData.value);
          
          // Save to database using the pending userId
          const userIdToSave = pendingUserId.current;
          if (userIdToSave) {
            console.log('Saving token for user:', userIdToSave);
            const saved = await saveTokenToDatabase(tokenData.value, userIdToSave);
            if (saved) {
              toast({
                title: 'Notificações ativadas',
                description: 'Você receberá atualizações sobre seu empréstimo',
              });
            }
          } else {
            console.warn('No userId available for saving push token');
          }
        });

        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error:', error);
          toast({
            title: 'Erro nas notificações',
            description: 'Não foi possível registrar notificações',
            variant: 'destructive',
          });
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          console.log('Push notification received:', notification);
          toast({
            title: notification.title || 'Nova notificação',
            description: notification.body || '',
          });
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
          console.log('Push notification action performed:', action);
        });
      }

      // Register with Apple/Google
      console.log('Registering with Apple/Google push service...');
      await PushNotifications.register();
      isRegistered.current = true;

      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error registering push notifications:', err);
      toast({
        title: 'Erro nas notificações',
        description: 'Falha ao configurar notificações push',
        variant: 'destructive',
      });
      setLoading(false);
      return false;
    }
  }, [options.userId, saveTokenToDatabase, toast, token]);

  const removeToken = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);

      setToken(null);
      isRegistered.current = false;
      pendingUserId.current = null;
      console.log('Push token removed');
    } catch (err) {
      console.error('Error removing push token:', err);
    }
  }, []);

  // Auto-register on mount if requested - with proper dependency management
  useEffect(() => {
    if (options.autoRegister && options.userId && isNativePlatform() && !isRegistered.current) {
      console.log('Auto-registering push notifications for user:', options.userId);
      registerPushNotifications(options.userId);
    }
  }, [options.autoRegister, options.userId]);

  return {
    token,
    loading,
    permissionGranted,
    registerPushNotifications,
    removeToken,
    isNative: isNativePlatform(),
  };
}
