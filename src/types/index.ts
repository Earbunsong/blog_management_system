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
