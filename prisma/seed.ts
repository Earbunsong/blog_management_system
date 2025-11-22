import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create categories
  const categories = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology, programming, and software development',
    },
    {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Web development tutorials, tips, and best practices',
    },
    {
      name: 'JavaScript',
      slug: 'javascript',
      description: 'JavaScript tutorials, frameworks, and libraries',
    },
    {
      name: 'Next.js',
      slug: 'nextjs',
      description: 'Next.js tutorials and guides',
    },
    {
      name: 'React',
      slug: 'react',
      description: 'React tutorials and component libraries',
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      description: 'TypeScript guides and best practices',
    },
    {
      name: 'DevOps',
      slug: 'devops',
      description: 'DevOps, CI/CD, and deployment strategies',
    },
    {
      name: 'Database',
      slug: 'database',
      description: 'Database design, SQL, and NoSQL databases',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    console.log(`Created category: ${category.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
