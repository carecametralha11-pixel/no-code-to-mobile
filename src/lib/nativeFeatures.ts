import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

// Camera utilities
export async function takePicture() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return image.dataUrl;
  } catch (error) {
    console.error('Error taking picture:', error);
    throw error;
  }
}

export async function pickFromGallery() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    return image.dataUrl;
  } catch (error) {
    console.error('Error picking from gallery:', error);
    throw error;
  }
}

// Geolocation utilities
export async function getCurrentPosition() {
  try {
    // First check permissions
    const permStatus = await Geolocation.checkPermissions();
    
    if (permStatus.location === 'denied') {
      // Request permission
      const requestResult = await Geolocation.requestPermissions();
      if (requestResult.location === 'denied') {
        throw new Error('Permissão de localização negada. Habilite nas configurações do app.');
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error: any) {
    console.error('Error getting location:', error);
    // Provide user-friendly error messages
    if (error.message?.includes('Missing permission')) {
      throw new Error('Permissão de localização necessária. Habilite nas configurações.');
    }
    throw error;
  }
}

// Push Notifications utilities - using dynamic import to avoid crashes
export async function registerPushNotifications() {
  if (!isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return false;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // Register with Apple / Google to receive push notifications
      await PushNotifications.register();
      
      // Setup listeners
      await PushNotifications.addListener('registration', (token) => {
        console.log('Push registration token:', token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action performed:', action);
      });

      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    return false;
  }
}

// Check if running on native platform
export function isNativePlatform(): boolean {
  try {
    return typeof window !== 'undefined' && 
      (window as any).Capacitor !== undefined && 
      typeof (window as any).Capacitor.isNativePlatform === 'function' &&
      (window as any).Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
