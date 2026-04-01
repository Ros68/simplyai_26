
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { ReminderSettings } from '@/components/admin/ReminderSettings';
import { Reminder } from '@/types/supabase';

interface NotificationsOptions {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  whatsappNotifications?: boolean;
  reminders: Reminder[];
}

interface PlanNotificationsTabProps {
  options: NotificationsOptions;
  onOptionsChange: (options: Partial<NotificationsOptions>) => void;
}

const PlanNotificationsTab = ({ options, onOptionsChange }: PlanNotificationsTabProps) => {
  const handleToggleChange = (key: keyof NotificationsOptions, value: boolean) => {
    onOptionsChange({ [key]: value });
  };

  const handleRemindersChange = (reminders: Reminder[]) => {
    onOptionsChange({ reminders });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurazione Notifiche</CardTitle>
        <CardDescription>
          Configura le notifiche per questo piano
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="email-notifications"
              checked={options.emailNotifications || false}
              onCheckedChange={(checked) => handleToggleChange('emailNotifications', checked)}
            />
            <Label htmlFor="email-notifications">Notifiche Email</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="sms-notifications"
              checked={options.smsNotifications || false}
              onCheckedChange={(checked) => handleToggleChange('smsNotifications', checked)}
            />
            <Label htmlFor="sms-notifications">Notifiche SMS</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="whatsapp-notifications"
              checked={options.whatsappNotifications || false}
              onCheckedChange={(checked) => handleToggleChange('whatsappNotifications', checked)}
            />
            <Label htmlFor="whatsapp-notifications">Notifiche WhatsApp</Label>
          </div>
        </div>
        
        {(options.emailNotifications || options.smsNotifications || options.whatsappNotifications) && (
          <div className="pt-4 border-t">
            <ReminderSettings 
              reminders={options.reminders || []}
              onChange={handleRemindersChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanNotificationsTab;
