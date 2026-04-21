const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchAccountData() {
  return request("/api/account-data");
}

export async function saveAccountData(accountData) {
  return request("/api/account-data", {
    method: "PUT",
    body: JSON.stringify(accountData),
  });
}

export async function fetchNotes() {
  return request("/api/notes");
}

export async function saveNotes(notes) {
  return request("/api/notes", {
    method: "PUT",
    body: JSON.stringify(notes),
  });
}
