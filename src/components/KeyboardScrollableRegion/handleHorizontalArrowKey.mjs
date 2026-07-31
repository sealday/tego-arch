const HORIZONTAL_SCROLL_STEP = 40;

export function handleHorizontalArrowKey(event) {
  if (
    event.target !== event.currentTarget
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || event.shiftKey
  ) {
    return;
  }

  const direction = event.key === 'ArrowRight'
    ? 1
    : event.key === 'ArrowLeft'
      ? -1
      : 0;
  if (direction === 0) return;

  const region = event.currentTarget;
  if (region.scrollWidth <= region.clientWidth) return;

  event.preventDefault();
  const nextScrollLeft = region.scrollLeft + direction * HORIZONTAL_SCROLL_STEP;
  region.scrollLeft = Math.min(
    region.scrollWidth - region.clientWidth,
    Math.max(0, nextScrollLeft),
  );
}
