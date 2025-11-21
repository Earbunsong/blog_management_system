# Blog Management System - Step-by-Step Implementation Guide

## Project Overview
Building a full-stack Blog Management System using Next.js 14 (App Router), TypeScript, PostgreSQL, and Prisma ORM.

---

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Basic knowledge of React, Next.js, TypeScript

---

# PHASE 1: PROJECT SETUP AND FOUNDATION

## Step 1: Initialize Next.js Project

### 1.1 Create Next.js Application
```bash
npx create-next-app@latest blog-management-system
```

**Configuration Options:**
- ✅ Would you like to use TypeScript? → **Yes**
- ✅ Would you like to use ESLint? → **Yes**
- ✅ Would you like to use Tailwind CSS? → **Yes**
- ✅ Would you like to use `src/` directory? → **Yes**
- ✅ Would you like to use App Router? → **Yes**
- ❌ Would you like to customize the default import alias? → **No**

### 1.2 Navigate to Project Directory
```bash
cd blog-management-system
```

### 1.3 Verify Installation
```bash
npm run dev
```
Open http://localhost:3000 to verify the app is running.

**Success Criteria:**
- ✅ Next.js app runs without errors
- ✅ Default Next.js page displays
- ✅ TypeScript is configured

---

## Step 2: Install Core Dependencies

### 2.1 Install Prisma and Database Tools
```bash
npm install @prisma/client
npm install -D prisma
```

### 2.2 Install Authentication
```bash
npm install next-auth@latest
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 2.3 Install Form Handling and Validation
```bash
npm install react-hook-form
npm install @hookform/resolvers
npm install zod
```

### 2.4 Install UI Components and Icons
```bash
npm install lucide-react
npm install react-hot-toast
npm install date-fns
```

### 2.5 Install Rich Text Editor
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-image
```

### 2.6 Install Image Upload (Cloudinary)
```bash
npm install cloudinary
npm install next-cloudinary
```

### 2.7 Install Additional Utilities
```bash
npm install slugify
npm install sharp
```

**Success Criteria:**
- ✅ All packages installed without errors
- ✅ package.json updated with dependencies
- ✅ No vulnerability warnings

---

## Step 3: Setup PostgreSQL Database

### 3.1 Create Database
```bash
# Using PostgreSQL command line
psql -U postgres

# Inside psql console
CREATE DATABASE blog_management;

# Exit psql
\q
```

**Alternative: Using GUI Tool (pgAdmin, DBeaver)**
- Create new database named: `blog_management`
- Owner: postgres (or your user)
- Encoding: UTF8

### 3.2 Verify Database Connection
Test connection with your credentials:
```bash
psql -U postgres -d blog_management -c "SELECT version();"
```

**Success Criteria:**
- ✅ Database created successfully
- ✅ Can connect to database
- ✅ PostgreSQL version displays

---

## Step 4: Initialize and Configure Prisma

### 4.1 Initialize Prisma
```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` file
- `.env` file with DATABASE_URL

### 4.2 Configure Environment Variables

