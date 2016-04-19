'use babel';
import {Disposable, CompositeDisposable} from 'atom';

var disposable;

export function activate() {
  disposable = new CompositeDisposable(
    disablePendingItems(),
    disableSearchResultDoubleClick()
  );
}

export function deactivate() {
  disposable.dispose();
  disposable = null;
}

// No more pending pane items!
function disablePendingItems() {
  // Fix doesn't work without this setting enabled.
  atom.config.set('core.allowPendingPaneItems', true);
  return atom.workspace.onDidAddPaneItem(({pane}) =>
    pane.setPendingItem(null)
  );
}

// No more double click to open files!
function disableSearchResultDoubleClick() {
  document.body.addEventListener('mousedown', onSearchResultClick, true);
  return new Disposable(() =>
    document.body.removeEventListener('mousedown', onSearchResultClick)
  );
}

// Trigger a 2nd mousedown on the search result
// on a single mousedown.
function onSearchResultClick(event) {
  var file, custom;
  // Ignore double-clicks or other mouse buttons.
  // Do nothing if it isn't a file that was clicked.
  if (event.detail == 2 || event.button != 0 ||
    !(file = event.target.closest('.pane-item > .results-view .search-result'))) return;
  // Without nextTick() two copies would open,
  // one in pending mode and one in normal mode.
  process.nextTick(() => {
    // Dispatch a double-click event on the file
    // that was clicked.
    custom = new CustomEvent('mousedown', {
      bubbles: true,
      detail: 2,
    });
    file.dispatchEvent(custom);
  });
  // Cancel this event.
  event.stopImmediatePropagation();
}
