import { useState, useCallback, useEffect } from 'react';
import { isNativePlatform } from '@/lib/nativeFeatures';
import { useToast } from '@/hooks/use-toast';

export interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'unknown',
    location: 'unknown',
    notifications: 'unknown',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isNative = isNativePlatform();

  const checkCameraPermission = useCallback(async () => {
    if (!isNative) return 'granted';
    
    try {
      const { Camera } = await import('@capacitor/camera');
      const status = await Camera.checkPermissions();
      return status.camera === 'granted' ? 'granted' : 
             status.camera === 'denied' ? 'denied' : 'prompt';
    } catch {
      return 'unknown';
    }
  }, [isNative]);

  const checkLocationPermission = useCallback(async () => {
    if (!isNative) return 'granted';
    
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const status = await Geolocation.checkPermissions();
      return status.location === 'granted' ? 'granted' : 
             status.location === 'denied' ? 'denied' : 'prompt';
    } catch {
      return 'unknown';
    }
  }, [isNative]);

  const checkNotificationPermission = useCallback(async () => {
    if (!isNative) return 'granted';
    
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'granted' ? 'granted' : 
             status.receive === 'denied' ? 'denied' : 'prompt';
    } catch {
      return 'unknown';
    }
  }, [isNative]);

  const checkAllPermissions = useCallback(async () => {
    const [camera, location, notifications] = await Promise.all([
      checkCameraPermission(),
      checkLocationPermission(),
      checkNotificationPermission(),
    ]);

    setPermissions({
      camera: camera as PermissionStatus['camera'],
      location: location as PermissionStatus['location'],
      notifications: notifications as PermissionStatus['notifications'],
    });

    return { camera, location, notifications };
  }, [checkCameraPermission, checkLocationPermission, checkNotificationPermission]);

  const requestCameraPermission = useCallback(async () => {
    if (!isNative) return true;
    
    try {
      const { Camera } = await import('@capacitor/camera');
      const result = await Camera.requestPermissions();
      const granted = result.camera === 'granted';
      
      setPermissions(prev => ({ ...prev, camera: granted ? 'granted' : 'denied' }));
      
      if (!granted) {
        toast({
          title: 'Câmera bloqueada',
          description: 'Ative a câmera nas configurações do app para enviar fotos.',
          variant: 'destructive',
        });
      }
      
      return granted;
    } catch (err) {
      console.error('Camera permission error:', err);
      return false;
    }
  }, [isNative, toast]);

  const requestLocationPermission = useCallback(async () => {
    if (!isNative) return true;
    
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const result = await Geolocation.requestPermissions();
      const granted = result.location === 'granted';
      
      setPermissions(prev => ({ ...prev, location: granted ? 'granted' : 'denied' }));
      
      if (!granted) {
        toast({
          title: 'Localização bloqueada',
          description: 'Ative a localização nas configurações do app.',
          variant: 'destructive',
        });
      }
      
      return granted;
    } catch (err) {
      console.error('Location permission error:', err);
      return false;
    }
  }, [isNative, toast]);

  const requestNotificationPermission = useCallback(async () => {
    if (!isNative) return true;
    
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      const granted = result.receive === 'granted';
      
      setPermissions(prev => ({ ...prev, notifications: granted ? 'granted' : 'denied' }));
      
      if (!granted) {
        toast({
          title: 'Notificações bloqueadas',
          description: 'Ative as notificações nas configurações do app.',
          variant: 'destructive',
        });
      }
      
      return granted;
    } catch (err) {
      console.error('Notification permission error:', err);
      return false;
    }
  }, [isNative, toast]);

  const requestAllPermissions = useCallback(async () => {
    setLoading(true);
    
    try {
      const [camera, location, notifications] = await Promise.all([
        requestCameraPermission(),
        requestLocationPermission(),
        requestNotificationPermission(),
      ]);

      return { camera, location, notifications };
    } finally {
      setLoading(false);
    }
  }, [requestCameraPermission, requestLocationPermission, requestNotificationPermission]);

  // Check permissions on mount for native platforms
  useEffect(() => {
    if (isNative) {
      checkAllPermissions();
    }
  }, [isNative, checkAllPermissions]);

  return {
    permissions,
    loading,
    isNative,
    checkAllPermissions,
    requestCameraPermission,
    requestLocationPermission,
    requestNotificationPermission,
    requestAllPermissions,
  };
}
