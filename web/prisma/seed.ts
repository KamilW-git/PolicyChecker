import { PrismaClient, Role, PolicyDomain, RuleSeverity } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Users
  const requester = await prisma.user.upsert({
    where: { email: 'requester@example.com' },
    update: {},
    create: {
      email: 'requester@example.com',
      name: 'John Requester',
      role: Role.REQUESTER,
    },
  })

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      name: 'Jane Reviewer',
      role: Role.REVIEWER,
    },
  })

  const policyOwner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'Alice Owner',
      role: Role.POLICY_OWNER,
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
