import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { handleSongSearchEnter } from '../src/lib/songSearchKeyboard.js';

const homepage = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

function keyboardEvent(key) {
  return {
    key,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

test('Enter opens the highlighted result when one is selected', () => {
  const event = keyboardEvent('Enter');
  const activated = [];

  handleSongSearchEnter(event, 2, 4, (index) => activated.push(index));

  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(activated, [2]);
});

test('Enter opens the first result when none is highlighted', () => {
  const event = keyboardEvent('Enter');
  const activated = [];

  handleSongSearchEnter(event, -1, 3, (index) => activated.push(index));

  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(activated, [0]);
});

test('Enter prevents form submission while results are empty, loading, or unavailable', () => {
  const event = keyboardEvent('Enter');
  const activated = [];

  handleSongSearchEnter(event, -1, 0, (index) => activated.push(index));

  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(activated, []);
});

test('non-Enter keys are left alone by the Enter handler', () => {
  const event = keyboardEvent('Escape');
  const activated = [];

  handleSongSearchEnter(event, -1, 2, (index) => activated.push(index));

  assert.equal(event.defaultPrevented, false);
  assert.deepEqual(activated, []);
});

test('homepage English song count comes from the catalog array', () => {
  assert.match(
    homepage,
    /<strong>\{songs\.length\.toLocaleString\(\)\}<\/strong> English songs/,
  );
});

for (const activeIndex of [-1, 1]) {
  test(`composition Enter leaves IME alone with activeIndex ${activeIndex}`, () => {
    const event = {...keyboardEvent('Enter'), isComposing: true, keyCode: 13};
    const activated = [];
    handleSongSearchEnter(event, activeIndex, 2, index => activated.push(index));
    assert.equal(event.defaultPrevented, false);
    assert.deepEqual(activated, []);
  });
}

test('IME boundary keyCode229 is ignored even when isComposing is false', () => {
  const event = {...keyboardEvent('Enter'), isComposing: false, keyCode: 229};
  const activated = [];
  handleSongSearchEnter(event, -1, 2, index => activated.push(index));
  assert.equal(event.defaultPrevented, false);
  assert.deepEqual(activated, []);
});

test('Enter works normally again after composition', () => {
  const activated = [];
  handleSongSearchEnter({...keyboardEvent('Enter'), isComposing: true}, -1, 2, i => activated.push(i));
  const committed = {...keyboardEvent('Enter'), isComposing: false, keyCode: 13};
  handleSongSearchEnter(committed, -1, 2, i => activated.push(i));
  assert.deepEqual(activated, [0]);
  assert.equal(committed.defaultPrevented, true);
});
