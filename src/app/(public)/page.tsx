'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, User, Eye, Heart, MessageSquare } from 'lucide-react'
import Image from 'next/image'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage: string | null
  publishedAt: string
  readingTime: number
  viewCount: number
  author: {
    username: string
    firstName: string | null
    lastName: string | null
  }
  categories: any[]
  _count: {
    comments: number
    likes: number
  }
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=PUBLISHED&limit=10')
      const data = await response.json()
      setPosts(data.data)
      if (data.data.length > 0) {
        setFeaturedPost(data.data[0])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section - Featured Post */}
      {featuredPost && (
        <div className="mb-16">
          <Link href={`/posts/${featuredPost.slug}`}>
            <div className="relative h-96 rounded-2xl overflow-hidden group cursor-pointer">
              {featuredPost.featuredImage ? (
                <img
                  src={featuredPost.featuredImage}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="max-w-3xl">
                  <span className="inline-block px-3 py-1 bg-blue-600 rounded-full text-sm font-medium mb-4">
                    Featured
                  </span>
                  <h1 className="text-4xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                    {featuredPost.title}
                  </h1>
                  {featuredPost.excerpt && (
                    <p className="text-lg text-gray-200 mb-4 line-clamp-2">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <div className="flex items-center space-x-6 text-sm">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {getAuthorName(featuredPost.author)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(featuredPost.publishedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      {featuredPost.viewCount} views
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Latest Posts Grid */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(1).map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link href={`/posts/${post.slug}`}>
                <div className="relative h-48 bg-gray-200">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                  )}
                </div>
                <div className="p-6">
                  {post.categories.length > 0 && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-3">
                      {post.categories[0].category.name}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {getAuthorName(post.author)}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {post._count.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
          Get the latest posts delivered right to your inbox. Join thousands of readers who never miss an update.
        </p>
        <form className="max-w-md mx-auto flex gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  )
}
