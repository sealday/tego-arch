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

  const region = event.currentTarget;
  if (region.scrollWidth <= region.clientWidth) return;

  const maximumScrollLeft = region.scrollWidth - region.clientWidth;
  const nextScrollLeft = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? maximumScrollLeft
      : event.key === 'ArrowRight'
        ? region.scrollLeft + HORIZONTAL_SCROLL_STEP
        : event.key === 'ArrowLeft'
          ? region.scrollLeft - HORIZONTAL_SCROLL_STEP
          : null;
  if (nextScrollLeft === null) return;

  event.preventDefault();
  region.scrollLeft = Math.min(
    maximumScrollLeft,
    Math.max(0, nextScrollLeft),
  );
}
