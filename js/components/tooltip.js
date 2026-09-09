/**
 * カレンダーのイベントホバー時に表示するテキスト生成・属性付与部品
 */
export function createTooltipText(item) {
  const startTime = item.start_time ? item.start_time.slice(0, 5) : '';
  const endTime = item.end_time ? item.end_time.slice(0, 5) : '';
  const timeRange = startTime ? `${startTime}〜${endTime}` : '';

  return [
    `【場所】${item.location || '未定'}`,
    `【時間】${timeRange}`,
    `【指導】${item.instructor || 'なし'}`,
    `【内容】${item.program_notes || 'なし'}`
  ].join('\n');
}

export function attachTooltip(info) {
  if (info.event.extendedProps.tooltipText) {
    info.el.setAttribute('title', info.event.extendedProps.tooltipText);
  }
}