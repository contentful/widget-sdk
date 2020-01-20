# Use React components as Angular directives

React components can be used with the `react-component` directive.

```js
    template:
      '<react-component class="optional-css-class" name="path/to/Component.es6" props="props"/>',
    controller: function($scope) {
      $scope.props = {
        prop1: value1,
        prop2: value2
      };
    }
```

or even better

```js
    template:
      '<react-component component="component" props="props"/>',
    controller: function($scope) {
      $scope.props = {
        prop1: value1,
        prop2: value2
      };
      $scope.component = MyComponent;
    }
```
