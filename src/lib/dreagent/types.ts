export type ChatModel = "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-2.0-flash"

export const DEFAULT_MODEL: ChatModel = "gemini-2.5-flash"

export const DREAGENT_MODELS: { value: ChatModel; label: string; hint: string }[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Fast, great for most tasks" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Deeper reasoning (needs quota)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", hint: "Legacy fast model" },
]

export function isChatModel(v: unknown): v is ChatModel {
  return typeof v === "string" && DREAGENT_MODELS.some((m) => m.value === v)
}

export type Role = "user" | "model"

export interface Attachment {
  kind: "image" | "file"
  name: string
  mimeType: string
  /** base64 (no data: prefix). Persisted only for images. */
  data?: string
}

export interface Source {
  title: string
  uri: string
}

export interface DreMessage {
  id: string
  conversation_id: string
  workspace_id: string
  role: Role
  content: string
  attachments: Attachment[]
  sources: Source[]
  model: string | null
  created_at: string
}

export interface DreConversation {
  id: string
  workspace_id: string
  created_by: string | null
  title: string
  model: string
  created_at: string
  updated_at: string
  creator_name?: string | null
}

/** Thrown when the Google (Gemini) credential is missing. */
export class DreNotConfiguredError extends Error {
  constructor() {
    super("Google (Gemini) API key not configured")
    this.name = "DreNotConfiguredError"
  }
}

/** Wraps Google API failures with an HTTP-ish status for the route layer. */
export class DreApiError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code = "error") {
    super(message)
    this.name = "DreApiError"
    this.status = status
    this.code = code
  }
}
