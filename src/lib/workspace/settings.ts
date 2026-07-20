import { createClient } from '@/lib/supabase/client';

export type NotificationRecipientType = 'admin' | 'team_lead' | string;

export interface WorkspaceNotificationSettings {
  id: string;
  workspace_id: string;
  notify_on_unassigned_shoots: boolean;
  unassigned_shoot_recipients: NotificationRecipientType[];
  created_at: string;
  updated_at: string;
}

export async function getWorkspaceNotificationSettings(
  workspaceId: string
): Promise<WorkspaceNotificationSettings | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workspace_notification_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }

  return data as WorkspaceNotificationSettings;
}

export async function updateWorkspaceNotificationSettings(
  workspaceId: string,
  settings: Partial<Omit<WorkspaceNotificationSettings, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
): Promise<WorkspaceNotificationSettings | null> {
  const supabase = createClient();

  const updateData: any = {
    ...settings,
    updated_at: new Date().toISOString(),
  };

  // Convert array to JSONB if needed
  if (settings.unassigned_shoot_recipients) {
    updateData.unassigned_shoot_recipients = settings.unassigned_shoot_recipients;
  }

  const { data, error } = await supabase
    .from('workspace_notification_settings')
    .update(updateData)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating notification settings:', error);
    return null;
  }

  return data as WorkspaceNotificationSettings;
}

export function isValidRecipientType(value: string): value is NotificationRecipientType {
  return value === 'admin' || value === 'team_lead' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

export function validateRecipients(recipients: any[]): NotificationRecipientType[] {
  if (!Array.isArray(recipients)) {
    return ['admin'];
  }

  const valid = recipients.filter(isValidRecipientType);
  return valid.length > 0 ? valid : ['admin'];
}
