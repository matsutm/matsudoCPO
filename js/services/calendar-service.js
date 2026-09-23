// js/services/calendar-service.js

//fetch
export async function fetchSchedulesData() {
  const { data, error } = await window.supabaseClient
    .from('schedules')
    .select('*');

  if (error) throw error;
  return data || [];
}

// IDで1件取得
export async function fetchScheduleById(id) {
  const { data, error } = await window.supabaseClient
    .from('schedules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

//create
export async function createSchedule(scheduleData) {
  const { data, error } = await window.supabaseClient
    .from('schedules')
    .insert([scheduleData])
    .select(); // 挿入レコードを返す

  if (error) throw error;
  return data;
}

//update
export async function updateSchedule(id, scheduleData) {
  const { data, error } = await window.supabaseClient
    .from('schedules')
    .update(scheduleData)
    .eq('id', id);

  if (error) throw error;
  return data;
}

//delete
export async function deleteSchedule(id) {
  const { error } = await window.supabaseClient
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}