const BASE = "http://localhost:4000";

export async function triggerNotification(payload) {
  return fetch(`${BASE}/admin/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

export async function getUserNotifications(userId) {
  return fetch(`${BASE}/user/notifications/${userId}`)
    .then(r => r.json());
}


export async function getMetrics() {
  return fetch(`${BASE}/admin/metrics`).then(r => r.json());
}


export async function getTemplates() {
  return fetch(`${BASE}/admin/templates`).then(r => r.json());
}

export async function createTemplate(payload) {
  return fetch("http://localhost:4000/admin/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

export async function markRead(id) {
  return fetch(`http://localhost:4000/user/notifications/${id}/read`, {
    method: "PATCH"
  });
}

export async function getActivity(page = 1, limit = 5) {
  return fetch(
    `http://localhost:4000/admin/activity?page=${page}&limit=${limit}`
  ).then(res => res.json());
}


export async function getAllUsers() {
  return fetch("http://localhost:4000/user/all")
    .then(res => res.json());
}


