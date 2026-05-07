import { expect, test } from "@playwright/test"

const smokeRoutes = [
  "/prc",
  "/prc/new-arrivals",
  "/prc/trending",
  "/prc/accessories",
  "/prc/collections",
  "/prc/collections/suits",
  "/prc/categories/giyim",
  "/prc/products/p1",
  "/prc/cart",
  "/prc/mesafeli-satis-sozlesmesi",
  "/prc/iade-ve-degisim",
  "/prc/iletisim",
]

test("mobile menu opens from first tap and navigation works", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "Tablet", "Tablet uses desktop navbar at this breakpoint.")

  await page.goto("/prc")
  await page.getByTestId("mobile-menu-trigger").click()
  await expect(page.getByTestId("mobile-menu-panel")).toBeVisible()

  await page.getByTestId("mobile-nav-giyim").click()
  await expect(page).toHaveURL(/\/prc\/categories\/giyim$/)
})

test("main routes do not return 404", async ({ page }) => {
  test.setTimeout(120_000)

  for (const route of smokeRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 })
    expect(response, `No response for ${route}`).not.toBeNull()
    expect(response!.status(), `Unexpected status for ${route}`).toBeLessThan(400)
    await expect(page.locator("text=404")).toHaveCount(0)
  }
})

test("product touch interactions and cart flow work", async ({ page }) => {
  await page.goto("/prc/products/p1")

  await page.getByTestId("product-thumbnail-1").tap()

  await page.getByTestId("product-gallery-main").tap()
  await expect(page.getByTestId("product-lightbox")).toBeVisible()
  await page.getByTestId("lightbox-close").click()
  await expect(page.getByTestId("product-lightbox")).toHaveCount(0)

  await page.getByTestId("color-lacivert").tap()
  await page.getByTestId("size-l").tap()

  await page.getByTestId("add-to-cart-button").tap()
  await expect(page.getByRole("button", { name: "Sepete Git" })).toBeVisible()
  await page.getByRole("button", { name: "Sepete Git" }).click()

  await expect(page).toHaveURL(/\/prc\/cart$/)
  await expect(page.getByText("Siparis Ozeti")).toBeVisible()
  await expect(page.getByText("Klasik Italyan Takim Elbise - L")).toBeVisible()
})
