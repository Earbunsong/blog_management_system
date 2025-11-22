import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { postSchema } from '@/lib/validations/post'
import { generateSlug, calculateReadingTime } from '@/utils/helpers'
import {
  requireAuthor,
  unauthorizedResponse,
  forbiddenResponse,
  canModifyResource,
} from '@/lib/authorization'

// GET /api/posts/[id] - Get single post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
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
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.post.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update post
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization with database validation
    const authResult = await requireAuthor()

    if (!authResult.authorized) {
      return unauthorizedResponse(authResult.error)
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user can modify this post (author, editor, or admin)
    if (!canModifyResource(post.authorId, authResult.user!.id, authResult.user!.role)) {
      return forbiddenResponse('You do not have permission to modify this post')
    }

    const body = await req.json()
    const validatedData = postSchema.parse(body)

    // Update slug if title changed
    let slug = post.slug
    if (validatedData.title !== post.title) {
      slug = generateSlug(validatedData.title)
      const existingPost = await prisma.post.findUnique({ where: { slug } })
      if (existingPost && existingPost.id !== params.id) {
        slug = `${slug}-${Date.now()}`
      }
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(validatedData.content)

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
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
        categories: {
          deleteMany: {},
          create: validatedData.categoryIds.map((categoryId) => ({
            category: {
              connect: { id: categoryId },
            },
          })),
        },
        tags: {
          deleteMany: {},
          create: await Promise.all(
            validatedData.tagNames.map(async (tagName) => {
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

    return NextResponse.json(updatedPost)
  } catch (error: any) {
    console.error('Error updating post:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization with database validation
    const authResult = await requireAuthor()

    if (!authResult.authorized) {
      return unauthorizedResponse(authResult.error)
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user can modify this post (author, editor, or admin)
    if (!canModifyResource(post.authorId, authResult.user!.id, authResult.user!.role)) {
      return forbiddenResponse('You do not have permission to delete this post')
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
