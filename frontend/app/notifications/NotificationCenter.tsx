import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function NotificationCenter() {
  const notifications = []; // Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Bell /> Notifications
      </h2>
      {notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        notifications.map((n) => (
          <Card key={n.id} className="p-4 mb-3">
            <h4 className="font-semibold">{n.title}</h4>
            <p>{n.message}</p>
          </Card>
        ))
      )}
    </div>
  );
}