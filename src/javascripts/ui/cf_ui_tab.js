'use strict';

angular.module('cf.ui')

/**
 * @ngdoc directive
 * @name cfUiTab
 * @description
 * Shows only one tabpanel at a time and let the user select the panel
 * through a click.
 *
 * This directive is ARIA compatible
 *
 * Two elements with the same `data-tab` attribute both hold references
 * to the same object in the `scope.tab`.  This object contains at
 * least the `active` property that is `true` only if the tab is
 * currently displayed.
 *
 * @usage[jade]
 *   div(cf-ui-tab)
 *     ul(role="tablist")
 *       li(role="tab" data-tab="one")
 *       li(role="tab" data-tab="two")
 *     div(role="tabpanel" data-tab="one")
 *       | content of tab one
 *     div(role="tabpanel" data-tab="two")
 *       | content of tab two
 */
.directive('cfUiTab', [function () {

  function Tab (controller, name) {
    this.name = name;
    this.activate = function () {
      controller.activate(name);
    };
  }

  return {
    controllerAs: 'tabController',
    controller: [function () {
      var tabs = {};
      var activeTab = null;

      this.registerControl = function (name, element) {
        var tab = this.get(name);
        tab.control = element;

        if (activeTab === null) {
          this.activate(name);
        }
        return tab;
      };

      this.registerPanel = function (name, element) {
        var tab = this.get(name);
        tab.panel = element;
        return tab;
      };

      this.get = function (name) {
        if (!_.isString(name))
          throw new TypeError('Tab name must be a string');

        var tab = tabs[name];
        if (!tab)
          tab = tabs[name] = new Tab(this, name);

        return tab;
      };

      this.activate = function (name) {
        if (activeTab)
          activeTab.active = false;

        if (name) {
          activeTab = this.get(name);
          activeTab.active = true;
        } else {
          activeTab = null;
        }
      };

    }]
  };
}])

.directive('role', [function () {
  return {
    scope: true,
    link: function (scope, element, attr) {
      var link;
      if (attr.role === 'tab') {
        link = linkTab;
      } else if (attr.role === 'tabpanel') {
        link = linkTabPanel;
      }

      if (link)
        link(scope, element, attr);
    }
  };

  function linkTab(scope, element, attr) {
    var tabName = attr.tab;
    if (!tabName)
      return;

    var tab = scope.tabController.registerControl(tabName);
    scope.tab = tab;

    element.on('click', function () {
      scope.$apply(tab.activate);
    });

    scope.$watch('tab.active', function (isActive) {
      attr.$set('ariaSelected', isActive);
    });
  }

  function linkTabPanel(scope, element, attr) {
    var tabName = attr.tab;
    if (!tabName)
      return;

    var tabController = scope.tabController;
    var tab = tabController.registerPanel(tabName, element);
    scope.tab = tab;

    scope.$watch('tab.active', function (isActive) {
      attr.$set('ariaHidden', !isActive);
    });
  }
}]);
