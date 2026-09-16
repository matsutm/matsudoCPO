// js/components/social-links.js

/**
 * SNS・チケットロゴの均等配置リストを出力
 */
export function renderSocialLinks() {
  const socialList = window.APP_CONSTANTS?.SOCIAL_LINKS || [];

  if (socialList.length === 0) return '';

  return `
    <div class="social-links-grid">
      ${socialList.map(sns => `
        <a href="${sns.url}" target="_blank" rel="noopener" title="${sns.name}" class="social-icon-item">
          <img src="${sns.img}" alt="${sns.name}" class="social-logo-img ${sns.class || ''}" />
        </a>
      `).join('')}
    </div>
  `;
}