**Update `.env` file:**
```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/blog_management?schema=public"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (leave empty for now, will add later)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""

# Email (leave empty for now, will add later)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="My Blog"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copy the output and paste it in `.env` as NEXTAUTH_SECRET value.

### 4.3 Create `.env.example` for Reference
```bash
cp .env .env.example
```

Edit `.env.example` and remove actual values (keep only keys).

**Success Criteria:**
- ✅ `.env` file configured with database credentials
- ✅ NEXTAUTH_SECRET generated
- ✅ `.env.example` created for team reference

---

## Step 5: Define Database Schema

### 5.1 Update `prisma/schema.prisma`

**Replace the content with:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  READER
  AUTHOR
  EDITOR
  ADMIN
}

enum PostStatus {
  DRAFT
  PENDING
  PUBLISHED
  ARCHIVED
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
}

// Models
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  password      String
  firstName     String?
  lastName      String?
  avatar        String?
  bio           String?   @db.Text
  role          UserRole  @default(READER)
  emailVerified Boolean   @default(false)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  bookmarks     Bookmark[]
  media         Media[]

  @@map("users")
}

model Post {
  id             String      @id @default(uuid())
  title          String
  slug           String      @unique
  content        String      @db.Text
  excerpt        String?
  featuredImage  String?
  status         PostStatus  @default(DRAFT)
  publishedAt    DateTime?
  scheduledFor   DateTime?
  viewCount      Int         @default(0)
  readingTime    Int?        // in minutes
  seoTitle       String?
  seoDescription String?
  seoKeywords    String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  // Foreign Keys
  authorId       String
  author         User        @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // Relations
  categories     PostCategory[]
  tags           PostTag[]
  comments       Comment[]
  likes          Like[]
  bookmarks      Bookmark[]

  @@index([slug])
  @@index([status])
  @@index([authorId])
  @@index([publishedAt])
  @@map("posts")
}

model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  image       String?
  parentId    String?
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  posts       PostCategory[]

  @@index([slug])
  @@map("categories")
}

model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  posts     PostTag[]

  @@index([slug])
  @@map("tags")
}

model PostCategory {
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId     String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  categoryId String

  @@id([postId, categoryId])
  @@map("post_categories")
}

model PostTag {
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  String

  @@id([postId, tagId])
  @@map("post_tags")
}

model Comment {
  id        String        @id @default(uuid())
  content   String        @db.Text
  status    CommentStatus @default(PENDING)
  likeCount Int           @default(0)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  // Foreign Keys
  postId    String
  post      Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    Comment?      @relation("CommentToComment", fields: [parentId], references: [id], onDelete: Cascade)
  
  // Relations
  replies   Comment[]     @relation("CommentToComment")

  @@index([postId])
  @@index([authorId])
  @@index([status])
  @@map("comments")
}

model Like {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  // Foreign Keys
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
  @@map("likes")
}

model Bookmark {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  // Foreign Keys
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
  @@map("bookmarks")
}

model Media {
  id           String   @id @default(uuid())
  fileName     String
  originalName String
  url          String
  mimeType     String?
  size         Int?     // in bytes
  createdAt    DateTime @default(now())

  // Foreign Keys
  uploadedBy   String
  uploader     User     @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)

  @@index([uploadedBy])
  @@map("media")
}

model Subscription {
  id        String   @id @default(uuid())
  email     String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("subscriptions")
}
```

**Success Criteria:**
- ✅ Schema file has no syntax errors
- ✅ All models defined with proper relationships
- ✅ Enums defined for UserRole, PostStatus, CommentStatus

---

## Step 6: Run Database Migrations

### 6.1 Create Initial Migration
```bash
npx prisma migrate dev --name init
```

This will:
- Create migration files
- Apply migrations to database
- Generate Prisma Client

### 6.2 Generate Prisma Client (if not auto-generated)
```bash
npx prisma generate
```

### 6.3 View Database in Prisma Studio (Optional)
```bash
npx prisma studio
```

Opens at http://localhost:5555 - you can view/edit data here.

**Success Criteria:**
- ✅ Migration completed successfully
- ✅ All tables created in PostgreSQL
- ✅ Prisma Client generated
- ✅ Can open Prisma Studio

---

## Step 7: Setup Prisma Client Instance

### 7.1 Create Prisma Client Singleton

**Create file: `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

**Why this approach?**
- Prevents multiple Prisma Client instances in development (hot reload)
- Single instance in production
- Logs queries in development

**Success Criteria:**
- ✅ `src/lib/prisma.ts` created
- ✅ No TypeScript errors

---

## Step 8: Create Project Folder Structure

### 8.1 Create Directory Structure

```bash
# Create directories
mkdir -p src/app/api/auth/[...nextauth]
mkdir -p src/app/api/posts
mkdir -p src/app/api/users
mkdir -p src/app/api/categories
mkdir -p src/app/api/tags
mkdir -p src/app/api/comments
mkdir -p src/app/api/media
mkdir -p src/app/api/search

mkdir -p src/app/(public)
mkdir -p src/app/(auth)/login
mkdir -p src/app/(auth)/register
mkdir -p src/app/(dashboard)/dashboard
mkdir -p src/app/(admin)/admin

mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/posts
mkdir -p src/components/comments
mkdir -p src/components/editor
mkdir -p src/components/admin

