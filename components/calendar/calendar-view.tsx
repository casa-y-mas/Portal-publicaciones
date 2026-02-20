'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

import { Button } from '@/components/ui/button'
import { CalendarEventModal } from '@/components/calendar/calendar-event-modal'
import type { PostDetail } from '@/components/modals/post-detail-modal'
import type { CalendarFilterState, CalendarViewType } from '@/app/calendar/page'

interface CalendarViewProps {
  view: CalendarViewType
  filters: CalendarFilterState
}

interface CalendarPostItem extends PostDetail {
  projectId?: string
}

const viewMap: Record<CalendarViewType, 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
}

const platformColor: Record<string, string> = {
  instagram: '#d946ef',
  facebook: '#3b82f6',
  tiktok: '#1f2937',
  'youtube shorts': '#ef4444',
  x: '#6b7280',
  linkedin: '#0ea5e9',
}

const statusAccent: Record<string, string> = {
  draft: '#64748b',
  'pending-approval': '#f59e0b',
  scheduled: '#0ea5e9',
  published: '#22c55e',
  failed: '#ef4444',
  cancelled: '#6b7280',
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/_/g, '-')
const isLockedStatus = (status: string) => ['published', 'cancelled'].includes(normalize(status))

export function CalendarView({ view, filters }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [posts, setPosts] = useState<CalendarPostItem[]>([])
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<CalendarPostItem | null>(null)

  const loadPosts = useCallback(async () => {
    if (!range) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        start: range.start,
        end: range.end,
        platform: filters.platform,
        status: filters.status,
        project: filters.project,
        user: filters.user,
      })

      const response = await fetch(`/api/calendar/events?${params.toString()}`)
      if (!response.ok) throw new Error('No se pudo cargar el calendario.')
      const json = await response.json()
      setPosts(json.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error cargando calendario.')
    } finally {
      setLoading(false)
    }
  }, [range, filters.platform, filters.status, filters.project, filters.user])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    api.changeView(viewMap[view])
  }, [view])

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarPostItem>()
    for (const post of posts) {
      map.set(post.id, post)
    }
    return map
  }, [posts])

  const events = useMemo<EventInput[]>(() => {
    return posts.map((post) => {
      const firstPlatform = normalize(post.platforms[0] ?? '')
      const normalizedStatus = normalize(post.status)
      const backgroundColor = platformColor[firstPlatform] ?? 'hsl(var(--primary))'
      const borderColor = statusAccent[normalizedStatus] ?? backgroundColor

      return {
        id: post.id,
        title: post.title,
        start: post.publishAt,
        allDay: false,
        editable: !isLockedStatus(post.status),
        backgroundColor,
        borderColor,
        textColor: '#ffffff',
        extendedProps: {
          status: post.status,
          project: post.project,
          platforms: post.platforms,
        },
      }
    })
  }, [posts])

  const handleDatesSet = (arg: DatesSetArg) => {
    setRange({
      start: arg.start.toISOString(),
      end: arg.end.toISOString(),
    })
  }

  const updatePublishAt = async (postId: string, publishAt: string) => {
    const response = await fetch(`/api/scheduled-posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishAt }),
    })

    if (!response.ok) {
      const json = await response.json().catch(() => null)
      throw new Error(json?.message ?? 'No se pudo reprogramar la publicacion.')
    }

    const json = await response.json()
    const updated = json.item as CalendarPostItem
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
    setInfo('Publicacion reprogramada correctamente.')
  }

  const handleEventDrop = async (infoArg: EventDropArg) => {
    const newStart = infoArg.event.start
    if (!newStart) {
      infoArg.revert()
      return
    }

    try {
      await updatePublishAt(infoArg.event.id, newStart.toISOString())
    } catch (dropError) {
      infoArg.revert()
      setError(dropError instanceof Error ? dropError.message : 'Error reprogramando publicacion.')
    }
  }

  const handleEventResize = async (infoArg: EventResizeDoneArg) => {
    const newStart = infoArg.event.start
    if (!newStart) {
      infoArg.revert()
      return
    }

    try {
      await updatePublishAt(infoArg.event.id, newStart.toISOString())
    } catch (resizeError) {
      infoArg.revert()
      setError(resizeError instanceof Error ? resizeError.message : 'Error actualizando hora.')
    }
  }

  const handleEventClick = (click: EventClickArg) => {
    const post = eventMap.get(click.event.id)
    if (!post) return
    setSelectedPost(post)
  }

  const allowDrag = (
    dropInfo: { start: Date },
    draggedEvent: { extendedProps?: { status?: string } } | null,
  ) => {
    const status = draggedEvent?.extendedProps?.status ?? ''
    if (isLockedStatus(status)) return false
    return dropInfo.start.getTime() >= Date.now()
  }

  return (
    <>
      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}
      {info ? (
        <div className="surface-muted p-3 mb-4 border-primary/30">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-primary">{info}</p>
            <Button variant="ghost" size="sm" onClick={() => setInfo(null)}>Cerrar</Button>
          </div>
        </div>
      ) : null}

      <div className="surface-card p-4 md:p-6">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Cargando calendario...</div>
        ) : (
          <div className="calendar-pro">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={viewMap[view]}
              locale={esLocale}
              events={events}
              editable
              eventDurationEditable={false}
              eventStartEditable
              eventAllow={allowDrag}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              dayMaxEvents={4}
              allDaySlot={false}
              nowIndicator
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              height="auto"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Dia',
              }}
              eventContent={(eventInfo) => (
                <div className="fc-event-rich">
                  <p className="fc-event-title">{eventInfo.event.title}</p>
                  <p className="fc-event-meta">{(eventInfo.event.extendedProps.platforms as string[] | undefined)?.join(' • ')}</p>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {selectedPost ? (
        <CalendarEventModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdated={async () => {
            await loadPosts()
            setInfo('Calendario actualizado con cambios del evento.')
          }}
        />
      ) : null}
    </>
  )
}
