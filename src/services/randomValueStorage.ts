/**
 * Random Value 本地存储服务
 * V2.0 - 承诺-揭秘机制
 * 
 * 重要：用户的random_value必须安全存储，否则无法揭示！
 */

// 存储键接口
export interface StorageKey {
  period: number;
  userAddress: string;
}

// 存储值接口
export interface StorageValue {
  randomValue: string;
  timestamp: number;
  revealed: boolean;
  period: number;
  userAddress: string;
}

// IndexedDB配置
const DB_NAME = 'LuckeeBlindBoxDB';
const DB_VERSION = 1;
const STORE_NAME = 'randomValues';

// 备用LocalStorage键前缀
const LS_PREFIX = 'luckee_random_';

/**
 * Random Value 存储服务类
 */
export class RandomValueStorage {
  private db: IDBDatabase | null = null;
  private useLocalStorage: boolean = false;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // SSR环境，不执行
    }

    try {
      // 尝试使用IndexedDB
      this.db = await this.openDatabase();
      this.useLocalStorage = false;
    } catch (error) {
      console.warn('IndexedDB不可用，使用LocalStorage备份', error);
      this.useLocalStorage = true;
    }
  }

  /**
   * 打开IndexedDB数据库
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: ['period', 'userAddress'],
          });

          // 创建索引
          objectStore.createIndex('period', 'period', { unique: false });
          objectStore.createIndex('userAddress', 'userAddress', { unique: false });
          objectStore.createIndex('revealed', 'revealed', { unique: false });
        }
      };
    });
  }

  /**
   * 保存random_value
   */
  async save(key: StorageKey, randomValue: string): Promise<void> {
    const value: StorageValue = {
      randomValue,
      timestamp: Date.now(),
      revealed: false,
      period: key.period,
      userAddress: key.userAddress,
    };

    if (this.useLocalStorage) {
      // 使用LocalStorage
      const storageKey = this.getLocalStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } else {
      // 使用IndexedDB
      await this.saveToIndexedDB(value);
    }
  }

  /**
   * 保存到IndexedDB
   */
  private saveToIndexedDB(value: StorageValue): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 读取random_value
   */
  async load(key: StorageKey): Promise<string | null> {
    if (this.useLocalStorage) {
      // 从LocalStorage读取
      const storageKey = this.getLocalStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return null;

      try {
        const value: StorageValue = JSON.parse(stored);
        return value.randomValue;
      } catch {
        return null;
      }
    } else {
      // 从IndexedDB读取
      const value = await this.loadFromIndexedDB(key);
      return value?.randomValue || null;
    }
  }

  /**
   * 从IndexedDB读取
   */
  private loadFromIndexedDB(key: StorageKey): Promise<StorageValue | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get([key.period, key.userAddress]);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * 标记为已揭示
   */
  async markRevealed(key: StorageKey): Promise<void> {
    if (this.useLocalStorage) {
      // LocalStorage
      const storageKey = this.getLocalStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const value: StorageValue = JSON.parse(stored);
          value.revealed = true;
          localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
          console.error('标记已揭示失败', error);
        }
      }
    } else {
      // IndexedDB
      const value = await this.loadFromIndexedDB(key);
      if (value) {
        value.revealed = true;
        await this.saveToIndexedDB(value);
      }
    }
  }

  /**
   * 列出所有未揭示的记录
   */
  async listUnrevealed(userAddress: string): Promise<StorageValue[]> {
    if (this.useLocalStorage) {
      // LocalStorage
      const results: StorageValue[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LS_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const value: StorageValue = JSON.parse(stored);
              if (value.userAddress === userAddress && !value.revealed) {
                results.push(value);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
      
      return results;
    } else {
      // IndexedDB
      return this.listUnrevealedFromIndexedDB(userAddress);
    }
  }

  /**
   * 从IndexedDB列出未揭示记录
   */
  private listUnrevealedFromIndexedDB(userAddress: string): Promise<StorageValue[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('userAddress');
      const request = index.getAll(userAddress);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const all = request.result || [];
        const unrevealed = all.filter(v => !v.revealed);
        resolve(unrevealed);
      };
    });
  }

  /**
   * 删除记录
   */
  async delete(key: StorageKey): Promise<void> {
    if (this.useLocalStorage) {
      const storageKey = this.getLocalStorageKey(key);
      localStorage.removeItem(storageKey);
    } else {
      await this.deleteFromIndexedDB(key);
    }
  }

  /**
   * 从IndexedDB删除
   */
  private deleteFromIndexedDB(key: StorageKey): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete([key.period, key.userAddress]);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 导出所有数据（备份）
   */
  async exportAll(): Promise<StorageValue[]> {
    if (this.useLocalStorage) {
      const results: StorageValue[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LS_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              results.push(JSON.parse(stored));
            } catch {
              // 忽略
            }
          }
        }
      }
      
      return results;
    } else {
      return this.exportAllFromIndexedDB();
    }
  }

  /**
   * 从IndexedDB导出所有数据
   */
  private exportAllFromIndexedDB(): Promise<StorageValue[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * 导入数据（恢复）
   */
  async importAll(data: StorageValue[]): Promise<void> {
    for (const value of data) {
      if (this.useLocalStorage) {
        const key = this.getLocalStorageKey({
          period: value.period,
          userAddress: value.userAddress,
        });
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        await this.saveToIndexedDB(value);
      }
    }
  }

  /**
   * 清理过期数据（7天前）
   */
  async cleanup(daysOld: number = 7): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let count = 0;

    if (this.useLocalStorage) {
      const keysToDelete: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LS_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const value: StorageValue = JSON.parse(stored);
              if (value.timestamp < cutoffTime && value.revealed) {
                keysToDelete.push(key);
              }
            } catch {
              // 忽略
            }
          }
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      count = keysToDelete.length;
    } else {
      count = await this.cleanupIndexedDB(cutoffTime);
    }

    return count;
  }

  /**
   * 清理IndexedDB过期数据
   */
  private cleanupIndexedDB(cutoffTime: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const all = request.result || [];
        let count = 0;

        all.forEach(value => {
          if (value.timestamp < cutoffTime && value.revealed) {
            objectStore.delete([value.period, value.userAddress]);
            count++;
          }
        });

        resolve(count);
      };
    });
  }

  /**
   * 获取LocalStorage键
   */
  private getLocalStorageKey(key: StorageKey): string {
    return `${LS_PREFIX}${key.period}_${key.userAddress}`;
  }
}

// 创建单例实例
export const randomValueStorage = new RandomValueStorage();

// 在浏览器环境初始化
if (typeof window !== 'undefined') {
  randomValueStorage.init().catch(console.error);
}

