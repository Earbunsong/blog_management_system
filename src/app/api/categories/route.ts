import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSlug } from '@/utils/helpers'
import { requireAdmin, unauthorizedResponse } from '@/lib/authorization'

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category (Admin only)
export async function POST(req: NextRequest) {
  try {
    // Check authorization with database validation (best practice)
    const authResult = await requireAdmin()

    if (!authResult.authorized) {
      return unauthorizedResponse(authResult.error)
    }

    const body = await req.json()
    const { name, description, image, parentId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const slug = generateSlug(name)

    // Check if category already exists
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
