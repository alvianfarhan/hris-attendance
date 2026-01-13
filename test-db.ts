import { prisma } from './lib/prisma'

async function main() {
  const employees = await prisma.employee.findMany()
  console.log('Employees:', employees)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })