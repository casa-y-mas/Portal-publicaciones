'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { mediaLibrary } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Search, Download, Copy, Trash2 } from 'lucide-react'

export default function LibraryPage() {
  const [search, setSearch] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<typeof mediaLibrary[0] | null>(null)

  const filteredMedia = mediaLibrary.filter(media =>
    media.filename.toLowerCase().includes(search.toLowerCase()) ||
    media.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Media Library</h1>
        <p className="text-muted-foreground">Manage your content assets</p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Search by filename or tags..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMedia.map(media => (
          <div
            key={media.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer"
            onClick={() => setSelectedMedia(media)}
          >
            {/* Thumbnail */}
            <div className="relative bg-muted aspect-square flex items-center justify-center overflow-hidden">
              {media.type === 'video' ? (
                <>
                  <div className="text-4xl">🎥</div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Play size={32} className="text-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl">🖼️</div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                </>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="text-sm font-semibold text-foreground truncate">{media.filename}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {media.project}
              </p>
              {media.duration && (
                <p className="text-xs text-muted-foreground">{media.duration}</p>
              )}
              <div className="flex gap-1 mt-2 flex-wrap">
                {media.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
              <h2 className="text-xl font-bold">Media Details</h2>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="bg-muted rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">
                  {selectedMedia.type === 'video' ? '🎥' : '🖼️'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedMedia.type === 'video' ? 'Video Preview' : 'Image Preview'}
                </p>
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Filename</label>
                  <p className="text-foreground">{selectedMedia.filename}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Type</label>
                    <p className="text-foreground capitalize">{selectedMedia.type}</p>
                  </div>

                  {selectedMedia.duration && (
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">Duration</label>
                      <p className="text-foreground">{selectedMedia.duration}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Project</label>
                    <p className="text-foreground">{selectedMedia.project}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Uploaded</label>
                    <p className="text-foreground">{selectedMedia.uploadedAt.toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Tags</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedMedia.tags.map(tag => (
                      <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-6 bg-muted/30 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedMedia(null)}>
                <Copy size={16} className="mr-2" />
                Use in Post
              </Button>
              <Button variant="outline">
                <Download size={16} className="mr-2" />
                Download
              </Button>
              <Button variant="destructive">
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
