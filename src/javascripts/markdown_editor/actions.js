'use strict';

angular.module('contentful').factory('MarkdownEditor/actions', ['$injector', function ($injector) {

  var advancedActions = $injector.get('MarkdownEditor/advancedActions');

  return { for: prepareActions };

  function prepareActions(editor, localeCode) {
    var actions = {};
    var actionNames = [];

    _.forEach(editor.actions, add);

    add(function () { advancedActions.asset(localeCode, editor.insert); }, 'asset');
    add(function () { advancedActions.link(editor.insert);              }, 'link');
    add(function () { advancedActions.special(editor.insert);           }, 'special');
    add(function () { advancedActions.table(editor.actions.table);      }, 'table');
    add(function () { advancedActions.embed(editor.insert);             }, 'embed');
    add(function () { advancedActions.organizeLinks(editor);            }, 'organizeLinks');
    add(function () { advancedActions.openHelp();                       }, 'openHelp');

    return actions;

    function add(fn, key) {
      actions[key] = fn;
      actionNames.push(key);
    }
  }
}]);
