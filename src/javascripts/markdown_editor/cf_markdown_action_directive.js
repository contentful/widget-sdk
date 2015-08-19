'use strict';

angular.module('contentful').directive('cfMarkdownAction', function () {
  var descriptors = {
    bold:          ['Bold',                     'fa-bold'],
    italic:        ['Italic',                   'fa-italic'],
    quote:         ['Quote',                    'fa-quote-left'],
    ul:            ['Unordered list',           'fa-list'],
    ol:            ['Ordered list',             'fa-list-ol'],
    link:          ['Link',                     'fa-link'],
    strike:        ['Strike out',               'fa-strikethrough'],
    code:          ['Code block',               'fa-code'],
    hr:            ['Horizontal rule',          'fa-arrows-h'],
    indent:        ['Increase indentation',     'fa-indent'],
    dedent:        ['Decrease indentation',     'fa-dedent'],
    embed:         ['Embed external content',   'fa-cubes'],
    table:         ['Insert table',             'fa-table'],
    special:       ['Insert special character', 'fa-eur'],
    organizeLinks: ['Organize links',           'fa-sitemap'],
    undo:          ['Undo',                     'fa-undo'],
    redo:          ['Redo',                     'fa-repeat']
  };

  var template = [
    '<button ',
      'tabindex="-1" ',
      'tooltip="{{ tooltip }}" ',
      'tooltip-placement="{{ placement }}" ',
      'ng-click="actions[name]()" ',
      'class="toolbar-button fa" ',
      'ng-class="cssClass" ',
      'ng-disabled="disabled"',
    '></button>'
  ].join('');

  return {
    restrict: 'E',
    scope: {
      name: '@',
      actions: '=',
      disabled: '=',
      mode: '@'
    },
    template: template,
    link: function (scope) {
      var descriptor = descriptors[scope.name];
      scope.tooltip = descriptor[0];
      scope.cssClass = descriptor[1];
      scope.placement = scope.mode === 'zen' ? 'bottom' : 'top';
    }
  };
});
