'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, User, Eye, Clock, ArrowLeft, Heart, Bookmark } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  featuredImage: string | null
  publishedAt: string
  readingTime: number
  viewCount: number
  author: {
    username: string
    firstName: string | null
    lastName: string | null
    bio: string | null
    avatar: string | null
  }
  categories: any[]
  tags: any[]
  _count: {
    comments: number
    likes: number
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.slug) {
      fetchPost()
    }
  }, [params.slug])

  const fetchPost = async () => {
    try {
      // First, get all posts to find the one with matching slug
      const response = await fetch(`/api/posts?status=PUBLISHED&limit=100`)
      const data = await response.json()

      const foundPost = data.data.find((p: any) => p.slug === params.slug)

      if (!foundPost) {
        setError('Post not found')
        setLoading(false)
        return
      }

      // Fetch full post details
      const postResponse = await fetch(`/api/posts/${foundPost.id}`)
      const postData = await postResponse.json()

      setPost(postData)
    } catch (error) {
      console.error('Error fetching post:', error)
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const getAuthorName = (author: Post['author']) => {
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`
    }
    return author.username
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The post you are looking for does not exist.'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Link>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Categories */}
      {post.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map((cat) => (
            <Link
              key={cat.category.id}
              href={`/categories/${cat.category.slug}`}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full hover:bg-blue-200 transition-colors"
            >
              {cat.category.name}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        {post.title}
      </h1>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
        <div className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          <Link href="#" className="hover:text-blue-600">
            {getAuthorName(post.author)}
          </Link>
        </div>
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          {new Date(post.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          {post.readingTime} min read
        </div>
        <div className="flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          {post.viewCount} views
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Heart className="w-5 h-5" />
          <span>{post._count.likes}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Bookmark className="w-5 h-5" />
          <span>Save</span>
        </button>
      </div>

      {/* Content */}
      <div
        className="prose prose-lg max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.tag.id}
                href={`/tags/${tag.tag.slug}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                #{tag.tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Author Bio */}
      <div className="bg-gray-50 rounded-xl p-6 mb-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
            {getAuthorName(post.author).charAt(0)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {getAuthorName(post.author)}
            </h4>
            <p className="text-gray-600">
              {post.author.bio || 'No bio available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Comments Section Placeholder */}
      <div className="border-t pt-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Comments ({post._count.comments})
        </h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
          Comments feature coming soon...
        </div>
      </div>
    </article>
  )
}
