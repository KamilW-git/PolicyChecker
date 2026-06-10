import {
  PrismaClient,
  Role,
  PolicyDomain,
  RuleSeverity,
  Decision,
  RequestStatus,
  RequestType,
  RequestCategory,
  Currency,
  Department,
  Urgency,
  VendorRisk,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SAMPLE_PREFIX = '[Sample]'

function buildInputSnapshot(data: {
  title: string
  description: string
  type: RequestType
  category: RequestCategory
  annualCost: number
  currency: Currency
  vendorName: string
  vendorCountry: string
  department: Department
  urgency?: Urgency
  vendorRisk?: VendorRisk
  processesPersonalData?: boolean
  hasDpa?: boolean
  transferOutsideEEA?: boolean
  securityQuestionnaire?: boolean
  dataCategories?: string[]
}) {
  const annualCostEur =
    data.currency === 'EUR'
      ? data.annualCost
      : data.currency === 'PLN'
        ? Math.round(data.annualCost / 4.3)
        : data.currency === 'USD'
          ? Math.round(data.annualCost * 0.92)
          : data.annualCost
  return {
    title: data.title,
    description: data.description,
    type: data.type,
    category: data.category,
    annualCost: data.annualCost,
    currency: data.currency,
    vendorName: data.vendorName,
    vendorCountry: data.vendorCountry,
    department: data.department,
    urgency: data.urgency ?? Urgency.NORMAL,
    vendorRisk: data.vendorRisk ?? VendorRisk.LOW,
    processesPersonalData: data.processesPersonalData ?? false,
    hasDpa: data.hasDpa ?? false,
    transferOutsideEEA: data.transferOutsideEEA ?? false,
    securityQuestionnaire: data.securityQuestionnaire ?? false,
    dataCategories: data.dataCategories ?? [],
    annualCostEur,
  }
}

function requestCreateData(
  snapshot: ReturnType<typeof buildInputSnapshot>,
  requesterId: string,
  businessOwnerId: string,
  status: RequestStatus,
  decision?: Decision
) {
  return {
    title: snapshot.title,
    description: snapshot.description,
    type: snapshot.type,
    category: snapshot.category,
    status,
    decision,
    annualCost: snapshot.annualCost,
    currency: snapshot.currency,
    vendorName: snapshot.vendorName,
    vendorCountry: snapshot.vendorCountry,
    department: snapshot.department,
    urgency: snapshot.urgency,
    vendorRisk: snapshot.vendorRisk,
    processesPersonalData: snapshot.processesPersonalData,
    hasDpa: snapshot.hasDpa,
    transferOutsideEEA: snapshot.transferOutsideEEA,
    securityQuestionnaire: snapshot.securityQuestionnaire,
    dataCategories: snapshot.dataCategories,
    inputData: snapshot,
    requesterId,
    businessOwnerId,
  }
}

async function seedSampleRequests(
  requesterId: string,
  businessOwnerId: string
) {
  const alreadySeeded = await prisma.request.findFirst({
    where: { title: { startsWith: SAMPLE_PREFIX } },
  })
  if (alreadySeeded) {
    console.log('Sample requests already exist, skipping.')
    return
  }

  const procurementVersion = await prisma.policyVersion.findFirst({
    where: { policy: { name: 'Polityka akceptacji zakupów' }, status: 'PUBLISHED' },
    include: { policy: true, rules: true },
  })
  const dataSecurityVersion = await prisma.policyVersion.findFirst({
    where: { policy: { name: 'Polityka bezpieczeństwa danych' }, status: 'PUBLISHED' },
    include: { policy: true, rules: true },
  })
  const vendorRiskVersion = await prisma.policyVersion.findFirst({
    where: { policy: { name: 'Polityka zarządzania ryzykiem dostawców' }, status: 'PUBLISHED' },
    include: { policy: true, rules: true },
  })

  const saasRule = procurementVersion?.rules.find(r =>
    r.name.includes('SaaS powyżej 5 000')
  )
  const dpaRule = dataSecurityVersion?.rules.find(r => r.name.includes('DPA'))
  const criticalRule = vendorRiskVersion?.rules.find(r =>
    r.name.includes('krytycznego')
  )

  const policyVersionMeta = (pv: typeof procurementVersion) =>
    pv
      ? [
          {
            policyVersionId: pv.id,
            policyId: pv.policyId,
            policyName: pv.policy.name,
            version: pv.version,
          },
        ]
      : []

  // 1. DRAFT
  const draftSnapshot = buildInputSnapshot({
    title: `${SAMPLE_PREFIX} IT peripherals — draft`,
    description:
      'Draft request for keyboards and monitors. Not yet submitted for policy evaluation.',
    type: RequestType.HARDWARE_PURCHASE,
    category: RequestCategory.HARDWARE,
    annualCost: 2400,
    currency: Currency.EUR,
    vendorName: 'Office Supplies EU',
    vendorCountry: 'DE',
    department: Department.IT,
  })

  await prisma.request.create({
    data: requestCreateData(
      draftSnapshot,
      requesterId,
      businessOwnerId,
      RequestStatus.DRAFT
    ),
  })

  // 2. AUTO_APPROVED
  const approvedSnapshot = buildInputSnapshot({
    title: `${SAMPLE_PREFIX} Low-risk hardware purchase`,
    description:
      'Standard laptop refresh within budget. No personal data processed; auto-approved by the policy engine.',
    type: RequestType.HARDWARE_PURCHASE,
    category: RequestCategory.HARDWARE,
    annualCost: 3200,
    currency: Currency.EUR,
    vendorName: 'Dell Technologies',
    vendorCountry: 'IE',
    department: Department.IT,
    vendorRisk: VendorRisk.LOW,
  })

  const approvedRequest = await prisma.request.create({
    data: requestCreateData(
      approvedSnapshot,
      requesterId,
      businessOwnerId,
      RequestStatus.AUTO_APPROVED,
      Decision.APPROVED
    ),
  })

  await prisma.policyEvaluation.create({
    data: {
      requestId: approvedRequest.id,
      decision: Decision.APPROVED,
      inputSnapshot: approvedSnapshot,
      resultSnapshot: {
        reason:
          'Decyzja podjęta automatycznie - brak naruszeń polityk bezpieczeństwa i zakupowych.',
        missingFields: [],
        requiredRoles: [],
        riskPoints: 0,
        reasonCodes: [],
        nextSteps: [],
      },
      appliedPolicyVersions: [],
    },
  })

  // 3. IN_REVIEW
  const reviewSnapshot = buildInputSnapshot({
    title: `${SAMPLE_PREFIX} Enterprise SaaS — procurement review`,
    description:
      'Annual SaaS subscription above the 5,000 EUR threshold. Requires procurement review per policy.',
    type: RequestType.NEW_SOFTWARE,
    category: RequestCategory.SAAS,
    annualCost: 28000,
    currency: Currency.EUR,
    vendorName: 'CloudTools Inc.',
    vendorCountry: 'US',
    department: Department.IT,
    vendorRisk: VendorRisk.MEDIUM,
  })

  const reviewRequest = await prisma.request.create({
    data: requestCreateData(
      reviewSnapshot,
      requesterId,
      businessOwnerId,
      RequestStatus.IN_REVIEW,
      Decision.REQUIRES_REVIEW
    ),
  })

  const reviewEvaluation = await prisma.policyEvaluation.create({
    data: {
      requestId: reviewRequest.id,
      decision: Decision.REQUIRES_REVIEW,
      inputSnapshot: reviewSnapshot,
      resultSnapshot: {
        reason: 'Zakupy SaaS powyżej 5 000 EUR wymagają oceny.',
        missingFields: [],
        requiredRoles: ['PROCUREMENT'],
        riskPoints: 0,
        reasonCodes: [],
        nextSteps: ['Uzyskaj akceptację działu zakupów.'],
      },
      appliedPolicyVersions: policyVersionMeta(procurementVersion),
    },
  })

  if (saasRule && procurementVersion) {
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: reviewEvaluation.id,
        ruleId: saasRule.id,
        policyVersionId: procurementVersion.id,
        effectTriggered: 'REQUIRE_REVIEW',
        details: saasRule.reason,
      },
    })
  }

  // 4. NEEDS_INFORMATION
  const needsInfoSnapshot = buildInputSnapshot({
    title: `${SAMPLE_PREFIX} HR SaaS without DPA`,
    description:
      'HR platform processing employee data. DPA document is missing — request blocked until upload.',
    type: RequestType.NEW_SOFTWARE,
    category: RequestCategory.SAAS,
    annualCost: 8500,
    currency: Currency.EUR,
    vendorName: 'PeopleCloud HR',
    vendorCountry: 'NL',
    department: Department.HR,
    processesPersonalData: true,
    hasDpa: false,
    dataCategories: ['email', 'name', 'payroll'],
  })

  const needsInfoRequest = await prisma.request.create({
    data: requestCreateData(
      needsInfoSnapshot,
      requesterId,
      businessOwnerId,
      RequestStatus.NEEDS_INFORMATION,
      Decision.MISSING_INFORMATION
    ),
  })

  const needsInfoEvaluation = await prisma.policyEvaluation.create({
    data: {
      requestId: needsInfoRequest.id,
      decision: Decision.MISSING_INFORMATION,
      inputSnapshot: needsInfoSnapshot,
      resultSnapshot: {
        reason:
          'Przetwarzanie danych osobowych wymaga podpisania umowy powierzenia (DPA).',
        missingFields: ['dpaDocument'],
        requiredRoles: [],
        riskPoints: 0,
        reasonCodes: [],
        nextSteps: ['Dodaj dokument DPA jako załącznik typu DPA.'],
      },
      appliedPolicyVersions: policyVersionMeta(dataSecurityVersion),
    },
  })

  if (dpaRule && dataSecurityVersion) {
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: needsInfoEvaluation.id,
        ruleId: dpaRule.id,
        policyVersionId: dataSecurityVersion.id,
        effectTriggered: 'REQUIRE_FIELD',
        details: dpaRule.reason,
      },
    })
  }

  // 5. REJECTED
  const rejectedSnapshot = buildInputSnapshot({
    title: `${SAMPLE_PREFIX} Critical-risk vendor — blocked`,
    description:
      'Vendor classified as CRITICAL risk. Policy engine rejects cooperation automatically.',
    type: RequestType.NEW_VENDOR,
    category: RequestCategory.CONSULTING,
    annualCost: 15000,
    currency: Currency.EUR,
    vendorName: 'Risky Vendor Ltd.',
    vendorCountry: 'RU',
    department: Department.PROCUREMENT,
    vendorRisk: VendorRisk.CRITICAL,
  })

  const rejectedRequest = await prisma.request.create({
    data: requestCreateData(
      rejectedSnapshot,
      requesterId,
      businessOwnerId,
      RequestStatus.REJECTED,
      Decision.REJECTED
    ),
  })

  const rejectedEvaluation = await prisma.policyEvaluation.create({
    data: {
      requestId: rejectedRequest.id,
      decision: Decision.REJECTED,
      inputSnapshot: rejectedSnapshot,
      resultSnapshot: {
        reason: 'Współpraca z dostawcami o krytycznym ryzyku jest zablokowana.',
        missingFields: [],
        requiredRoles: [],
        riskPoints: 0,
        reasonCodes: [],
        nextSteps: [],
      },
      appliedPolicyVersions: policyVersionMeta(vendorRiskVersion),
    },
  })

  if (criticalRule && vendorRiskVersion) {
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: rejectedEvaluation.id,
        ruleId: criticalRule.id,
        policyVersionId: vendorRiskVersion.id,
        effectTriggered: 'REJECT',
        details: criticalRule.reason,
      },
    })
  }

  console.log('Seeded 5 sample requests (DRAFT, AUTO_APPROVED, IN_REVIEW, NEEDS_INFORMATION, REJECTED).')
}

