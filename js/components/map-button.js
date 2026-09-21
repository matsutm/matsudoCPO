// js/components/map-button.js

/**
 * 地図ボタンをレンダリングする
 * @param {string} location - 会場名（Google Maps 検索に使用）
 */
export function renderMapButton(location) {
  if (!location) return '';

  const encoded = encodeURIComponent(location);

  return `
    <div class="map-button-container" style="margin: 8px 0;">
      <a href="https://www.google.com/maps/search/?api=1&query=${encoded}"
         target="_blank"
         rel="noopener" 
         class="btn-map">
        地図で見る
      </a>
    </div>
  `;
}
