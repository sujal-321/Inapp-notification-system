import { useEffect, useState } from "react";
import {
  createTemplate,
  getTemplates,
  triggerNotification,
  getMetrics,
  getActivity,
  getAllUsers
} from "./api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";

export default function Admin() {
  const [templates, setTemplates] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [activity, setActivity] = useState([]);

  const [activityPage, setActivityPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sendToAll, setSendToAll] = useState(false);

  useEffect(() => {
    getTemplates().then(setTemplates);
    getAllUsers().then(setUsersList);

    setTimeout(() => {
      getMetrics().then(setMetrics);
      loadActivity(activityPage);
    }, 200);
  }, []);

  useEffect(() => {
    loadActivity(activityPage);
  }, [activityPage]);

  async function loadActivity(page) {
    const res = await getActivity(page, 5);
    setActivity(res.data);
    setTotalPages(res.totalPages);
  }

  async function handleCreateTemplate() {
    if (!title || !body) return;

    const newTemplate = await createTemplate({ title, body });
    setTitle("");
    setBody("");
    setTemplateId(String(newTemplate.id));

    setTemplates(await getTemplates());
  }

  function toggleUser(userId) {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  function toggleSendAll(checked) {
    setSendToAll(checked);
    setSelectedUsers(checked ? usersList.map(u => u.id) : []);
  }

  async function handleTrigger() {
    if (!templateId || selectedUsers.length === 0) return;

    await triggerNotification({
      templateId: Number(templateId),
      userIds: selectedUsers
    });

    getMetrics().then(setMetrics);
    loadActivity(activityPage);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">

      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Create templates, send notifications, and monitor delivery in real time.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CREATE TEMPLATE */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Create Notification Template</h3>
            <Input
              placeholder="Template title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Message body (use {{name}})"
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <Button className="w-full" onClick={handleCreateTemplate}>
              Create & Select Template
            </Button>
          </CardContent>
        </Card>

        {/* SEND NOTIFICATION */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Send Notification</h3>

            <select
              className="w-full border rounded-md p-2 bg-background"
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
            >
              <option value="">Select a template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={e => toggleSendAll(e.target.checked)}
              />
              Send to all users
            </label>

            {!sendToAll && (
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                {usersList.map(user => (
                  <label key={user.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    {user.name}
                    <span className="text-muted-foreground">
                      ({user.role})
                    </span>
                  </label>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!templateId || selectedUsers.length === 0}
              onClick={handleTrigger}
            >
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* METRICS */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Delivery Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.map(m => (
              <div
                key={m.status}
                className="rounded-lg border p-4 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  {m.status}
                </p>
                <p className="text-2xl font-bold">
                  {m.count}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ACTIVITY LOG */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Activity Log</h3>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.user_id}</TableCell>
                  <TableCell>{a.template_title}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell>
                    {new Date(a.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              disabled={activityPage === 1}
              onClick={() => setActivityPage(p => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {activityPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={activityPage === totalPages}
              onClick={() => setActivityPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
