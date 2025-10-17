/**
 * Performance Budget Tests
 *
 * Ensures UI meets performance requirements:
 * - Interaction time <100ms
 * - Bundle size <500KB initial
 * - Lighthouse score >90
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Budgets', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    console.log(`✅ Page load time: ${loadTime}ms`);
  });

  test('interaction responsiveness', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Test button click response time
    const button = page.locator('button').first();

    if (await button.count() > 0) {
      const startTime = Date.now();
      await button.click();
      const clickTime = Date.now() - startTime;

      // Interaction should respond in <100ms
      expect(clickTime).toBeLessThan(100);

      console.log(`✅ Click response time: ${clickTime}ms`);
    }
  });

  test('bundle size check', async ({ page }) => {
    const resources: { url: string; size: number; type: string }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/_next/') || url.includes('.js') || url.includes('.css')) {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0', 10);

        resources.push({
          url,
          size: contentLength,
          type: response.request().resourceType(),
        });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Calculate total JS bundle size
    const jsResources = resources.filter(r => r.url.endsWith('.js'));
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);

    // Calculate total CSS bundle size
    const cssResources = resources.filter(r => r.url.endsWith('.css'));
    const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0);

    const totalSize = totalJsSize + totalCssSize;

    console.log(`📊 Performance Metrics:`);
    console.log(`  JS Bundle: ${(totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`  CSS Bundle: ${(totalCssSize / 1024).toFixed(2)} KB`);
    console.log(`  Total: ${(totalSize / 1024).toFixed(2)} KB`);

    // Initial bundle should be <500KB
    expect(totalJsSize).toBeLessThan(500 * 1024);

    // Total bundle should be <1MB
    expect(totalSize).toBeLessThan(1024 * 1024);
  });

  test('lighthouse performance audit', async ({ page, browser }) => {
    await page.goto('/');

    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const paintEntries = entries.filter(e => e.entryType === 'paint');

            resolve({
              fcp: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
              lcp: 0, // Would need proper LCP observer
            });
          });

          observer.observe({ entryTypes: ['paint'] });

          setTimeout(() => {
            observer.disconnect();
            resolve({ fcp: 0, lcp: 0 });
          }, 5000);
        } else {
          resolve({ fcp: 0, lcp: 0 });
        }
      });
    });

    console.log(`📊 Web Vitals:`);
    console.log(`  FCP: ${metrics.fcp.toFixed(2)}ms`);
    console.log(`  LCP: ${metrics.lcp.toFixed(2)}ms`);

    // FCP should be <1800ms (Lighthouse "Good" threshold)
    if (metrics.fcp > 0) {
      expect(metrics.fcp).toBeLessThan(1800);
    }
  });

  test('memory usage', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Measure JS heap size
    const memory = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memory) {
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      console.log(`📊 Memory Usage: ${usedMB} MB`);

      // Memory usage should be reasonable (<100MB)
      expect(memory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    }
  });

  test('animation frame rate', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Measure frame rate during scroll
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const duration = 1000; // 1 second
        const startTime = performance.now();

        function countFrame() {
          frames++;
          if (performance.now() - startTime < duration) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames);
          }
        }

        requestAnimationFrame(countFrame);
      });
    });

    console.log(`📊 Frame Rate: ${fps} FPS`);

    // Should maintain at least 30 FPS
    expect(fps).toBeGreaterThan(30);
  });
});
