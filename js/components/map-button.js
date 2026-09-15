// js/components/map-button.js

/**
 * 地図ボタンをレンダリングする
 * @param {string} location - 会場名（Google Maps 検索に使用）
 */
export function renderMapButton(location) {
  if (!location) return '';

  const encoded = encodeURIComponent(location);

  return `
    <div class="map-button-container">
      <button class="btn-map"
        onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encoded}', '_blank')">
        地図で見る
      </button>
    </div>
  `;
}
