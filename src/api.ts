import { auth } from './lib/firebase';

const apiFetch = async (url: string, options: any = {}) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const token = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });
};

export const fetchTableRecords = async (tableName: string) => {
  const res = await apiFetch(`/api/table/${encodeURIComponent(tableName)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.details || 'Failed to fetch');
  return json.data || [];
};

export const createRecords = async (tableName: string, recordsFields: any[]) => {
  const res = await apiFetch(`/api/table/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: recordsFields.map(f => ({ fields: f })) })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.details || 'Failed to create');
  return json.data;
};