mkdir -p src/lib/validations
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/utils
```

### 8.2 Verify Structure

Your structure should look like:

```
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   └── dashboard/
│   ├── (admin)/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   ├── posts/
│   │   ├── users/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── comments/
│   │   ├── media/
│   │   └── search/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── posts/
│   ├── comments/
│   ├── editor/
│   └── admin/
├── lib/
│   ├── prisma.ts
│   └── validations/
├── hooks/
├── types/
└── utils/
```

**Success Criteria:**
- ✅ All directories created
- ✅ Structure matches the plan

---

## Step 9: Create Utility Files

### 9.1 Create Type Definitions

**Create file: `src/types/index.ts`**

```typescript
import { Post, User, Comment, Category, Tag, UserRole, PostStatus } from '@prisma/client'

// Extended types with relations
export type PostWithAuthor = Post & {
  author: User
  categories: (Category)[]
  tags: (Tag)[]
  _count: {
    comments: number
    likes: number
  }
}

export type CommentWithAuthor = Comment & {
  author: User
  replies?: CommentWithAuthor[]
}

export type UserWithStats = User & {
  _count: {
    posts: number
    comments: number
  }
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
}

export interface PostFormData {
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  categoryIds: string[]
  tagNames: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export { UserRole, PostStatus }
```

### 9.2 Create Validation Schemas

**Create file: `src/lib/validations/auth.ts`**

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
```

**Create file: `src/lib/validations/post.ts`**

```typescript
import { z } from 'zod'

export const postSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  categoryIds: z.array(z.string()).min(1, 'At least one category is required'),
  tagNames: z.array(z.string()),
  seoTitle: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description must be less than 160 characters').optional(),
  seoKeywords: z.string().optional(),
})

export type PostInput = z.infer<typeof postSchema>
```

### 9.3 Create Utility Functions

**Create file: `src/utils/helpers.ts`**

```typescript
import slugify from 'slugify'

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  return readingTime
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return '?'
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase()
}
```

**Success Criteria:**
- ✅ All utility files created
- ✅ No TypeScript errors
- ✅ Validations compile correctly

---

## Step 10: Setup NextAuth.js Authentication

### 10.1 Create Auth Configuration

**Create file: `src/lib/auth.ts`**

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
```

### 10.2 Install NextAuth Prisma Adapter
```bash
npm install @next-auth/prisma-adapter
```

### 10.3 Create NextAuth API Route

**Create file: `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### 10.4 Extend NextAuth Types

**Create file: `src/types/next-auth.d.ts`**

```typescript
import { UserRole } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    username: string
    role: UserRole
    avatar?: string | null
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    username: string
  }
}
```

**Success Criteria:**
- ✅ NextAuth configured with credentials provider
- ✅ API route created
- ✅ Types extended properly
- ✅ No TypeScript errors

---

## Step 11: Create Authentication Middleware

### 11.1 Create Middleware File

**Create file: `src/middleware.ts`**

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                       req.nextUrl.pathname.startsWith('/register')

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
```

**Success Criteria:**
- ✅ Middleware protects routes
- ✅ Redirects work correctly
- ✅ Auth pages redirect logged-in users

---

## CHECKPOINT 1: Verify Foundation Setup

### Run These Tests:

1. **Start Development Server:**
```bash
npm run dev
```

2. **Verify Prisma Connection:**
```bash
npx prisma studio
```

3. **Check for Errors:**
- No TypeScript errors
- No console errors
- Server runs on http://localhost:3000

### What You Should Have Now:
- ✅ Next.js app running
- ✅ PostgreSQL database with schema
- ✅ Prisma Client working
- ✅ NextAuth configured
- ✅ Project structure in place
- ✅ Utilities and types defined

---

# PHASE 2: BUILD AUTHENTICATION SYSTEM

## Step 12: Create Register API Endpoint

### 12.1 Create Registration API

**Create file: `src/app/api/auth/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }
      if (existingUser.username === validatedData.username) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: 'READER', // Default role
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Success Criteria:**
- ✅ API endpoint created
- ✅ Password hashing works
- ✅ Validation works
- ✅ Duplicate checking works

---

## Step 13: Create Login Page UI

### 13.1 Create Login Page

