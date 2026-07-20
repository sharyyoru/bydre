'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getWorkspaceNotificationSettings,
  updateWorkspaceNotificationSettings,
  type WorkspaceNotificationSettings,
  type NotificationRecipientType,
} from '@/lib/workspace/settings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WorkspaceMember {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface AutoCopySettingsProps {
  workspaceId: string;
}

export function AutoCopySettings({ workspaceId }: AutoCopySettingsProps) {
  const [settings, setSettings] = useState<WorkspaceNotificationSettings | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<NotificationRecipientType[]>(['admin']);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Fetch settings
      const notificationSettings = await getWorkspaceNotificationSettings(workspaceId);
      if (notificationSettings) {
        setSettings(notificationSettings);
        setNotifyEnabled(notificationSettings.notify_on_unassigned_shoots);
        setSelectedRecipients(notificationSettings.unassigned_shoot_recipients as NotificationRecipientType[]);
      }

      // Fetch workspace members
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select('user_id, role, profiles(id, email, full_name)')
        .eq('workspace_id', workspaceId);

      if (membersData) {
        setMembers(membersData as unknown as WorkspaceMember[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [workspaceId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateWorkspaceNotificationSettings(workspaceId, {
        notify_on_unassigned_shoots: notifyEnabled,
        unassigned_shoot_recipients: selectedRecipients,
      });

      if (updated) {
        setSettings(updated);
        toast.success('Auto-copy settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleRecipient = (recipient: NotificationRecipientType) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(recipient)) {
        return prev.filter((r) => r !== recipient);
      } else {
        return [...prev, recipient];
      }
    });
  };

  const hasChanges =
    notifyEnabled !== settings?.notify_on_unassigned_shoots ||
    JSON.stringify(selectedRecipients) !== JSON.stringify(settings?.unassigned_shoot_recipients);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Copy Settings</CardTitle>
          <CardDescription>Configure notifications for auto-copied shoots</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const admins = members.filter((m) => m.role === 'admin');
  const teamLeads = members.filter((m) => m.role === 'team_lead');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Copy Settings</CardTitle>
        <CardDescription>
          Configure how your team is notified when approved content is automatically copied to Shoots
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notify-toggle" className="text-base font-medium">
              Notify when shoots need assignment
            </Label>
            <p className="text-sm text-muted-foreground">
              Send notifications when approved content is copied to Shoots without assignees
            </p>
          </div>
          <Switch
            id="notify-toggle"
            checked={notifyEnabled}
            onCheckedChange={setNotifyEnabled}
            disabled={saving}
          />
        </div>

        {/* Recipients Selection */}
        {notifyEnabled && (
          <div className="space-y-3 border-t pt-6">
            <Label className="text-base font-medium">Who should be notified?</Label>
            <p className="text-sm text-muted-foreground">
              Select the roles or individuals who should receive notifications for unassigned shoots
            </p>

            <div className="space-y-3 mt-4">
              {/* Admins */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  id="admin-checkbox"
                  checked={selectedRecipients.includes('admin')}
                  onChange={() => toggleRecipient('admin')}
                  disabled={saving}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="admin-checkbox" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">Workspace Admins</div>
                  <div className="text-xs text-muted-foreground">
                    {admins.length} admin{admins.length !== 1 ? 's' : ''}
                  </div>
                </label>
              </div>

              {/* Team Leads */}
              {teamLeads.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    id="team-lead-checkbox"
                    checked={selectedRecipients.includes('team_lead')}
                    onChange={() => toggleRecipient('team_lead')}
                    disabled={saving}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="team-lead-checkbox" className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">Team Leads</div>
                    <div className="text-xs text-muted-foreground">
                      {teamLeads.length} team lead{teamLeads.length !== 1 ? 's' : ''}
                    </div>
                  </label>
                </div>
              )}

              {/* Validation message */}
              {selectedRecipients.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  At least one recipient must be selected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        {notifyEnabled && selectedRecipients.length > 0 && (
          <div className="border-t pt-6 space-y-2">
            <Label className="text-sm font-medium">Notification preview</Label>
            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium">Notifications will be sent to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {selectedRecipients.includes('admin') && <li>All workspace admins</li>}
                {selectedRecipients.includes('team_lead') && <li>All team leads</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="border-t pt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (settings) {
                setNotifyEnabled(settings.notify_on_unassigned_shoots);
                setSelectedRecipients(settings.unassigned_shoot_recipients as NotificationRecipientType[]);
              }
            }}
            disabled={!hasChanges || saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || (notifyEnabled && selectedRecipients.length === 0)}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
