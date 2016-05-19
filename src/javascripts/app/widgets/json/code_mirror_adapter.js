'use strict';

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
 * adapter.create()
 * .then(function (editor) {
 *   // The CodeMirror DOM element
 *   editor.attach(jqueryElement)
 *   editor.setValue(object)
 *   editor.undo()
 *   editor.redo()
 *   editor.destroy()
 * })
 */
angular.module('cf.app')
.factory('widgets/json/codeMirrorAdapter', ['$injector', function ($injector) {
  var LazyLoader = $injector.get('LazyLoader');
  var createSignal = $injector.get('signal').create;
  var debounce = $injector.get('debounce');

  var CODE_MIRROR_CONFIG = {
    autoCloseBrackets: true,
    mode: {name: 'javascript', json: true},
    lineWrapping: true,
    viewportMargin: Infinity,
    indentUnit: 4,
    indentWithTabs: true,
    height: 'auto',
    theme: 'none'
  };

  return {
    create: function () {
      return LazyLoader.get('markdown')
      .then(function (libs) {
        return create(libs.CodeMirror);
      });
    }
  };

  function create (CodeMirror) {
    var stateSignal = createSignal();
    var hasInitialValue = false;
    var currentValue;
    var element = $('<div />')[0];

    var cm = CodeMirror(element, CODE_MIRROR_CONFIG);

    cm.on('change', debounce(validateAndSave, 400));
    cm.on('change', updateHistorySize);

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
      var str = ev.getValue();
      if (currentValue !== str) {
        currentValue = str;
        stateSignal.dispatch(parseJSON(currentValue));
      }
    }

    function setValue (value) {
      var content = beautify(value);
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
    var parsed;
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
}]);

