"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  MinusCircle,
  ExternalLink,
  Filter,
  Loader2,
  Eye,
  Instagram,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ComplianceStatus } from "@/lib/compliance/types"

interface Post {
  id: string
  instagram_media_id: string
  media_type: string
  media_url: string | null
  thumbnail_url: string | null
  permalink: string | null
  caption: string | null
  posted_at: string | null
  agent_account: {
    id: string
    user_id: string
    username: string | null
    display_name: string | null
    profile_picture_url: string | null
  } | null
  compliance_check: {
    id: string
    is_real_estate_content: boolean
    detected_project_id: string | null
    detected_project_name: string | null
    company_qr_found: boolean
    project_qr_found: boolean
    project_qr_correct: boolean
    compliance_status: ComplianceStatus
    checked_at: string
    reviewed_by: string | null
    reviewed_at: string | null
  } | null
}

interface ComplianceDashboardProps {
  workspaceId: string
}

const statusConfig: Record<ComplianceStatus, { label: string; color: string; icon: React.ElementType }> = {
  compliant: { label: "Compliant", color: "text-green-600", icon: CheckCircle2 },
  missing_company_qr: { label: "Missing Company QR", color: "text-red-600", icon: AlertCircle },
  missing_project_qr: { label: "Missing Project QR", color: "text-red-600", icon: AlertCircle },
  wrong_project_qr: { label: "Wrong Project QR", color: "text-orange-600", icon: AlertTriangle },
  pending: { label: "Pending", color: "text-yellow-600", icon: Clock },
  not_applicable: { label: "Not Applicable", color: "text-gray-500", icon: MinusCircle },
}

export function ComplianceDashboard({ workspaceId }: ComplianceDashboardProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ workspace_id: workspaceId, limit: "50" })
      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      const res = await fetch(`/api/compliance/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, statusFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const getCheck = (post: Post) => {
    return Array.isArray(post.compliance_check)
      ? post.compliance_check[0]
      : post.compliance_check
  }

  const getAgent = (post: Post) => {
    return Array.isArray(post.agent_account)
      ? post.agent_account[0]
      : post.agent_account
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Status:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="missing_company_qr">Missing Company QR</SelectItem>
            <SelectItem value="missing_project_qr">Missing Project QR</SelectItem>
            <SelectItem value="wrong_project_qr">Wrong Project QR</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="not_applicable">Not Applicable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Instagram className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No posts found</p>
            <p className="text-sm">Sync an Instagram account to see posts here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const check = getCheck(post)
            const agent = getAgent(post)
            const status: ComplianceStatus = check?.compliance_status || "pending"
            const config = statusConfig[status]
            const StatusIcon = config.icon

            return (
              <Card key={post.id} className="overflow-hidden">
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="w-32 h-32 flex-shrink-0 bg-muted">
                    {post.thumbnail_url || post.media_url ? (
                      <img
                        src={post.thumbnail_url || post.media_url || ""}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Instagram className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {agent && (
                            <span className="text-sm font-medium">
                              @{agent.username || "unknown"}
                            </span>
                          )}
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.caption || "(No caption)"}
                        </p>
                        {check?.detected_project_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Project: {check.detected_project_name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPost(post)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {post.permalink && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {post.posted_at && (
                        <span>Posted: {new Date(post.posted_at).toLocaleDateString()}</span>
                      )}
                      {check && (
                        <>
                          <span>•</span>
                          <span>
                            Company QR: {check.company_qr_found ? "✓" : "✗"}
                          </span>
                          <span>•</span>
                          <span>
                            Project QR: {check.project_qr_correct ? "✓" : check.project_qr_found ? "Wrong" : "✗"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <PostDetail post={selectedPost} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostDetail({ post }: { post: Post }) {
  const check = Array.isArray(post.compliance_check)
    ? post.compliance_check[0]
    : post.compliance_check
  const agent = Array.isArray(post.agent_account)
    ? post.agent_account[0]
    : post.agent_account

  const status: ComplianceStatus = check?.compliance_status || "pending"
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-4">
      {/* Media */}
      <div className="aspect-square max-h-80 bg-muted rounded-lg overflow-hidden mx-auto">
        {post.media_url ? (
          post.media_type === "VIDEO" || post.media_type === "REELS" ? (
            <video
              src={post.media_url}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={post.media_url}
              alt=""
              className="w-full h-full object-contain"
            />
          )
        ) : post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Instagram className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {agent?.profile_picture_url && (
              <img
                src={agent.profile_picture_url}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="font-medium">@{agent?.username || "unknown"}</span>
          </div>
          <Badge variant="outline" className={config.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {post.caption && (
          <p className="text-sm">{post.caption}</p>
        )}

        {check && (
          <div className="rounded-lg border p-3 space-y-2">
            <h4 className="font-medium text-sm">Compliance Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Real Estate Content:</span>{" "}
                {check.is_real_estate_content ? "Yes" : "No"}
              </div>
              <div>
                <span className="text-muted-foreground">Detected Project:</span>{" "}
                {check.detected_project_name || "None"}
              </div>
              <div>
                <span className="text-muted-foreground">Company QR:</span>{" "}
                {check.company_qr_found ? (
                  <span className="text-green-600">Found ✓</span>
                ) : (
                  <span className="text-red-600">Missing ✗</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Project QR:</span>{" "}
                {check.project_qr_correct ? (
                  <span className="text-green-600">Correct ✓</span>
                ) : check.project_qr_found ? (
                  <span className="text-orange-600">Wrong</span>
                ) : (
                  <span className="text-red-600">Missing ✗</span>
                )}
              </div>
            </div>
            {check.reviewed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Reviewed: {new Date(check.reviewed_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {post.permalink && (
          <Button variant="outline" className="w-full" asChild>
            <a href={post.permalink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Instagram
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
