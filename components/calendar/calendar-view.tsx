'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MoveRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scheduledPosts } from '@/lib/mock-data'
import { PostDetailModal, type PostDetail } from '@/components/modals/post-detail-modal'
import { getRecurrenceDates } from '@/lib/recurrence-utils'
import type { CalendarFilterState, CalendarViewType } from '@/app/calendar/page'

interface CalendarViewProps {
  view: CalendarViewType
  filters: CalendarFilterState
}

const platformColor: Record<string, string> = {
  Instagram: 'bg-pink-500/20 text-pink-700 dark:text-pink-200 border-pink-500/40',
  Facebook: 'bg-blue-500/20 text-blue-700 dark:text-blue-200 border-blue-500/40',
  TikTok: 'bg-neutral-500/20 text-neutral-800 dark:text-neutral-100 border-neutral-500/40',
  'YouTube Shorts': 'bg-red-500/20 text-red-700 dark:text-red-200 border-red-500/40',
  X: 'bg-gray-500/20 text-gray-700 dark:text-gray-200 border-gray-500/40',
  LinkedIn: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 border-cyan-500/40',
}

const weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

export function CalendarView({ view, filters }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)
  const [postsState, setPostsState] = useState(scheduledPosts)

  const toPostDetail = (post: (typeof scheduledPosts)[number]): PostDetail => ({
    id: post.id,
    title: post.title,
    status: post.status,
    thumbnail: post.thumbnail,
    caption: [post.caption, post.hashtags].filter(Boolean).join('\n\n'),
    platforms: post.platforms,
    contentType: post.contentType,
    project: post.project,
    publishAt: post.publishAt.toISOString(),
    creator: post.creator,
    approver: post.approver,
    sequenceGroupId: post.sequenceGroupId,
    sequenceOrder: post.sequenceOrder,
    recurrence: post.recurrence,
  })

  const visiblePosts = useMemo(() => {
    return postsState.filter((post) => {
      if (filters.platform !== 'all' && !post.platforms.some((p) => p.toLowerCase().includes(filters.platform))) {
        return false
      }
      if (filters.status !== 'all' && post.status !== filters.status) {
        return false
      }
      if (filters.project !== 'all' && post.project !== filters.project) {
        return false
      }
      if (filters.user !== 'all' && post.creator !== filters.user) {
        return false
      }
      return true
    })
  }, [filters.platform, filters.project, filters.status, filters.user, postsState])

  const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const getPostsForDate = (day: Date) => {
    const matched: typeof scheduledPosts = []
    visiblePosts.forEach((post) => {
      const base = new Date(post.publishAt)
      if (post.recurrence?.enabled) {
        const list = getRecurrenceDates(base, post.recurrence, 90)
        if (list.some((date) => date.toDateString() === day.toDateString())) {
          matched.push(post)
        }
      } else if (base.toDateString() === day.toDateString()) {
        matched.push(post)
      }
    })
    return matched
  }

  const shiftPostOneHour = (postId: string) => {
    setPostsState((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, publishAt: new Date(post.publishAt.getTime() + 60 * 60 * 1000) } : post)),
    )
  }

  const renderEvent = (post: (typeof scheduledPosts)[number]) => {
    const firstPlatform = post.platforms[0] || 'Instagram'
    return (
      <div key={post.id} className={`p-2 rounded border text-xs ${platformColor[firstPlatform] || 'bg-muted border-border'}`}>
        <button type="button" className="font-semibold text-left block w-full" onClick={() => setSelectedPost(toPostDetail(post))}>
          {post.title}
        </button>
        <p className="text-[11px] opacity-80 mt-1">{post.publishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    )
  }

  const renderMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const cells: Array<Date | null> = []
    for (let i = 0; i < firstDay; i += 1) cells.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, index) => (
            <div key={`${day?.toISOString() || 'blank'}-${index}`} className={`min-h-28 rounded-lg border p-2 ${day ? 'border-border' : 'border-transparent bg-muted/20'}`}>
              {day && (
                <>
                  <p className="text-sm font-semibold mb-2">{day.getDate()}</p>
                  <div className="space-y-1">{getPostsForDate(day).slice(0, 3).map(renderEvent)}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeek = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    const days = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(start)
      day.setDate(start.getDate() + idx)
      return day
    })

    return (
      <div className="grid md:grid-cols-7 gap-3">
        {days.map((day) => (
          <div key={day.toISOString()} className="border border-border rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold">{weekDays[day.getDay()]} {day.getDate()}</p>
            <div className="space-y-1">{getPostsForDate(day).map(renderEvent)}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderDay = () => {
    const slots = Array.from({ length: 12 }, (_, i) => i + 8)
    const postsToday = getPostsForDate(currentDate)

    return (
      <div className="border border-border rounded-lg p-4 space-y-3">
        {slots.map((hour) => {
          const slotPosts = postsToday.filter((post) => post.publishAt.getHours() === hour)
          return (
            <div key={hour} className="grid grid-cols-12 gap-3 items-start border-b border-border pb-3">
              <p className="col-span-2 text-xs text-muted-foreground">{`${hour.toString().padStart(2, '0')}:00`}</p>
              <div className="col-span-10 space-y-2">
                {slotPosts.length === 0 && <p className="text-xs text-muted-foreground">Sin publicaciones</p>}
                {slotPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between gap-2">
                    {renderEvent(post)}
                    <Button variant="outline" size="sm" onClick={() => shiftPostOneHour(post.id)}>
                      <MoveRight size={14} className="mr-2" />
                      Reprogramar +1h
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold capitalize">{monthLabel}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentDate((prev) =>
                  view === 'day'
                    ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1)
                    : new Date(prev.getFullYear(), prev.getMonth() - 1, prev.getDate()),
                )
              }
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentDate((prev) =>
                  view === 'day'
                    ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1)
                    : new Date(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()),
                )
              }
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(platformColor).map(([platform, style]) => (
            <span key={platform} className={`px-2 py-1 rounded border ${style}`}>
              {platform}
            </span>
          ))}
        </div>

        {view === 'month' && renderMonth()}
        {view === 'week' && renderWeek()}
        {view === 'day' && renderDay()}
      </div>

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </>
  )
}
