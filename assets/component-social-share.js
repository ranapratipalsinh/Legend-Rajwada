/**
 * Progressive enhancement for snippets/social-share.liquid's "copy link"
 * control. Every other share link is a plain anchor that works with no
 * JavaScript at all; only the clipboard action needs a script.
 */
export default function socialShare(el) {
  const button = el.querySelector('[data-social-share-copy]');
  const url = el.dataset.shareUrl;
  if (!button || !url) return;

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      const label = button.querySelector('.visually-hidden');
      if (label && button.dataset.copiedText) {
        const original = label.textContent;
        label.textContent = button.dataset.copiedText;
        setTimeout(() => { label.textContent = original; }, 2000);
      }
    } catch (error) {
      console.error('[social-share] clipboard write failed', error);
    }
  }

  button.addEventListener('click', handleClick);
  return () => button.removeEventListener('click', handleClick);
}
