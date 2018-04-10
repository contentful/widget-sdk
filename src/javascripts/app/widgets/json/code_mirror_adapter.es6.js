import {create as createSignal} from 'signal';
import debounce from 'debounce';
import $ from 'jquery';
import CodeMirror from 'codemirror';

/**
 * @ngdoc service
 * @module cf.app
 * @name widgets/json/codeMirrorAdapter
 * @description
 * Create a wrapper around a CodeMirror editor for json objects
 *
 * The editor accepts any JSON serializable object as input and makes
 * available the state as a signal.
 *
 * The adapter is created asynchronously after loading the required
 * libraries.
 *
 * @usage[js]
 * const editor = adapter.create()
 * // The CodeMirror DOM element
 * editor.attach(jqueryElement)
 * editor.setValue(object)
 * editor.undo()
 * editor.redo()
 * editor.destroy()
 */

const CODE_MIRROR_CONFIG = {
  autoCloseBrackets: true,
  mode: {name: 'javascript', json: true},
  lineWrapping: true,
  viewportMargin: Infinity,
  indentUnit: 4,
  indentWithTabs: true,
  height: 'auto',
  theme: 'none'
};

export function create () {
  const stateSignal = createSignal();
  let hasInitialValue = false;
  let currentValue;
  const element = $('<div />')[0];

  const cm = CodeMirror(element, CODE_MIRROR_CONFIG);

  cm.on('change', debounce(validateAndSave, 400));
  cm.on('change', updateHistorySize);
  const y = function () {};
  y();

  return {
    setValue: setValue,
    redo: function () { cm.redo(); },
    undo: function () { cm.undo(); },
    onStateChange: stateSignal.attach,
    attach: attach,
    destroy: destroy
  };

  function attach ($el) {
    $el.append(element);
    cm.refresh();
  }

  function destroy () {
    // IE 11 does not support ChildNode.remove()
    $(element).remove();
  }

  function validateAndSave (ev) {
    const str = ev.getValue();
    if (currentValue !== str) {
      currentValue = str;
      stateSignal.dispatch(parseJSON(currentValue));
    }
  }

  function setValue (value) {
    const content = beautify(value);
    if (currentValue !== content) {
      cm.doc.setValue(content);
      currentValue = content;
    }

    // We do not want to record the initial population in the
    // history. Otherwise it would always be possible to revert to
    // the empty string.
    if (!hasInitialValue) {
      cm.clearHistory();
      hasInitialValue = true;
    }

    updateHistorySize();
  }

  function updateHistorySize () {
    stateSignal.dispatch({
      undoable: cm.historySize().undo > 0,
      redoable: cm.historySize().redo > 0
    });
  }
}

function parseJSON (str) {
  if (str === '') {
    return {
      value: undefined,
      valid: undefined
    };
  } else if (isValidJson(str)) {
    return {
      value: JSON.parse(str),
      valid: true
    };
  } else {
    return {
      valid: false
    };
  }
}

function isValidJson (str) {
  let parsed;
  try {
    parsed = JSON.parse(str);
  } catch (e) {
    return false;
  }
  // An object or array is valid JSON
  if (typeof parsed !== 'object') {
    return false;
  }
  return true;
}

// Takes an object and returns a pretty-printed JSON string
function beautify (obj) {
  if (obj === null || obj === undefined) {
    return '';
  } else {
    return JSON.stringify(obj, null, '\t');
  }
}
