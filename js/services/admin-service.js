// js/services/admin-service.js

export const ADMIN_POSITION = '運営委員';

/** 運営委員かどうか（画面表示の制御用。本当の防御は Supabase の RLS） */
export function isExecutive(user) {
  return !!user && (user.positions || []).includes(ADMIN_POSITION);
}

export async function fetchRows(table, orderBy, ascending = true) {
  const { data, error } = await window.supabaseClient
    .from(table)
    .select('*')
    .order(orderBy, { ascending });
  if (error) throw error;
  return data || [];
}

export async function insertRows(table, rows) {
  if (!rows.length) return;
  const { error } = await window.supabaseClient.from(table).insert(rows);
  if (error) throw error;
}

export async function updateRowById(table, id, data) {
  const { error } = await window.supabaseClient.from(table).update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteRowById(table, id) {
  const { error } = await window.supabaseClient.from(table).delete().eq('id', id);
  if (error) throw error;
}
