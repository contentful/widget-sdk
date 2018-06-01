'use strict';

angular.module('contentful')
.directive('cfApiKeyNav', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var $state = require('$state');

  var template = h('header.workbench-header.x--with-nav', [
    h('cf-breadcrumbs'),
    h('.page-header', [
      h('cf-icon.workbench-header__icon', {name: 'page-apis', scale: '0.75'}),
      h('h1.workbench-header__title', [
        'APIs',
        h('cf-knowledge-base.workbench-header__kb-link', {target: 'api_key'})
      ])
    ]),
    h('nav.workbench-nav__tabs', [
      h('a', {
        role: 'tab',
        uiSref: '{{tab.state}}',
        ngRepeat: 'tab in navController.tabs track by $index',
        ariaSelected: '{{tab.selected}}'
      }, ['{{tab.name}}'])
    ])
  ]);

  return {
    template: template,
    restrict: 'E',
    controller: [function () {
      var controller = this;
      var state = $state.current.name;
      var spacePrefix = state.match(/^(.+)\.api\./)[1];

      controller.state = $state.current.name;
      controller.tabs = [
        {
          name: 'Content delivery / preview tokens',
          state: `${spacePrefix}.api.keys.list`
        }, {
          name: 'Content management tokens',
          state: `${spacePrefix}.api.cma_tokens`
        }
      ].map(function (tab) {
        tab.selected = tab.state === controller.state;
        return tab;
      });
    }],
    controllerAs: 'navController'
  };
}]);
