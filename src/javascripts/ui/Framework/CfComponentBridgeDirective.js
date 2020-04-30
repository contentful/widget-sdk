import { registerDirective } from 'core/NgRegistry';
import createMountPoint from 'ui/Framework/DOMRenderer';
import * as K from 'core/utils/kefir';
import { bindActions } from 'ui/Framework/Store';

export default function register() {
  /**
   * @ngdoc directive
   * @description
   *
   * This directive renders a VDOM tree in its place. The tree is passed
   * bound by the `component` attribute. The value of that attribute is
   * evaluated in the parent scope. Whenever the tree reference updates
   * the component is rerendered.
   *
   * ~~~js
   * {
   *   template: '<cf-component-bridge component="myComponent">'
   *   controller: function ($scope) {
   *     $scope.$watch('myData', render)
   *
   *     function render (data) {
   *       $scope.myComponent = '<h1>Hello world</h1>'
   *     }
   *   }
   * }
   */
  registerDirective('cfComponentBridge', () => ({
    restrict: 'E',
    scope: { component: '=' },
    link: function ($scope, $element) {
      const mountPoint = createMountPoint($element[0]);
      $scope.$watch('component', mountPoint.render);
      $scope.$on('$destroy', mountPoint.destroy);
    },
  }));

  /**
   * @ngdoc directive
   * @description
   *
   * This directive renders store based VDOM applications.
   *
   * These applications consist of a store instance, a list of actions,
   * and a render function. The directive takes care of rerendering
   * whenever the store is updated.
   *
   * Note that this directive does not react to changes on
   * `$scope.component`. The component must be defined _before_ this
   * directive is linked.
   *
   * - `component.store` is a store object created by
   *   `ui/Framework/Store.createStore`.
   * - `component.actions` is an object that maps action names to action
   *   constructors. It is paseed to `ui/Framework/Store.bindActions`.
   * - `component.render` is a function that receives the stores current
   *   state and the bound actions as arguments and produces a React.Element.
   *
   * ~~~js
   * {
   *   template: '<cf-component-store-bridge component="myComponent">'
   *   controller: function ($scope) {
   *     const ActionA = makeCtor();
   *     const ActionB = makeCtor();
   *     const store = createStore(...)
   *
   *     $scope.component = {
   *       store, render,
   *       actions: {ActionA, ActionB}
   *     }
   *
   *     function render (state, actions) {
   *       return <button onClick={() => action.ActionA()}>{state.label}</button>;
   *     }
   *   }
   * }
   */
  registerDirective('cfComponentStoreBridge', () => ({
    restrict: 'E',
    scope: { component: '=' },
    link: function ($scope, $element) {
      const c = $scope.component;
      const actions = bindActions(c.store, c.actions);

      const mountPoint = createMountPoint($element.get(0));

      K.onValueScope($scope, c.store.state$, (state) => {
        mountPoint.render(c.render(state, actions));
      });

      $scope.$on('$destroy', mountPoint.destroy);
    },
  }));
}
