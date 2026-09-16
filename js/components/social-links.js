// js/components/social-links.js

export function renderSocialLinks() {
  const urls = window.APP_CONSTANTS?.SOCIAL_URLS || {};

  const socialList = [
    { name: 'X', url: urls.X || '#', img: './X-logo.png' },
    { name: 'Instagram', url: urls.INSTAGRAM || '#', img: './Instagram_logo.jpg' },
    { name: 'Facebook', url: urls.FACEBOOK || '#', img: './Facebook_logo.png' },
    { name: 'teket', url: urls.TEKET || '#', img: './teket-logo-h.png' }
  ];

  return `
    <div class="social-links-grid">
      ${socialList.map(sns => `
        <a href="${sns.url}" target="_blank" rel="noopener" title="${sns.name}" class="social-icon-item">
          <img src="${sns.img}" alt="${sns.name}" class="social-logo-img ${sns.name.toLowerCase()}-img" />
        </a>
      `).join('')}
    </div>
  `;
}