import { defineConfig, devices } from "@playwright/test"

const PORT = 3001
const baseURL = `http://127.0.0.1:${PORT}`
const appURL = `${baseURL}/prc`

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: {
    timeout: 7_000,
  },
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "Mobile 320",
      use: {
        browserName: "chromium",
        viewport: { width: 320, height: 700 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "Mobile 360",
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 780 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "iPhone 12",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "Mobile 430",
      use: {
        browserName: "chromium",
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: "Tablet",
      use: { ...devices["iPad Mini"] },
    },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
    url: appURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