async function main() {
  console.log('Seeding database...')

  const password = bcrypt.hashSync('test1234', 10)

  // Users
  const requester = await prisma.user.upsert({
    where: { email: 'requester@pc.com' },
    update: {},
    create: {
      email: 'requester@pc.com',
      name: 'John Requester',
      password: password,
      role: Role.REQUESTER,
    },
  })

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@pc.com' },
    update: {},
    create: {
      email: 'reviewer@pc.com',
      name: 'Jane Reviewer',
      password: password,
      role: Role.REVIEWER,
    },
  })

  const policyOwner = await prisma.user.upsert({
    where: { email: 'owner@pc.com' },
    update: {},
    create: {
      email: 'owner@pc.com',
      name: 'Alice Owner',
      password: password,
      role: Role.POLICY_OWNER,
    },
  })

  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@pc.com' },
    update: {},
    create: {
      email: 'auditor@pc.com',
      name: 'Bob Auditor',
      password: password,
      role: Role.AUDITOR,
    },
  })

  const approver = await prisma.user.upsert({
    where: { email: 'approver@pc.com' },
    update: {},
    create: {
      email: 'approver@pc.com',
      name: 'Charlie Approver',
      password: password,
      role: Role.POLICY_APPROVER,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pc.com' },
    update: {},
    create: {
      email: 'admin@pc.com',
      name: 'Admin Superuser',
      password: password,
      role: Role.ADMIN,
    },
  })

  // Policy & Rules
  const existingPolicy = await prisma.policy.findFirst({ where: { name: 'Polityka akceptacji zakupów' } })
  if (!existingPolicy) {
    await prisma.policy.create({
      data: {
        name: 'Polityka akceptacji zakupów',
        description: 'Główna polityka zakupowa organizacji.',
        domain: PolicyDomain.PROCUREMENT,
        status: 'PUBLISHED',
        ownerId: policyOwner.id,
        versions: {
          create: [
            {
              version: 1,
              status: 'PUBLISHED',
              authorId: policyOwner.id,
              description: 'Initial version',
              rules: {
                create: [
                  {
                    name: 'SaaS powyżej 5 000 wymaga oceny działu zakupów',
                    severity: RuleSeverity.WARNING,
                    condition: {
                      operator: 'AND',
                      conditions: [
                        { field: 'category', operator: 'equals', value: 'SAAS' },
                        { field: 'annualCostEur', operator: 'greater_than', value: 5000 }
                      ]
                    },
                    effect: [{ type: 'REQUIRE_REVIEW', role: 'PROCUREMENT' }],
                    reason: 'Zakupy SaaS powyżej 5 000 EUR wymagają oceny.',
                    priority: 10
                  },
                  {
                    name: 'Zakup awaryjny (EMERGENCY)',
                    severity: RuleSeverity.WARNING,
                    condition: {
                      field: 'urgency', operator: 'equals', value: 'EMERGENCY'
                    },
                    effect: [{ type: 'REQUIRE_REVIEW' }],
                    reason: 'Wnioski w trybie awaryjnym zawsze wymagają ręcznego przeglądu.',
                    priority: 30
                  },
                  {
                    name: 'Zakup o bardzo dużej wartości',
                    severity: RuleSeverity.WARNING,
                    condition: {
                      field: 'annualCostEur', operator: 'greater_or_equal', value: 50000
                    },
                    effect: [{ type: 'REQUIRE_REVIEW' }],
                    reason: 'Zakupy o wartości 50 000 EUR i wyższej wymagają specjalnej weryfikacji budżetowej.',
                    priority: 40
                  }
                ]
              }
            }
          ]
        }
      }
    })

    // DATA_SECURITY Policy
    await prisma.policy.create({
      data: {
        name: 'Polityka bezpieczeństwa danych',
        description: 'Zasady przetwarzania i ochrony danych.',
        domain: PolicyDomain.DATA_SECURITY,
        status: 'PUBLISHED',
        ownerId: policyOwner.id,
        versions: {
          create: [
            {
              version: 1,
              status: 'PUBLISHED',
              authorId: policyOwner.id,
              description: 'Initial version',
              rules: {
                create: [
                  {
                    name: 'Wymagane DPA przy danych osobowych',
                    severity: RuleSeverity.WARNING,
                    condition: {
                      operator: 'AND',
                      conditions: [
                        { field: 'processesPersonalData', operator: 'equals', value: true },
                        { field: 'hasDpa', operator: 'equals', value: false }
                      ]
                    },
                    effect: [{ type: 'REQUIRE_FIELD', field: 'dpaDocument' }],
                    reason: 'Przetwarzanie danych osobowych wymaga podpisania umowy powierzenia (DPA).',
                    priority: 20
                  }
                ]
              }
            }
          ]
        }
      }
    })

    // VENDOR_RISK Policy
    await prisma.policy.create({
      data: {
        name: 'Polityka zarządzania ryzykiem dostawców',
        description: 'Ocena ryzyka dostawców i blokady operacyjne.',
        domain: PolicyDomain.VENDOR_RISK,
        status: 'PUBLISHED',
        ownerId: policyOwner.id,
        versions: {
          create: [
            {
              version: 1,
              status: 'PUBLISHED',
              authorId: policyOwner.id,
              description: 'Initial version',
              rules: {
                create: [
                  {
                    name: 'Dostawca wysokiego ryzyka',
                    severity: RuleSeverity.WARNING,
                    condition: {
                      field: 'vendorRisk', operator: 'equals', value: 'HIGH'
                    },
                    effect: [{ type: 'REQUIRE_REVIEW', role: 'SECURITY' }],
                    reason: 'Współpraca z dostawcami o wysokim ryzyku wymaga przeglądu.',
                    priority: 100
                  },
                  {
                    name: 'Dostawca krytycznego ryzyka',
                    severity: RuleSeverity.BLOCKER,
                    condition: {
                      field: 'vendorRisk', operator: 'equals', value: 'CRITICAL'
                    },
                    effect: [{ type: 'REJECT' }],
                    reason: 'Współpraca z dostawcami o krytycznym ryzyku jest zablokowana.',
                    priority: 110
                  }
                ]
              }
            }
          ]
        }
      }
    })
  }

  await seedSampleRequests(requester.id, policyOwner.id)

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
