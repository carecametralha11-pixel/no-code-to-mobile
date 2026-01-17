import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';

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
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
}

// Push Notifications utilities
export async function registerPushNotifications() {
  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // Register with Apple / Google to receive push notifications
      await PushNotifications.register();
      
      // Setup listeners
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration token:', token.value);
        // Here you would typically send this token to your server
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action performed:', action);
      });

      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    throw error;
  }
}

// Check if running on native platform
export function isNativePlatform(): boolean {
  return typeof window !== 'undefined' && 
    (window as any).Capacitor !== undefined && 
    (window as any).Capacitor.isNativePlatform();
}
