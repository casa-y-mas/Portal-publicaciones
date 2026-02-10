import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.scheduledPost.deleteMany()
  await prisma.socialAccount.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: 'Maria Garcia',
        email: 'maria@inmosocial.com',
        role: 'editor',
        status: 'active',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Juan Martinez',
        email: 'juan@inmosocial.com',
        role: 'editor',
        status: 'active',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carlos Lopez',
        email: 'carlos@inmosocial.com',
        role: 'supervisor',
        status: 'active',
      },
    }),
  ])

  const projects = await prisma.$transaction([
    prisma.project.create({
      data: {
        name: 'Residencial Aurora',
        color: '#3B82F6',
        description: 'Luxury residential complex with amenities',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Condominio Miraflores',
        color: '#8B5CF6',
        description: 'Modern condominium in upscale neighborhood',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Torres del Sol',
        color: '#EC4899',
        description: 'Premier commercial and residential towers',
      },
    }),
  ])

  const projectByName = Object.fromEntries(projects.map((p) => [p.name, p]))
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]))

  await prisma.socialAccount.createMany({
    data: [
      {
        platform: 'instagram',
        username: '@residencialaurora',
        type: 'Business',
        status: 'connected',
        expiresAt: new Date('2026-05-15T00:00:00.000Z'),
        projectId: projectByName['Residencial Aurora'].id,
      },
      {
        platform: 'facebook',
        username: 'Torres del Sol',
        type: 'Page',
        status: 'token_expiring',
        expiresAt: new Date('2026-02-10T00:00:00.000Z'),
        projectId: projectByName['Torres del Sol'].id,
      },
    ],
  })

  await prisma.scheduledPost.createMany({
    data: [
      {
        title: 'Lanzamiento de Torres del Sol',
        caption: 'Conoce nuestro nuevo proyecto residencial...',
        contentType: 'reel',
        status: 'scheduled',
        publishAt: new Date('2026-02-11T15:00:00.000Z'),
        platformsJson: ['Instagram', 'Facebook'],
        recurrenceJson: { enabled: true, type: 'weekly', endType: 'date', endDate: '2026-04-08' },
        thumbnail: 'building',
        projectId: projectByName['Torres del Sol'].id,
        creatorId: userByEmail['maria@inmosocial.com'].id,
        approverId: userByEmail['carlos@inmosocial.com'].id,
      },
      {
        title: 'Tour virtual Miraflores',
        caption: 'Descubre las amenidades de nuestro condominio...',
        contentType: 'post',
        status: 'pending_approval',
        publishAt: new Date('2026-02-12T19:30:00.000Z'),
        platformsJson: ['Instagram'],
        thumbnail: 'camera',
        projectId: projectByName['Condominio Miraflores'].id,
        creatorId: userByEmail['juan@inmosocial.com'].id,
      },
      {
        title: 'Testimonios de clientes',
        caption: 'Escucha a nuestros clientes satisfechos...',
        contentType: 'carousel',
        status: 'published',
        publishAt: new Date('2026-02-05T21:00:00.000Z'),
        platformsJson: ['Facebook', 'Instagram'],
        thumbnail: 'star',
        projectId: projectByName['Residencial Aurora'].id,
        creatorId: userByEmail['juan@inmosocial.com'].id,
        approverId: userByEmail['carlos@inmosocial.com'].id,
      },
    ],
  })

  const [userCount, projectCount, postCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.scheduledPost.count(),
  ])

  console.log('Seed complete:', { userCount, projectCount, postCount })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
