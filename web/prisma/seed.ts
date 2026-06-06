import { PrismaClient, Role, PolicyDomain, RuleSeverity } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Users
  const requester = await prisma.user.upsert({
    where: { email: 'requester@pc.com' },
    update: {},
    create: {
      email: 'requester@pc.com',
      name: 'John Requester',
      password: 'requester123',
      role: Role.REQUESTER,
    },
  })

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@pc.com' },
    update: {},
    create: {
      email: 'reviewer@pc.com',
      name: 'Jane Reviewer',
      password: 'reviewer123',
      role: Role.REVIEWER,
    },
  })

  const policyOwner = await prisma.user.upsert({
    where: { email: 'owner@pc.com' },
    update: {},
    create: {
      email: 'owner@pc.com',
      name: 'Alice Owner',
      password: 'owner123',
      role: Role.POLICY_OWNER,
    },
  })

  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@pc.com' },
    update: {},
    create: {
      email: 'auditor@pc.com',
      name: 'Bob Auditor',
      password: 'auditor123',
      role: Role.AUDITOR,
    },
  })

  const approver = await prisma.user.upsert({
    where: { email: 'approver@pc.com' },
    update: {},
    create: {
      email: 'approver@pc.com',
      name: 'Charlie Approver',
      password: 'approver123',
      role: Role.POLICY_APPROVER,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pc.com' },
    update: {},
    create: {
      email: 'admin@pc.com',
      name: 'Admin Superuser',
      password: 'admin123',
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
                    name: 'SaaS powyżej 5 000 EUR wymaga oceny działu zakupów',
                    severity: RuleSeverity.WARNING,
                    condition: {
                      operator: 'AND',
                      conditions: [
                        { field: 'category', operator: 'equals', value: 'SAAS' },
                        { field: 'annualCost', operator: 'greater_than', value: 5000 }
                      ]
                    },
                    effect: [{ type: 'REQUIRE_REVIEW', role: 'PROCUREMENT' }],
                    reason: 'Zakupy SaaS powyżej 5 000 EUR wymagają oceny działu zakupów.',
                    priority: 10
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
