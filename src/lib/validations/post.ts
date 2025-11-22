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
