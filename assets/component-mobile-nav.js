/**
 * Expandable menu levels for the mobile navigation drawer. Matched to
 * `data-component="mobile-nav"` on the menu drawer's body (see
 * snippets/theme-overlays.liquid). One delegated click listener handles
 * every accordion trigger, since the drawer's menu is rebuilt from Liquid
 * on every page load and triggers shouldn't need re-binding individually.
 *
 * The open/closed visual state is a CSS grid-template-rows transition
 * (0fr → 1fr) rather than a measured max-height, so it animates smoothly
 * without JavaScript ever needing to read scrollHeight.
 */
export default function mobileNav(el) {
  function handleClick(event) {
    const trigger = event.target.closest('[data-accordion-trigger]');
    if (!trigger) return;
    const content = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!content) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));
    content.classList.toggle('is-open', !isOpen);
  }

  el.addEventListener('click', handleClick);
  return () => el.removeEventListener('click', handleClick);
}
