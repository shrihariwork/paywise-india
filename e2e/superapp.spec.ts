import { test, expect } from '@playwright/test';

test.describe('PayWise India — SuperApp E2E Flow', () => {
  test('SuperApp loads with PayWise India branding and Zero-PCI DSS assurance', async ({
    page,
  }) => {
    await page.goto('/');

    // Check Header Branding
    await expect(page.locator('header').getByText('PayWise India')).toBeVisible();
    await expect(page.locator('header').getByText('AI SuperApp')).toBeVisible();
    await expect(page.locator('header').getByText('Zero-PCI DSS')).toBeVisible();

    // Check Navigation Tabs
    await expect(page.getByRole('button', { name: /Ask Agent/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /My Wallet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /MCC Explorer/i })).toBeVisible();
  });

  test('Renders DMart #1 payment recommendation stack with financial math breakdown', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify initial DMart recommendation is present
    await expect(page.getByText('DMart (Avenue Supermarts)').first()).toBeVisible();
    await expect(page.locator('text=#1 Highest Return Strategy')).toBeVisible();
    await expect(page.locator('text=Exact Financial Math Breakdown:')).toBeVisible();
    await expect(page.locator('text=Step-by-Step Payment Instructions:')).toBeVisible();

    // Check Full Wallet Comparison Table
    await expect(
      page.locator('text=Full Comparison Across Your Wallet')
    ).toBeVisible();
  });

  test('Clicking scenario chip calculates dining double-dip for Mainland China', async ({
    page,
  }) => {
    await page.goto('/');

    // Click Mainland China scenario chip
    const mainlandChinaChip = page.getByRole('button', {
      name: /₹4,200 dinner at Mainland China/i,
    });
    await expect(mainlandChinaChip).toBeVisible();
    await mainlandChinaChip.click();

    // Wait for optimization to display Mainland China context
    await expect(
      page.getByText('Mainland China Restaurant', { exact: true })
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=MCC: 5812')).toBeVisible();
  });

  test('Can switch to My Wallet tab, view card toggles and dynamic monthly cap sliders', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to My Wallet tab
    const walletTabBtn = page.getByRole('button', { name: /My Wallet/i });
    await walletTabBtn.click();

    // Verify Zero-PCI DSS Guarantee
    await expect(
      page.locator('text=Zero-PCI DSS Architecture & Financial Privacy Guarantee')
    ).toBeVisible();

    // Verify credit cards are listed
    await expect(page.locator('text=HDFC Infinia Metal Credit Card')).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'SBI Cashback Credit Card' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'HSBC Live+ Credit Card' })).toBeVisible();

    // Verify monthly cap simulation sliders
    await expect(
      page.locator('text=Simulate Monthly Cap Already Consumed')
    ).toBeVisible();
  });

  test('Can switch to MCC Explorer tab, search Indian merchants, and see MCC codes', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to MCC Explorer tab
    const explorerTabBtn = page.getByRole('button', { name: /MCC Explorer/i });
    await explorerTabBtn.click();

    // Verify Explorer Header
    await expect(
      page.locator('text=Indian Merchant & MCC Knowledge Graph')
    ).toBeVisible();

    // Search for DMart
    const searchInput = page.getByPlaceholder(/Search by merchant name/i);
    await searchInput.fill('DMart');

    await expect(page.getByText('MCC 5411', { exact: true })).toBeVisible();
    await expect(page.locator('text=No GyFTR Vouchers')).toBeVisible();
  });

  test('Testing a merchant from MCC Explorer navigates to Agent and runs optimization', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to MCC Explorer tab
    const explorerTabBtn = page.getByRole('button', { name: /MCC Explorer/i });
    await explorerTabBtn.click();

    // Click "Test ₹6,000 at Lifestyle" or any test button
    const testButton = page.getByRole('button', { name: /Test ₹6,000 at Lifestyle/i });
    await expect(testButton).toBeVisible();
    await testButton.click();

    // Should automatically navigate back to Ask Agent tab
    await expect(page.locator('text=Where are you paying right now?')).toBeVisible();
    await expect(
      page.getByText('Lifestyle Department Store', { exact: true })
    ).toBeVisible({ timeout: 5000 });
  });
});
