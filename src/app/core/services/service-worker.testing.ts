/**
 * Service Worker Cache Invalidation & Testing Guide
 * 
 * This file documents cache management and testing strategies for the
 * Lao Language Learning App PWA Service Worker.
 */

// ============================================================================
// CACHE STRATEGY OVERVIEW
// ============================================================================

/**
 * The Service Worker uses a performance-first caching strategy:
 * 
 * 1. KNOWLEDGE_BASE.JSON (knowledge-monolith)
 *    - Strategy: Performance (cache-first, network as fallback)
 *    - Max Size: 1 entry (monolith is ~8-10MB)
 *    - Cache Duration: 30 days
 *    - Behavior: On first load, cache is populated. Subsequent loads use cache.
 *               Network requests only if cache expired or offline.
 * 
 * 2. AUDIO FILES (audio-cache)
 *    - Strategy: Performance (cache-first, network as fallback)
 *    - Max Size: 2 entries (rotating audio file cache)
 *    - Cache Duration: 90 days
 *    - Behavior: High-frequency audio cached aggressively for offline access.
 * 
 * 3. APP ASSETS (app)
 *    - Strategy: Prefetch (downloaded on first install)
 *    - Includes: HTML, CSS, JS, manifest, favicon
 *    - Updated on version change (angular.json version field)
 * 
 * 4. STATIC ASSETS (assets)
 *    - Strategy: Lazy (downloaded on-demand)
 *    - Includes: Images, fonts, styles not in app group
 *    - Updated on-demand, not prefetched
 */

// ============================================================================
// CACHE INVALIDATION STRATEGIES
// ============================================================================

/**
 * METHOD 1: VERSION BUMP (RECOMMENDED FOR PRODUCTION)
 * 
 * When you need to invalidate ALL caches and force refresh:
 * 
 * 1. Update angular.json build version:
 *    "version": "1.0.1"  (increment patch/minor/major)
 * 
 * 2. Angular CLI automatically updates ngsw.json manifest
 * 
 * 3. Service Worker detects version change and:
 *    - Invalidates app assetGroup cache
 *    - Prompts user to refresh (or auto-refresh on reload)
 *    - Preserves dataGroups (knowledge-base, audio) intentionally
 * 
 * Trade-off: Users must refresh to get new assets (graceful degradation)
 */

/**
 * METHOD 2: EXPLICIT DATA GROUP EXPIRATION
 * 
 * To invalidate ONLY knowledge_base or audio cache:
 * 
 * 1. Edit ngsw-config.json dataGroup maxAge:
 *    "maxAge": "0d"  (expire immediately)
 * 
 * 2. Rebuild and deploy
 * 
 * 3. Service Worker will check expiration on next online request
 * 
 * 4. Restore original maxAge after cache clear
 * 
 * Use case: After knowledge_base.json updates, force clients to refetch
 */

/**
 * METHOD 3: CLIENT-SIDE CACHE CLEAR (POWER USER)
 * 
 * For testing/debugging in DevTools:
 * 
 * await caches.delete('ngsw:db:control');
 * await caches.keys().then(names =>
 *   Promise.all(names.map(n => caches.delete(n)))
 * );
 * 
 * Then reload the page.
 * 
 * WARNING: Clears ALL Service Worker caches, including offline data!
 */

// ============================================================================
// TESTING CACHE BEHAVIOR
// ============================================================================

/**
 * TEST 1: KNOWLEDGE BASE CACHING
 * 
 * Prerequisites: Production build (ng build --configuration=production)
 * 
 * Steps:
 * 1. Open DevTools → Application → Caches
 * 2. Load app for first time → Wait 2 seconds
 * 3. Check "ngsw:db" → Should see knowledge_base.json cached
 * 4. Refresh page → Verify load is instant (from cache)
 * 5. Go offline (DevTools → Network → Offline)
 * 6. Reload → Should still work (data from cache)
 * 7. Try to navigate to new level → Should load from cache
 * 
 * Expected: All operations work offline after first load
 */

/**
 * TEST 2: AUDIO CACHING
 * 
 * Prerequisites: Production build with some audio assets
 * 
 * Steps:
 * 1. Open DevTools → Network tab
 * 2. Play audio activity (Tone Matcher, Alphabet Explorer)
 * 3. First playback: Network request visible
 * 4. Second playback: Audio served from cache (no network request)
 * 5. Disable cache (DevTools → Disable cache checkbox)
 * 6. Play again → Network request visible (cache bypassed)
 * 7. Re-enable cache → Network tab should show cache hits
 * 
 * Expected: Audio files cached after first playback
 */

