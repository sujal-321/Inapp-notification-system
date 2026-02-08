import { useState } from "react";
import {
  createTemplate,
  getTemplates,
  triggerNotification,
  getMetrics,
  getActivity,
  getAllUsers
} from "./api";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

/* ---------- helpers ---------- */
function normalizeActivityResponse(res) {
  // If backend returns { data, totalPages }
  if (res && typeof res === "object" && Array.isArray(res.data)) {
    return {
      rows: res.data,
      totalPages: res.totalPages ?? 1
    };
  }

  // If backend returns array directly
  if (Array.isArray(res)) {
    return {
      rows: res,
      totalPages: 1
    };
  }

  return { rows: [], totalPages: 1 };
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? "—" : d.toLocaleString();
}

export default function Admin() {
  const queryClient = useQueryClient();

  /* ---------------- UI STATE ---------------- */
  const [activityPage, setActivityPage] = useState(1);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sendToAll, setSendToAll] = useState(false);

  /* ---------------- QUERIES ---------------- */

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ["metrics"],
    queryFn: getMetrics
  });

  const {
    data: rawActivityRes,
    isFetching: activityLoading
  } = useQuery({
    queryKey: ["activity", activityPage],
    queryFn: () => getActivity(activityPage, 5),
    keepPreviousData: true
  });

  /* 🔥 normalize response */
  const { rows: activity, totalPages } =
    normalizeActivityResponse(rawActivityRes);

  /* ---------------- MUTATIONS ---------------- */

  const createTemplateMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries(["templates"]);
      setTemplateId(String(newTemplate.id));
      setTitle("");
      setBody("");
    }
  });

  const triggerMutation = useMutation({
    mutationFn: triggerNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(["metrics"]);
      queryClient.invalidateQueries(["activity"]);
    }
  });

  /* ---------------- HANDLERS ---------------- */

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

  function handleTrigger() {
    if (!templateId || selectedUsers.length === 0) return;

    triggerMutation.mutate({
      templateId: Number(templateId),
      userIds: selectedUsers
    });
  }

  /* ---------------- UI ---------------- */

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
            <Button
              className="w-full"
              onClick={() =>
                createTemplateMutation.mutate({ title, body })
              }
              disabled={createTemplateMutation.isLoading}
            >
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

          {activity.length === 0 && !activityLoading && (
            <p className="text-muted-foreground text-sm">
              No activity found.
            </p>
          )}

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
                  <TableCell>{formatDate(a.created_at)}</TableCell>
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
              {activityLoading && " (loading...)"}
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
