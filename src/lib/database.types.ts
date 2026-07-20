export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "admin" | "member"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "member"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "member"
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string
          accent_color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string
          accent_color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string
          accent_color?: string
          created_at?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: "admin" | "member"
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: "admin" | "member"
          joined_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: "admin" | "member"
          joined_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          workspace_id: string
          name: string
          type: "shoots" | "content" | "tasks"
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          type: "shoots" | "content" | "tasks"
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          type?: "shoots" | "content" | "tasks"
          position?: number
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          board_id: string
          name: string
          color: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          color?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          name?: string
          color?: string
          position?: number
          created_at?: string
        }
      }
      statuses: {
        Row: {
          id: string
          board_id: string
          name: string
          color: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          color?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          name?: string
          color?: string
          position?: number
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          board_id: string
          group_id: string
          title: string
          description: string | null
          type: "shoot" | "content" | "task"
          status_id: string | null
          priority: "low" | "medium" | "high" | "urgent"
          start_date: string | null
          due_date: string | null
          metadata: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          group_id: string
          title: string
          description?: string | null
          type: "shoot" | "content" | "task"
          status_id?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          start_date?: string | null
          due_date?: string | null
          metadata?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          group_id?: string
          title?: string
          description?: string | null
          type?: "shoot" | "content" | "task"
          status_id?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          start_date?: string | null
          due_date?: string | null
          metadata?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      item_assignees: {
        Row: {
          item_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          item_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          item_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          item_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      mentions: {
        Row: {
          id: string
          comment_id: string
          mentioned_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          mentioned_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          mentioned_user_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "mention" | "assignment"
          source_id: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "mention" | "assignment"
          source_id: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "mention" | "assignment"
          source_id?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      task_assignees: {
        Row: {
          id: string
          item_id: string
          user_id: string
          role: "shooter" | "editor" | "reviewer" | "other"
          assigned_at: string
        }
        Insert: {
          id?: string
          item_id: string
          user_id: string
          role?: "shooter" | "editor" | "reviewer" | "other"
          assigned_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          user_id?: string
          role?: "shooter" | "editor" | "reviewer" | "other"
          assigned_at?: string
        }
      }
      workflow_notifications: {
        Row: {
          id: string
          workspace_id: string
          item_id: string
          notification_type: "assign_shooter" | "assign_editor" | "assign_reviewer"
          status: "pending" | "acknowledged" | "completed"
          created_at: string
          acknowledged_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          item_id: string
          notification_type: "assign_shooter" | "assign_editor" | "assign_reviewer"
          status?: "pending" | "acknowledged" | "completed"
          created_at?: string
          acknowledged_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          item_id?: string
          notification_type?: "assign_shooter" | "assign_editor" | "assign_reviewer"
          status?: "pending" | "acknowledged" | "completed"
          created_at?: string
          acknowledged_at?: string | null
          completed_at?: string | null
        }
      }
    }
  }
}
