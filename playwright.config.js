import { defineConfig, devices } from '@playwright/test'

/**
 * 本地开发：先 `pnpm preSite && pnpm dev`，再跑 `pnpm test:e2e`
 * 本地官网：http://localhost:3101/tiny-vue-mobile
 * 远程官网：通过环境变量 E2E_ORIGIN 覆盖，例如 https://opentiny.github.io/tiny-vue-mobile
 */
const origin = process.env.E2E_ORIGIN || 'http://localhost:3101/tiny-vue-mobile'
const baseURL = `${origin}/zh-CN/os-theme/components/`
const isRemote = Boolean(process.env.E2E_ORIGIN)
const devServerCommon = isRemote ? '' : 'pnpm run -w dev'

export default defineConfig({
  testDir: './packages/demos',
  timeout: 30 * 1000,
  expect: {
    timeout: 8 * 1000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02
    }
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html']],
  use: {
    actionTimeout: 0,
    baseURL: process.env.PYTEST_BASEURL || baseURL,
    storageState: process.env.PYTEST_STORAGE
      ? JSON.parse(process.env.PYTEST_STORAGE)
      : {
          origins: [
            {
              origin,
              localStorage: [
                { name: 'tiny-vue-api-mode', value: 'Composition' },
                { name: 'tiny-vue-demo-mode', value: 'single' },
                { name: 'tiny-e2e-test', value: 'true' }
              ]
            }
          ]
        },
    trace: 'on-first-retry',
    headless: !!process.env.CI,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read'],
    timezoneId: 'Asia/Shanghai'
  },
  webServer: !devServerCommon
    ? null
    : {
        command: devServerCommon,
        url: 'http://localhost:3101/',
        reuseExistingServer: true,
        timeout: 180 * 1000,
        stdout: 'pipe'
      },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1080, height: 720 }
      }
    },
    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 5']
      }
    },
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 12']
      }
    }
  ]
})
