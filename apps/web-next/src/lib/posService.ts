import { OfflineStorage } from './offlineStorage';
import { apiFetch } from './api';

export class PosFrontendService {
  static async createOrder(orderData: any) {
    const idempotencyKey = OfflineStorage.generateIdempotencyKey();
    
    // 1. Check if online
    if (navigator.onLine) {
      try {
        // 2. Try to save directly to API
        console.log('Online: Sending order to API...');
        const response = await apiFetch('/pos/orders', {
          method: 'POST',
          body: JSON.stringify(orderData),
          headers: {
            'x-idempotency-key': idempotencyKey
          }
        });
        return { success: true, mode: 'online', data: response.data };
      } catch (error) {
        console.error('API Error, falling back to local storage:', error);
        // Fallback to local if API fails (even if online, e.g. server down)
      }
    }

    // 3. Save to local storage (Offline or API failed)
    console.log('Offline/API Fail: Saving order locally...');
    await OfflineStorage.saveSale({
      data: orderData,
      idempotencyKey
    });
    
    return { success: true, mode: 'offline', idempotencyKey };
  }
}
