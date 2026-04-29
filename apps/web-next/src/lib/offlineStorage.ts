/**
 * myPosSystem - Offline Storage Utility
 * Uses IndexedDB for persistent storage of sales and data when offline.
 */

const DB_NAME = 'myPosDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_sales';

export class OfflineStorage {
  private static db: IDBDatabase | null = null;

  static async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  static generateIdempotencyKey(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async saveSale(sale: any): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({
        ...sale,
        idempotencyKey: sale.idempotencyKey || this.generateIdempotencyKey(),
        synced: false,
        createdAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  static async getUnsyncedSales(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const sales = request.result as any[];
        resolve(sales.filter(s => !s.synced));
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async markAsSynced(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          store.put(data);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}
