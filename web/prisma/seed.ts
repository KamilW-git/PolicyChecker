import { PrismaClient, Role, PolicyDomain, RuleSeverity } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
