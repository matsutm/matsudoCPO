// js/services/concert-service.js

/**
 * 今日以降の演奏会予定を取得する
 * @param {number|null} limit - 取得件数の上限（省略時は全件）
 */
export async function fetchUpcomingConcerts(limit = null) {
  const today = new Date().toISOString().split('T')[0];

  let query = window.supabaseClient
    .from('concerts')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}