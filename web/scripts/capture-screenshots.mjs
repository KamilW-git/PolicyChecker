/**
 * Capture application screenshots into ../screenshots/
 * Usage: npm run screenshots:docker  (from web/)
 */
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUT_DIR = path.resolve(__dirname, '../../screenshots')
const PASSWORD = 'test1234'

async function login(page, email) {
  await page.context().clearCookies()
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('input[name="email"]', { timeout: 15000 })
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

async function screenshot(page, filename, { fullPage = true } = {}) {
  const filePath = path.join(OUT_DIR, filename)
  await page.screenshot({ path: filePath, fullPage })
  console.log(`  ✓ ${filename}`)
}

async function openFirstRequest(page, query = '') {
  await page.goto(`${BASE_URL}/requests${query}`, { waitUntil: 'networkidle' })
  const link = page.getByRole('link', { name: 'Szczegóły' }).first()
  if ((await link.count()) === 0) return null
  const href = await link.getAttribute('href')
  if (!href || href.includes('/new') || href.includes('/edit')) return null
  await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' })
  return href
}

async function openRequestByStatus(page, status, email = 'reviewer@pc.com') {
  await login(page, email)
  return openFirstRequest(page, `?status=${status}`)
}

async function scrollToText(page, text) {
  const el = page.getByText(text, { exact: false }).first()
  if ((await el.count()) > 0) {
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
  }
}

async function countRequestsWithStatus(page, status) {
  await page.goto(`${BASE_URL}/requests?status=${status}`, { waitUntil: 'networkidle' })
  return page.getByRole('link', { name: 'Szczegóły' }).count()
}

async function submitRequestViaForm(page, opts) {
  await page.goto(`${BASE_URL}/requests/new`, { waitUntil: 'networkidle' })
  await page.fill('#title', opts.title)
  await page.fill(
    '#description',
    opts.description ||
      'Uzasadnienie demonstracyjne — wniosek utworzony automatycznie do zrzutów ekranu aplikacji PolicyChecker.'
  )
  if (opts.category) await page.selectOption('#category', opts.category)
  if (opts.vendorRisk) await page.selectOption('#vendorRisk', opts.vendorRisk)
  if (opts.urgency) await page.selectOption('#urgency', opts.urgency)
  await page.fill('#annualCost', String(opts.annualCost ?? 12000))
  await page.fill('#vendorName', opts.vendorName ?? 'Demo Vendor Sp. z o.o.')
  await page.fill('#vendorCountry', opts.vendorCountry ?? 'PL')
  await page.selectOption('#businessOwnerId', { index: 1 })
  if (opts.processesPersonalData) {
    await page.check('#processesPersonalData')
    await page.fill('#dataCategories', 'email, imię i nazwisko')
    if (!opts.hasDpa) await page.uncheck('#hasDpa')
  }
  await page.click('button:has-text("Przekaż do oceny")')
  await page.waitForURL(/\/requests\/[a-z0-9]+$/i, { timeout: 30000, waitUntil: 'commit' })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(800)
}

async function ensureDemoRequests(page) {
  await login(page, 'requester@pc.com')
  if ((await countRequestsWithStatus(page, 'NEEDS_INFORMATION')) === 0) {
    console.log('  → Tworzę wniosek NEEDS_INFORMATION (brak DPA)...')
    await submitRequestViaForm(page, {
      title: '[DEMO] SaaS z danymi osobowymi bez DPA',
      category: 'SAAS',
      processesPersonalData: true,
      hasDpa: false,
    })
  }
  if ((await countRequestsWithStatus(page, 'REJECTED')) === 0) {
    console.log('  → Tworzę wniosek REJECTED (dostawca CRITICAL)...')
    await submitRequestViaForm(page, {
      title: '[DEMO] Dostawca krytycznego ryzyka — blokada',
      vendorRisk: 'CRITICAL',
      vendorName: 'Risky Vendor Ltd.',
    })
  }
  if ((await countRequestsWithStatus(page, 'IN_REVIEW')) === 0) {
    console.log('  → Tworzę wniosek IN_REVIEW (SaaS > 5000 EUR)...')
    await submitRequestViaForm(page, {
      title: '[DEMO] SaaS enterprise — wymaga recenzji',
      category: 'SAAS',
      annualCost: 25000,
      currency: 'EUR',
    })
  }
}

async function firstPolicyDetailUrl(page) {
  await page.goto(`${BASE_URL}/policies`, { waitUntil: 'networkidle' })
  const cardLink = page.locator('.grid a[href^="/policies/"]').first()
  if ((await cardLink.count()) === 0) return null
  const href = await cardLink.getAttribute('href')
  if (!href || href.includes('/test') || href.includes('/new')) return null
  return href
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log(`Saving screenshots to: ${OUT_DIR}`)
  console.log(`Base URL: ${BASE_URL}\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'pl-PL',
  })
  const page = await context.newPage()
  let savedPolicyHref = null

  try {
    console.log('Przygotowanie danych demonstracyjnych...')
    await ensureDemoRequests(page)
    console.log('')

    // ── Podstawowe widoki ──────────────────────────────────────────────
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await screenshot(page, '01-login.png')

    await login(page, 'reviewer@pc.com')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
    await screenshot(page, '02-dashboard-reviewer.png')

    await page.goto(`${BASE_URL}/requests`, { waitUntil: 'networkidle' })
    await screenshot(page, '03-requests-list-reviewer.png')

    const reqHref = await openFirstRequest(page)
    if (reqHref) {
      await screenshot(page, '04-request-detail.png')
    } else {
      console.log('  ⚠ Brak wniosków — pomijam 04-request-detail.png')
    }

    await login(page, 'requester@pc.com')
    await page.goto(`${BASE_URL}/requests/new`, { waitUntil: 'networkidle' })
    await screenshot(page, '05-request-new-form.png')

    await page.goto(`${BASE_URL}/policies`, { waitUntil: 'networkidle' })
    await screenshot(page, '06-policies-list.png')

    savedPolicyHref = await firstPolicyDetailUrl(page)
    if (savedPolicyHref) {
      await page.goto(`${BASE_URL}${savedPolicyHref}`, { waitUntil: 'networkidle' })
      await screenshot(page, '07-policy-detail.png')
    } else {
      console.log('  ⚠ Brak polityk — pomijam 07-policy-detail.png')
    }

    await login(page, 'owner@pc.com')
    await page.goto(`${BASE_URL}/policies/test`, { waitUntil: 'networkidle' })
    await screenshot(page, '08-policy-test-console.png')

    await login(page, 'auditor@pc.com')
    await page.goto(`${BASE_URL}/audit`, { waitUntil: 'networkidle' })
    await screenshot(page, '09-audit-trail.png')

    await login(page, 'admin@pc.com')
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' })
    await screenshot(page, '10-admin-users.png')

    // ── Rozszerzone: workflow i role ───────────────────────────────────
    await login(page, 'requester@pc.com')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
    await screenshot(page, '11-dashboard-requester.png')

    await login(page, 'admin@pc.com')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
    await screenshot(page, '12-dashboard-admin.png')

    await login(page, 'reviewer@pc.com')
    await page.goto(`${BASE_URL}/requests?status=IN_REVIEW`, { waitUntil: 'networkidle' })
    await screenshot(page, '13-requests-filter-in-review.png')

    await page.goto(`${BASE_URL}/requests?urgency=EMERGENCY`, { waitUntil: 'networkidle' })
    await screenshot(page, '14-requests-filter-urgency.png')

    await page.goto(`${BASE_URL}/requests?needs_information=true`, { waitUntil: 'networkidle' })
    await screenshot(page, '15-requests-filter-needs-info.png')

    const inReviewHref = await openRequestByStatus(page, 'IN_REVIEW')
    if (inReviewHref) {
      await scrollToText(page, 'Policy Checker')
      await screenshot(page, '16-request-in-review-policy-panel.png')
      const overrideBtn = page.getByRole('button', { name: 'Manual Override' })
      if ((await overrideBtn.count()) > 0) {
        await overrideBtn.click()
        await page.waitForTimeout(500)
        await screenshot(page, '17-request-manual-override-modal.png', { fullPage: false })
        await page.keyboard.press('Escape')
      } else {
        console.log('  ⚠ Brak przycisku Manual Override — pomijam 17')
      }
    } else {
      console.log('  ⚠ Brak wniosków IN_REVIEW — pomijam 16-17')
    }

    const needsInfoHref = await openRequestByStatus(page, 'NEEDS_INFORMATION', 'requester@pc.com')
    if (needsInfoHref) {
      await screenshot(page, '18-request-needs-information-banner.png')
      const editLink = page.getByRole('link', { name: /Uzupełnij i prześlij ponownie|Edytuj/i }).first()
      if ((await editLink.count()) > 0) {
        await editLink.click()
        await page.waitForLoadState('networkidle')
        await screenshot(page, '19-request-edit-needs-info.png')
      }
    } else {
      console.log('  ⚠ Brak wniosków NEEDS_INFORMATION — pomijam 18-19')
    }

    await login(page, 'requester@pc.com')
    const draftHref = await openFirstRequest(page, '?status=DRAFT')
    if (draftHref) {
      await screenshot(page, '20-request-draft-detail.png')
      await page.goto(`${BASE_URL}${draftHref}/edit`, { waitUntil: 'networkidle' })
      await screenshot(page, '21-request-draft-edit-form.png')
    } else {
      console.log('  ⚠ Brak szkiców — pomijam 20-21')
    }

    await login(page, 'reviewer@pc.com')
    const approvedHref = await openRequestByStatus(page, 'AUTO_APPROVED')
    if (approvedHref) {
      await scrollToText(page, 'Policy Checker')
      await screenshot(page, '22-request-auto-approved.png')
    } else {
      console.log('  ⚠ Brak AUTO_APPROVED — pomijam 22')
    }

    const rejectedHref = await openRequestByStatus(page, 'REJECTED')
    if (rejectedHref) {
      await scrollToText(page, 'Policy Checker')
      await screenshot(page, '23-request-rejected.png')
    } else {
      console.log('  ⚠ Brak REJECTED — pomijam 23')
    }

    if (reqHref) {
      await login(page, 'reviewer@pc.com')
      await page.goto(`${BASE_URL}${reqHref}`, { waitUntil: 'networkidle' })
      await scrollToText(page, 'Załączniki')
      await screenshot(page, '24-request-attachments-comments.png')
      await scrollToText(page, 'Ślad Rewizyjny')
      await screenshot(page, '25-request-audit-trail-section.png')
    }

    // ── Polityki: owner + konsola testowa z wynikiem ───────────────────
    await login(page, 'owner@pc.com')
    await page.goto(`${BASE_URL}/policies`, { waitUntil: 'networkidle' })
    await screenshot(page, '26-policies-list-owner.png')

    const policyHref = savedPolicyHref || (await firstPolicyDetailUrl(page))
    if (policyHref) {
      await page.goto(`${BASE_URL}${policyHref}?newRule=true`, { waitUntil: 'networkidle' })
      await screenshot(page, '27-policy-add-rule-form.png')
    } else {
      console.log('  ⚠ Brak polityk — pomijam 27-policy-add-rule-form.png')
    }
    await page.goto(`${BASE_URL}/policies/new`, { waitUntil: 'networkidle' })
    await screenshot(page, '32-policies-new-form.png')

    await page.goto(`${BASE_URL}/policies/test`, { waitUntil: 'networkidle' })
    await page.click('button:has-text("Uruchom Silnik Reguł")')
    await page.waitForSelector('text=Uzasadnienie', { timeout: 15000 })
    await page.waitForTimeout(600)
    await screenshot(page, '28-policy-test-console-result.png')

    await login(page, 'approver@pc.com')
    await page.goto(`${BASE_URL}/policies`, { waitUntil: 'networkidle' })
    await screenshot(page, '29-policies-list-approver.png')

    await login(page, 'auditor@pc.com')
    await page.goto(`${BASE_URL}/audit?tab=evaluations`, { waitUntil: 'networkidle' })
    await screenshot(page, '30-audit-evaluations-tab.png')

    await login(page, 'requester@pc.com')
    await page.goto(`${BASE_URL}/requests?mine=true`, { waitUntil: 'networkidle' })
    await screenshot(page, '31-requests-my-requests.png')

    console.log('\nGotowe!')
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Błąd:', err.message)
  process.exit(1)
})
