'use babel';
import {Disposable, CompositeDisposable} from 'atom';

export var config = {
  fixTreeView: {
    description: 'Make single clicks in the tree view open a file.',
    type: 'boolean',
    default: true,
  },
  fixSearchResultsView: {
    description: 'Make single click in the project search results view open a file.',
    type: 'boolean',
    default: true,
  },
  focusEditorOnOpen: {
    description: 'Focus the editor immediately when a file is opened.',
    type: 'boolean',
    default: true,
  }
};

var disposables;

export function activate() {
  disposables = new CompositeDisposable();

  if (atom.config.get('single-click-open.fixTreeView'))
    disablePendingItems();

  if (atom.config.get('single-click-open.fixSearchResultsView'))
    disableSearchResultDoubleClick();
}

export function deactivate() {
  disposables.dispose();
  disposables = null;
}

// No more pending pane items!
function disablePendingItems() {
  // Fix doesn't work without this setting enabled.
  atom.config.set('core.allowPendingPaneItems', true);
  disposables.add(
    atom.workspace.onDidAddPaneItem(({item, pane}) => {
      pane.setPendingItem(null);

      if (atom.config.get('single-click-open.focusEditorOnOpen')) {
        process.nextTick(() => atom.views.getView(item).focus());
      }
    })
  );

  if (atom.config.get('single-click-open.focusEditorOnOpen')) {
    disposables.add(
      atom.workspace.onDidChangeActivePaneItem(item => {
        var view = atom.views.getView(item);

        if (view && typeof view.focus == 'function')
          atom.views.getView(item).focus();
      })
    );
  }
}

// No more double click to open files!
function disableSearchResultDoubleClick() {
  document.body.addEventListener('mousedown', onSearchResultClick, true);
  return new Disposable(() => {
    document.body.removeEventListener('mousedown', onSearchResultClick)
  });
}

// Trigger a 2nd mousedown on the search result
// on a single mousedown.
function onSearchResultClick(event) {
  var el;
  // Ignore double-clicks or other mouse buttons.
  // Do nothing if it isn't a file that was clicked.
  if (event.detail == 2 || event.button != 0 ||
    !(el = event.target.closest('.pane-item > .results-view .search-result'))) return;
  // Without nextTick() two copies would open,
  // one in pending mode and one in normal mode.
  process.nextTick(() => {
    // Dispatch a double-click event on the file
    // that was clicked.
    el.dispatchEvent(new CustomEvent('mousedown', {
      bubbles: true,
      detail: 2,
    }));
  });
  // Cancel this event.
  event.stopImmediatePropagation();
}
