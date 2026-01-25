import { Injectable, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { environment } from '../../../environments/environment';

/**
 * PWA Service
 *
 * Manages Service Worker lifecycle, cache invalidation, and offline state.
 * Provides reactive signals for UI to respond to cache/update events.
 *
 * Usage:
 *   constructor(private pwa: PwaService) {}
 *   isOnline$ = this.pwa.isOnline;
 *   hasUpdate$ = this.pwa.hasUpdate;
 *   cacheStatus$ = this.pwa.cacheStatus;
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  // Offline detection
  private readonly online = signal<boolean>(navigator.onLine);
  isOnline = this.online.asReadonly();

  // SW update detection
  private readonly hasUpdate = signal<boolean>(false);
  readonly hasUpdate$ = this.hasUpdate.asReadonly();

  // Cache status
  private readonly cacheStatus = signal<{
    isReady: boolean;
    size: number;
    itemCount: number;
  }>({ isReady: false, size: 0, itemCount: 0 });
  readonly cacheStatus$ = this.cacheStatus.asReadonly();

  constructor(private swUpdate: SwUpdate) {
    if (environment.production) {
      this.initializeServiceWorker();
    }
    this.monitorOnlineStatus();
    this.updateCacheStatus();
  }

  /**
   * Initialize Service Worker listeners
   */
  private initializeServiceWorker(): void {
    // Check for updates
    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_DETECTED') {
        console.log(`[PWA] New app version detected: ${event.version.hash}`);
      } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
        console.error(`[PWA] Version installation failed:`, event.error);
      } else if (event.type === 'VERSION_READY') {
        console.log(`[PWA] New version ready to activate`);
        this.hasUpdate.set(true);
      }
    });

    // Log activation
    this.swUpdate.versionUpdates.subscribe((event: any) => {
      if (event.type === 'VERSION_ACTIVATION') {
        console.log(`[PWA] Version activated`);
      }
    });
  }

  /**
   * Monitor online/offline status
   */
  private monitorOnlineStatus(): void {
    window.addEventListener('online', () => {
      this.online.set(true);
      console.log('[PWA] Online');
    });

    window.addEventListener('offline', () => {
      this.online.set(false);
      console.log('[PWA] Offline');
    });
  }

  /**
   * Update cache status
   */
  private async updateCacheStatus(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let itemCount = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const responses = await cache.keys();
        itemCount += responses.length;

        for (const response of responses) {
          const data = await cache.match(response);
          if (data) {
            const blob = await data.blob();
            totalSize += blob.size;
          }
        }
      }

      this.cacheStatus.set({
        isReady: true,
        size: totalSize,
        itemCount: itemCount
      });
    } catch (error) {
      console.error('[PWA] Failed to check cache status:', error);
    }
  }

  /**
   * Activate pending Service Worker update
   * Useful when UI detects hasUpdate signal and prompts user
   */
  async activateUpdate(): Promise<void> {
    if (!environment.production) {
      console.warn('[PWA] Updates only available in production');
      return;
    }

    try {
      const updated = await this.swUpdate.activateUpdate();
      if (updated) {
        console.log('[PWA] Update activated, reloading...');
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA] Failed to activate update:', error);
    }
  }

  /**
   * Manually clear all caches (useful for debugging/testing)
   * WARNING: Clears ALL cached data including offline data!
   */
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
      this.cacheStatus.set({ isReady: true, size: 0, itemCount: 0 });
    } catch (error) {
      console.error('[PWA] Failed to clear caches:', error);
    }
  }

  /**
   * Clear specific cache by name
   */
  async clearCache(cacheName: string): Promise<void> {
    try {
      const deleted = await caches.delete(cacheName);
      if (deleted) {
        console.log(`[PWA] Cleared cache: ${cacheName}`);
        await this.updateCacheStatus();
      }
    } catch (error) {
      console.error(`[PWA] Failed to clear cache ${cacheName}:`, error);
    }
  }

  /**
   * Get detailed cache information
   */
  async getCacheDetails(): Promise<
    {
      name: string;
      size: number;
      itemCount: number;
      items: { url: string; size: number }[];
    }[]
  > {
    try {
      const cacheNames = await caches.keys();
      const details: {
        name: string;
        size: number;
        itemCount: number;
        items: { url: string; size: number }[];
      }[] = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const responses = await cache.keys();

        let totalSize = 0;
        const items: { url: string; size: number }[] = [];

        for (const response of responses) {
          const data = await cache.match(response);
          if (data) {
            const blob = await data.blob();
            const size = blob.size;
            totalSize += size;
            items.push({
              url: response.url,
              size: size
            });
          }
        }

        details.push({
          name: cacheName,
          size: totalSize,
          itemCount: responses.length,
          items: items
        });
      }

      return details;
    } catch (error) {
      console.error('[PWA] Failed to get cache details:', error);
      return [];
    }
  }

  /**
   * Get storage quota and usage
   */
  async getStorageInfo(): Promise<{
    quota: number;
    usage: number;
    percentUsed: number;
    available: number;
  }> {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        console.warn('[PWA] Storage API not available');
        return {
          quota: 0,
          usage: 0,
          percentUsed: 0,
          available: 0
        };
      }

      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
      const available = quota - usage;

      return {
        quota,
        usage,
        percentUsed,
        available
      };
    } catch (error) {
      console.error('[PWA] Failed to get storage info:', error);
      return {
        quota: 0,
        usage: 0,
        percentUsed: 0,
        available: 0
      };
    }
  }

  /**
   * Request persistent storage (shows permission prompt)
   * Prevents browser from clearing cache when storage is low
   */
  async requestPersistentStorage(): Promise<boolean> {
    try {
      if (!navigator.storage || !navigator.storage.persist) {
        console.warn('[PWA] Persistent storage API not available');
        return false;
      }

      const persistent = await navigator.storage.persist();
      console.log(`[PWA] Persistent storage ${persistent ? 'granted' : 'denied'}`);
      return persistent;
    } catch (error) {
      console.error('[PWA] Failed to request persistent storage:', error);
      return false;
    }
  }

  /**
   * Get debugging information
   */
  async getDebugInfo(): Promise<{
    onLine: boolean;
    swAvailable: boolean;
    swUpdatesAvailable: boolean;
    cacheDetails: any;
    storageInfo: any;
  }> {
    return {
      onLine: navigator.onLine,
      swAvailable: 'serviceWorker' in navigator,
      swUpdatesAvailable: this.hasUpdate(),
      cacheDetails: await this.getCacheDetails(),
      storageInfo: await this.getStorageInfo()
    };
  }
}
