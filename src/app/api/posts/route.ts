import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { postSchema } from '@/lib/validations/post'
import { generateSlug, calculateReadingTime } from '@/utils/helpers'
import { requireAuthor, unauthorizedResponse } from '@/lib/authorization'

// GET /api/posts - Get all posts with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const categorySlug = searchParams.get('category')
    const tagSlug = searchParams.get('tag')
    const authorId = searchParams.get('authorId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    } else {
      where.status = 'PUBLISHED' // Default to published posts for public
    }

    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      }
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      }
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get posts with relations
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
export async function POST(req: NextRequest) {
  try {
    // Check authorization (Author, Editor, or Admin can create posts)
    const authResult = await requireAuthor()

    if (!authResult.authorized) {
      return unauthorizedResponse(authResult.error)
    }

    const body = await req.json()
    const validatedData = postSchema.parse(body)

    // Generate unique slug
    let slug = generateSlug(validatedData.title)
    const existingPost = await prisma.post.findUnique({ where: { slug } })
    if (existingPost) {
      slug = `${slug}-${Date.now()}`
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(validatedData.content)

    // Create post with categories and tags
    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        slug,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        featuredImage: validatedData.featuredImage,
        readingTime,
        seoTitle: validatedData.seoTitle,
        seoDescription: validatedData.seoDescription,
        seoKeywords: validatedData.seoKeywords,
        authorId: authResult.user!.id,
        categories: {
          create: validatedData.categoryIds.map((categoryId) => ({
            category: {
              connect: { id: categoryId },
            },
          })),
        },
        tags: {
          create: await Promise.all(
            validatedData.tagNames.map(async (tagName) => {
              // Find or create tag
              const tag = await prisma.tag.upsert({
                where: { slug: generateSlug(tagName) },
                create: {
                  name: tagName,
                  slug: generateSlug(tagName),
                },
                update: {},
              })
              return { tagId: tag.id }
            })
          ),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
