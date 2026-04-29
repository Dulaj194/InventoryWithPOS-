'use client';

import { useState, useEffect } from 'react';
import { OfflineStorage } from './offlineStorage';
import { apiFetch } from './api';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSales, setPendingSales] = useState(0);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    const sales = await OfflineStorage.getUnsyncedSales();
    setPendingSales(sales.length);
  };

  const syncSales = async () => {
    if (!navigator.onLine) return;
    
    const unsynced = await OfflineStorage.getUnsyncedSales();
    if (unsynced.length === 0) return;

    console.log(`Syncing ${unsynced.length} pending sales...`);
    
    for (const sale of unsynced) {
      try {
        // Standard Sync Pattern:
        // 1. Send sale with Idempotency-Key
        // 2. Backend handles duplicate check, stock deduct, and payment save
        await apiFetch('/pos/orders', {
          method: 'POST',
          body: JSON.stringify(sale.data),
          headers: {
            'x-idempotency-key': sale.idempotencyKey
          }
        });
        
        // 3. Mark as synced in local DB
        await OfflineStorage.markAsSynced(sale.id);
        console.log(`Sale ${sale.id} synced successfully.`);
      } catch (error) {
        console.error('Failed to sync sale:', error);
        // If it's a 409 or similar idempotency error, we might still mark it as synced
        // but for now we just log and retry later
      }
    }
    
    updatePendingCount();
  };

  return { isOnline, pendingSales, updatePendingCount, syncSales };
}