**Create file: `src/app/(auth)/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { loginSchema, LoginInput } from '@/lib/validations/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Logged in successfully!')
        router.push(from)
        router.refresh()
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### 13.2 Create Register Page

**Create file: `src/app/(auth)/register/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { registerSchema, RegisterInput } from '@/lib/validations/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Account created successfully! Please login.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('username')}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name (Optional)
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('firstName')}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name (Optional)
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('lastName')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### 13.3 Add Toaster to Root Layout

**Update file: `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Blog Management System',
  description: 'A modern blog platform built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
```

**Success Criteria:**
- ✅ Login page displays correctly
- ✅ Register page displays correctly
- ✅ Form validation works
- ✅ Can register new user
- ✅ Can login with credentials
- ✅ Toast notifications work

---

## CHECKPOINT 2: Test Authentication

### Test These Features:

1. **Register New User:**
   - Go to http://localhost:3000/register
   - Fill in the form
   - Submit
   - Should redirect to login

2. **Login:**
   - Go to http://localhost:3000/login
   - Use registered credentials
   - Should redirect to /dashboard (will show 404 for now, that's ok)

3. **Verify in Database:**
```bash
npx prisma studio
```
   - Check Users table
   - User should exist with hashed password

### What You Should Have Now:
- ✅ Working registration
- ✅ Working login
- ✅ Password hashing
- ✅ Form validation
- ✅ Protected routes (middleware)

---

# PHASE 3: BUILD BLOG POST SYSTEM

## Step 14: Create Post API Endpoints

### 14.1 Create Post Creation Endpoint

**Create file: `src/app/api/posts/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { postSchema } from '@/lib/validations/post'
import { generateSlug, calculateReadingTime } from '@/utils/helpers'

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
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        authorId: session.user.id,
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
```

### 14.2 Create Single Post Endpoint

**Create file: `src/app/api/posts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { postSchema } from '@/lib/validations/post'
import { generateSlug, calculateReadingTime } from '@/utils/helpers'

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
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user is author or admin
    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user is author or admin
    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
```

**Success Criteria:**
- ✅ Can create posts via API
- ✅ Can fetch posts with pagination
- ✅ Can update posts
- ✅ Can delete posts
- ✅ Authorization checks work

---

## Step 15: Create Category and Tag APIs

### 15.1 Create Category API

**Create file: `src/app/api/categories/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { generateSlug } from '@/utils/helpers'

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
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
```

### 15.2 Create Tag API

**Create file: `src/app/api/tags/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/tags - Get all tags
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
```

**Success Criteria:**
- ✅ Can fetch categories
- ✅ Can create categories (admin only)
- ✅ Can fetch tags
- ✅ Slug generation works

---

## NEXT STEPS OVERVIEW

The implementation continues with:

**Phase 4: Build Dashboard UI**
- Step 16-20: Create dashboard layout, post editor, post list

**Phase 5: Build Public Pages**
- Step 21-25: Homepage, post detail page, category pages

**Phase 6: Add Comments System**
- Step 26-28: Comment API, comment UI

**Phase 7: Add Advanced Features**
- Step 29-35: Search, likes, bookmarks, media upload

**Phase 8: Admin Features**
- Step 36-40: Admin dashboard, user management, analytics

**Phase 9: Testing & Deployment**
- Step 41-45: Testing, optimization, deployment

---

## Quick Reference Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Prisma commands
npx prisma studio          # Open database viewer
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Create and apply migration
npx prisma migrate reset   # Reset database
npx prisma db seed         # Seed database

# Database
psql -U postgres -d blog_management  # Connect to database
```

---

## Common Issues and Solutions

### Issue: Can't connect to database
**Solution:** Check DATABASE_URL in `.env`, ensure PostgreSQL is running

### Issue: Prisma Client not found
**Solution:** Run `npx prisma generate`

### Issue: TypeScript errors
**Solution:** Restart TypeScript server, check imports

### Issue: Authentication not working
**Solution:** Check NEXTAUTH_SECRET is set, clear cookies

---

## What's Implemented So Far

✅ **Foundation:**
- Project setup
- Database schema
- Prisma configuration
- Authentication system

✅ **Features:**
- User registration & login
- Post CRUD API
- Category & Tag APIs
- Protected routes

⏳ **Next To Build:**
- Dashboard UI
- Post editor
- Public pages
- Comments
- Search
- Admin features

---

**Continue to next phase when ready!**

This guide will be continuously updated as you progress through each phase.
