import { useEffect, useState } from "react";
import {
  getUserNotifications,
  markRead,
  getAllUsers
} from "./api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export default function User() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  // Load users once
  useEffect(() => {
    getAllUsers().then(data => {
      setUsers(data);
      if (data.length) {
        setUserId(data[0].id); // default to first user
      }
    });
  }, []);

  // Load notifications when user changes
  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  async function loadNotifications() {
    const data = await getUserNotifications(userId);
    setNotifications(data);
  }

  async function handleMarkRead() {
    if (!selected) return;

    await markRead(selected.id);
    setOpen(false);
    setSelected(null);
    loadNotifications();
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">

      {/* Header + User Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Dashboard</h2>

        <select
          className="border rounded-md p-2 bg-background"
          value={userId || ""}
          onChange={e => setUserId(Number(e.target.value))}
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Notification Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your Notifications</h3>

        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
            {unreadCount} New
          </span>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <p className="text-muted-foreground">
          No notifications for this user.
        </p>
      )}

      {/* Notification list */}
      {notifications.map(notification => (
        <Card
          key={notification.id}
          className={
            notification.is_read
              ? "opacity-60"
              : "border-primary"
          }
        >
          <CardContent className="flex justify-between items-center py-4">
            <div>
              <p className="font-medium">
                {notification.message.slice(0, 60)}
                {notification.message.length > 60 && "..."}
              </p>

              <p className="text-sm text-muted-foreground">
                {new Date(notification.created_at).toLocaleString()}
              </p>

              {!notification.is_read && (
                <span className="inline-block mt-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                  New
                </span>
              )}
            </div>

            {!notification.is_read && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelected(notification);
                  setOpen(true);
                }}
              >
                View
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Notification Detail Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <p className="text-base">
                {selected.message}
              </p>

              <p className="text-sm text-muted-foreground">
                Received on{" "}
                {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleMarkRead}>
              Mark as read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