/**
 * TEST 3: CACHE EXPIRATION (30 DAYS)
 * 
 * Prerequisites: Ability to modify system clock or use Cache API
 * 
 * Steps:
 * 1. Load app normally (knowledge_base cached)
 * 2. Open DevTools Console:
 *    const cache = await caches.open('ngsw:db');
 *    const keys = await cache.keys();
 *    keys.forEach(r => console.log(r.url));
 * 3. Note the cached response headers
 * 4. Advance system clock +31 days (or modify test harness)
 * 5. Reload app → Service Worker detects expired cache
 * 6. Network request should happen (cache miss)
 * 7. New response cached
 * 
 * Expected: Cache refreshed after maxAge expires
 */

/**
 * TEST 4: OFFLINE FUNCTIONALITY
 * 
 * Prerequisites: App loaded and warmed (cache populated)
 * 
 * Steps:
 * 1. Open app, navigate through activities (load all views into cache)
 * 2. Open DevTools → Network tab → Set throttling to "Offline"
 * 3. Reload page → Should load from cache
 * 4. Click through dashboard, activities → All work offline
 * 5. Try to start new activity → Loads from cache
 * 6. Check progress tracking → localStorage works offline
 * 7. Re-enable network → App syncs any pending updates
 * 
 * Expected: Full offline functionality after initial load
 */

/**
 * TEST 5: CACHE INVALIDATION (VERSION BUMP)
 * 
 * Prerequisites: App deployed with version "1.0.0"
 * 
 * Steps:
 * 1. Load app normally
 * 2. Open DevTools → Application → Service Workers
 * 3. Bump version in angular.json to "1.0.1"
 * 4. Rebuild: ng build --configuration=production
 * 5. Deploy to server
 * 6. User visits app with old Service Worker
 * 7. New Service Worker registers, detects version change
 * 8. Old app cache invalidated
 * 9. User prompted to refresh (or auto-refresh)
 * 10. New assets loaded
 * 
 * Expected: Seamless version update with no broken state
 */

// ============================================================================
// MONITORING & METRICS
// ============================================================================

/**
 * Cache Hit Rate Monitoring
 * 
 * To track effectiveness, monitor:
 * 
 * 1. Network tab statistics:
 *    - Cache hits: Requests served from cache (0 network time)
 *    - Cache misses: Fresh network requests
 *    - Ratio should trend toward 90%+ after warm-up period
 * 
 * 2. Performance metrics:
 *    - FCP with cache: <1.5s (cache hits improve this)
 *    - LCP with cache: <2.5s (data already loaded)
 *    - Offline load time: Instant (no network delays)
 * 
 * 3. Storage quota:
 *    - Check: navigator.storage.estimate()
 *    - knowledge_base: ~8-10MB
 *    - Audio files: ~2-5MB
 *    - Total: <15% of typical 50MB quota
 * 
 * 4. User metrics:
 *    - Session start time (warm vs cold cache)
 *    - Activity load time (offline vs online)
 *    - Bounce rate (if offline works, users stay)
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * ISSUE: App shows stale data after update
 * SOLUTION: Version bump in angular.json triggers cache clear
 * 
 * ISSUE: Audio doesn't play offline
 * SOLUTION: Check audio URLs in ngsw-config.json match actual paths
 *           Verify maxSize allows enough audio files
 *           Clear cache and reload to populate cache fresh
 * 
 * ISSUE: Service Worker not activating
 * SOLUTION: Ensure environment.production = true
 *           Check main.ts has provideServiceWorker
 *           Clear all caches and hard-refresh (Ctrl+Shift+R)
 *           Check browser console for SW errors
 * 
 * ISSUE: Knowledge base not caching
 * SOLUTION: Verify "/assets/data/knowledge_base.json" is served with correct MIME type
 *           Check ngsw-config.json dataGroup URL patterns match requests
 *           Inspect Network tab → Filter by "knowledge" → Look for (cached) label
 * 
 * ISSUE: Cache grows too large
 * SOLUTION: Reduce maxSize in dataGroups
 *           Remove unnecessary asset files from assetGroups
 *           Use lazy strategy for large assets instead of prefetch
 */

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/**
 * Before production deployment:
 * 
 * ✓ Verify angular.json has serviceWorker: "ngsw-config.json"
 * ✓ Verify main.ts has provideServiceWorker with correct enabled condition
 * ✓ Review ngsw-config.json dataGroups for accuracy
 * ✓ Test production build locally: ng serve --configuration=production
 * ✓ Verify Service Worker registers in DevTools
 * ✓ Test cache population (load app, check caches)
 * ✓ Test offline mode (disable network, reload)
 * ✓ Verify version number in angular.json is incremented
 * ✓ Deploy and verify Service Worker updates on client
 * ✓ Monitor cache hit rates in analytics
 * ✓ Plan cache invalidation strategy for future updates
 */

export const PWA_CONFIGURATION_NOTES = {
  knowledge_base_cache_days: 30,
  audio_cache_days: 90,
  app_update_strategy: 'registerWhenStable:30000',
  offline_support: true,
  cache_strategy: 'performance',
};
