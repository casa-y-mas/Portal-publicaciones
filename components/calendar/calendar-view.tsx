'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scheduledPosts } from '@/lib/mock-data'
import { PostDetailModal } from '@/components/modals/post-detail-modal'
import { getRecurrenceDates } from '@/lib/recurrence-utils'

interface CalendarViewProps {
  view: 'month' | 'week'
  filters: {
    platform: string
    status: string
    project: string
  }
}

export function CalendarView({ view, filters }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 6))
  const [selectedPost, setSelectedPost] = useState<typeof scheduledPosts[0] | null>(null)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  const getPostsForDate = (day: number) => {
    const allPosts: typeof scheduledPosts[0][] = []
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

    scheduledPosts.forEach(post => {
      if (post.recurrence?.enabled) {
        // Get all recurrence dates for this post
        const recurrenceDates = getRecurrenceDates(post.publishAt, post.recurrence, 100)
        // Check if any recurrence date matches this day
        recurrenceDates.forEach(date => {
          if (
            date.getDate() === day &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear()
          ) {
            allPosts.push(post)
          }
        })
      } else {
        // Regular post - check if it matches this day
        const postDate = new Date(post.publishAt)
        if (
          postDate.getDate() === day &&
          postDate.getMonth() === currentDate.getMonth() &&
          postDate.getFullYear() === currentDate.getFullYear()
        ) {
          allPosts.push(post)
        }
      }
    })

    return allPosts
  }

  const days = Array.from({ length: firstDay }, () => null)
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      Instagram: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
      Facebook: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      TikTok: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      YouTube: 'bg-red-500/20 text-red-700 dark:text-red-300',
    }
    return colors[platform] || 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
              }
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
              }
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const postsForDay = day ? getPostsForDate(day) : []
            const isCurrentMonth = day !== null
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear()

            return (
              <div
                key={index}
                className={`min-h-24 p-2 rounded-lg border ${
                  isCurrentMonth
                    ? isToday
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                    : 'border-transparent bg-muted/20'
                }`}
              >
                {day && (
                  <>
                    <p className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day}
                    </p>
                    <div className="space-y-1">
                      {postsForDay.slice(0, 2).map(post => (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="text-xs px-2 py-1 rounded w-full text-left truncate transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: post.platforms[0] === 'Instagram' ? '#ec4899' : '#3b82f6',
                          }}
                        >
                          {post.title}
                        </button>
                      ))}
                      {postsForDay.length > 2 && (
                        <p className="text-xs text-muted-foreground px-2">+{postsForDay.length - 2} más</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  )
}
