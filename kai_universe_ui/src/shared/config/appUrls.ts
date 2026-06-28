// Central registry for all outbound URLs. Update these when the real domain is
// confirmed — every component that renders a link or copy-field reads from here.
export const APP_URLS = {
  download: 'https://universe.ziroh.com/download',
  installScript: 'curl -fsSL https://universe.ziroh.com/install.sh | bash',
  docs: 'https://universe.ziroh.com/docs',
} as const;
