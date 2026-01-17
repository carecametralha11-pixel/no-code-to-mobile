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

  const saveTokenToDatabase = useCallback(async (pushToken: string, userId: string) => {
    try {
      const platform = (window as any).Capacitor?.getPlatform() || 'web';
      
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token: pushToken,
          platform,
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving push token:', error);
        return false;
      }
      
      console.log('Push token saved successfully');
      return true;
    } catch (err) {
      console.error('Error saving push token:', err);
      return false;
    }
  }, []);

  const registerPushNotifications = useCallback(async (userId?: string) => {
    // Prevent multiple registrations
    if (isRegistered.current) {
      console.log('Push notifications already registered');
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
      
      if (permStatus.receive === 'prompt') {
        // Request permission
        const permission = await PushNotifications.requestPermissions();
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
          console.log('Push registration token:', tokenData.value);
          setToken(tokenData.value);
          
          // Save to database if userId provided
          const targetUserId = userId || options.userId;
          if (targetUserId) {
            await saveTokenToDatabase(tokenData.value, targetUserId);
          }

          toast({
            title: 'Notificações ativadas',
            description: 'Você receberá atualizações sobre seu empréstimo',
          });
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
  }, [options.userId, saveTokenToDatabase, toast]);

  const removeToken = useCallback(async (userId: string) => {
    if (!token) return;

    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      setToken(null);
      isRegistered.current = false;
      console.log('Push token removed');
    } catch (err) {
      console.error('Error removing push token:', err);
    }
  }, [token]);

  // Auto-register on mount if requested - with proper dependency management
  useEffect(() => {
    if (options.autoRegister && options.userId && isNativePlatform() && !isRegistered.current) {
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
