// @ts-check

/**
 * IME key events may report keyCode 229 at the boundaries of composition.
 * @param {Pick<KeyboardEvent, 'isComposing' | 'keyCode'>} event
 */
export function isSongSearchComposing(event) {
  return event.isComposing || event.keyCode === 229;
}

/**
 * Keep Enter inside the live-search interaction and open the highlighted result,
 * falling back to the first result. With no results, prevent an empty form reload.
 *
 * @param {Pick<KeyboardEvent, 'key' | 'preventDefault' | 'isComposing' | 'keyCode'>} event
 * @param {number} activeIndex
 * @param {number} optionCount
 * @param {(index: number) => void} activate
 */
export function handleSongSearchEnter(event, activeIndex, optionCount, activate) {
  if (event.key !== 'Enter' || isSongSearchComposing(event)) return;

  event.preventDefault();
  if (optionCount < 1) return;

  const selectedIndex = activeIndex >= 0 && activeIndex < optionCount ? activeIndex : 0;
  activate(selectedIndex);
}
