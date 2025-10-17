// Utilitário para gerar ID único por dispositivo
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@taskflow_device_id';

export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Gerar um ID único baseado em timestamp + random
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Erro ao obter device ID:', error);
    // Fallback para um ID baseado em timestamp
    return `device_${Date.now()}`;
  }
};

export const getStorageKey = (deviceId: string): string => {
  return `@taskflow_tasks_${deviceId}`;
};
