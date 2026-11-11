// Source links download the actual files; guides and rendered README pages remain navigable.
function prepareDownloads() {
  const extensions = new Set(['.mapl', '.py', '.js', '.mjs', '.cjs', '.css', '.json', '.svg']);
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.includes('/examples/')) continue;
    const name = url.pathname.split('/').pop();
    const extension = name.slice(name.lastIndexOf('.'));
    if (extensions.has(extension) || name === 'applet.html') link.setAttribute('download', name);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepareDownloads);
else prepareDownloads();
