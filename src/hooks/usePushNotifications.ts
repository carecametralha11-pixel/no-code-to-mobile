import { useState, useCallback, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
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
    if (!isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
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
          return false;
        }
      } else if (permStatus.receive !== 'granted') {
        toast({
          title: 'Notificações bloqueadas',
          description: 'Ative as notificações nas configurações do app',
          variant: 'destructive',
        });
        return false;
      }

      setPermissionGranted(true);

      // Register with Apple/Google
      await PushNotifications.register();

      // Setup listeners
      PushNotifications.addListener('registration', async (tokenData) => {
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

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        toast({
          title: 'Erro nas notificações',
          description: 'Não foi possível registrar notificações',
          variant: 'destructive',
        });
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        toast({
          title: notification.title || 'Nova notificação',
          description: notification.body || '',
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action performed:', action);
        // Navigate based on notification data if needed
      });

      return true;
    } catch (err) {
      console.error('Error registering push notifications:', err);
      toast({
        title: 'Erro nas notificações',
        description: 'Falha ao configurar notificações push',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
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
      console.log('Push token removed');
    } catch (err) {
      console.error('Error removing push token:', err);
    }
  }, [token]);

  // Auto-register on mount if requested
  useEffect(() => {
    if (options.autoRegister && options.userId && isNativePlatform()) {
      registerPushNotifications(options.userId);
    }
  }, [options.autoRegister, options.userId, registerPushNotifications]);

  return {
    token,
    loading,
    permissionGranted,
    registerPushNotifications,
    removeToken,
    isNative: isNativePlatform(),
  };
}
