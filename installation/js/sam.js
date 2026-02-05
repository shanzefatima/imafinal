/**
 * SAM-style rating: 5x5 grid = valence (x) vs arousal (y)
 * Values 1–5 each; stored as { valence, arousal }
 */
(function () {
  const KEY = 'speculative_translation_sam';

  function getGridEl() {
    return document.querySelector('.sam-grid');
  }

  function getSelected() {
    const grid = getGridEl();
    if (!grid) return null;
    const cell = grid.querySelector('.sam-cell.selected');
    if (!cell) return null;
    const i = Array.from(grid.querySelectorAll('.sam-cell')).indexOf(cell);
    const col = i % 5;
    const row = Math.floor(i / 5);
    return { valence: col + 1, arousal: 5 - row };
  }

  function selectCell(cell) {
    const grid = getGridEl();
    if (!grid) return;
    grid.querySelectorAll('.sam-cell').forEach(c => c.classList.remove('selected'));
    cell.classList.add('selected');
  }

  function initGrid() {
    const grid = getGridEl();
    if (!grid) return;
    grid.querySelectorAll('.sam-cell').forEach((cell, i) => {
      cell.addEventListener('click', () => selectCell(cell));
    });
  }

  function save(phase) {
    const v = getSelected();
    if (!v) return false;
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    data[phase] = { valence: v.valence, arousal: v.arousal, at: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  }

  function load() {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  }

  window.SAM = {
    getSelected,
    selectCell,
    initGrid,
    save,
    load,
    KEY
  };
})();
