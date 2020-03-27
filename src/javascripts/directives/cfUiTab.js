import { registerDirective, registerController } from 'NgRegistry';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfUiTab
   * @description
   * Shows only one tabpanel at a time and let the user select the panel
   * through a click.
   *
   * Two elements with the same `ui-tab` and `ui-tabpanel` attribute
   * value both hold references to the same object in the `scope.tab`.
   * This object contains at least the `active` property that is `true`
   * only if the tab is currently displayed.
   *
   * The `ui-tab` and `ui-tabpanel` set the ARIA roles to `tab` and
   * `tabpanel`, respectively.
   *
   * @usage[jade]
   *   div(cf-ui-tab)
   *     ul(role="tablist")
   *       li(ui-tab="one")
   *       li(ui-tab="two")
   *     div(ui-tabpanel="one")
   *       | content of tab one
   *     div(ui-tabpanel="two")
   *       | content of tab two
   */
  registerDirective('cfUiTab', () => ({
    controllerAs: 'tabController',
    controller: 'UiTabController',
  }));

  registerDirective('uiTab', () => ({
    scope: true,

    link: function (scope, element, attrs) {
      const tabName = attrs.uiTab;
      const tab = scope.tabController.registerControl(tabName);

      attrs.$set('role', 'tab');
      scope.tab = tab;

      element.on('click', () => {
        scope.$apply(tab.activate);
      });

      scope.$watch('tab.active', (isActive) => {
        attrs.$set('ariaSelected', isActive);
      });
    },
  }));

  registerDirective('uiTabpanel', () => ({
    scope: true,

    link: function (scope, element, attrs) {
      const tabName = attrs.uiTabpanel;
      const tabController = scope.tabController;
      const tab = tabController.registerPanel(tabName, element);
      attrs.$set('role', 'tabpanel');
      scope.tab = tab;

      scope.$watch('tab.active', (isActive) => {
        attrs.$set('ariaHidden', !isActive);
      });
    },
  }));

  registerController('UiTabController', function UiTabController() {
    function Tab(controller, name) {
      this.name = name;
      this.activate = () => {
        controller.activate(name);
      };
    }

    const tabs = {};
    let activeTab = null;

    this.registerControl = function (name, element) {
      const tab = this.get(name);
      tab.control = element;

      if (activeTab === null) {
        this.activate(name);
      }
      return tab;
    };

    this.registerPanel = function (name, element) {
      const tab = this.get(name);
      tab.panel = element;
      return tab;
    };

    this.get = function (name) {
      if (!_.isString(name)) {
        throw new TypeError('Tab name must be a string');
      }

      let tab = tabs[name];
      if (!tab) {
        tab = tabs[name] = new Tab(this, name);
      }

      return tab;
    };

    this.getActiveTabName = () => activeTab && activeTab.name;

    this.activate = function (name) {
      if (activeTab) {
        activeTab.active = false;
      }

      if (name) {
        activeTab = this.get(name);
        activeTab.active = true;
      } else {
        activeTab = null;
      }
    };
  });
}
