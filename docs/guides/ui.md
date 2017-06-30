Building UIs
============

This document outlines how we write code for UI.

The currently preferred approach is a mixture of Angular and React style.
However there is legacy code that uses Angular directives and Jade templates.
Both are explained below, including a migration strategy.

The current approach is also only an intermediate step towards React-style UIs.

To learn more about the implementation go to
`src/javascripts/ui/Framework/README.md`. To learn more about testing UI, see
the [Testing Guide](./testing.md)

## Quick start

The following is a simple example how to define a Angular directive that uses
React-style rendering.

```js
angular.directive('myView', ['require', function () {
  var h = require('ui/Framework').h;
  return {
    template: '<cf-component-bridge component="component">',
    controller: ['$scope', function ($scope) {
      var state = {
        increment () {
          state.count += 1;
          update();
        }
        count: 0,
      };

      update();

      function update () {
        $scope.component = render(state);
      }
    }]
  }

  function render ({increment, count}) {
    return h('button', {
      onClick: increment
    }, [
      `Clicked ${count} times`
    ])
  }
}])
```


## The `h()` API

- arity (1) generates an empty element:
  `h('div') // '<div></div>'`
- arity (2) takes:
  either `h(elSpec, objOfAttrs)` or `h(elSpec, arrayOfChildren)`
- arity (3) takes:
  `h(elSpec, objOfAttrs, arrayOfChildren)`
- dashed attributes are used "as is":
  `h('div', {'foo-bar': 'baz'}) // '<div foo-bar="baz"></div>'`
- camel-cased attributes are converted to dashed attributes:
  `h('div', {fooBar: 'baz'}) // '<div foo-bar="baz"></div>'`
- `true` indicates an attribute w/o a value:
  `h('div', {someAttr: true}) // '<div some-attr></div>'`
- Attribute values must be strings or `true`, except for styles and event
  handlers. `h('div', {count: String(10)})`.
- definition classes are merged with `class` attribute:
  `h('.clazz', {class: 'klass'}) // '<div class="clazz klass"></div>'`
- children must always be provided as an array:
  `h('div', ['foo', h('span', ['bar'])]) // '<div>foo<span>bar</span></div>'`
- Falsy children are ignore
  `h('p', ['foo', null]) // '<p>foo1/p>'`
- children that are not VTrees, strings, or falsy trigger an error:
  `h('p', ['foo', {}])`

Styles are provided as objects and converted to CSS rule declarations

```js
h('div', {
  styles: {
    fontFamily: 'sans-serif',
    fontSize: '100px',
    color: 'red',
  }
}, ['yolo']);
```


## Migrating Legacy Directives

Legacy directives use string templates declared with hyperscript. The string
templates use the `h()` function from the deprecated `util/hyperscript`.

```js
{
  template: h('ul', {ngRepeat: 'item in items'}, [
    h('li', {
      ngClick: 'clickItem(item.id)',
      ngIf: 'item.enabled'
    } ['{{item.text}}'])
  ]),
  controller: function ($scope) {
    $scope.items = ...
    $scope.clickItem = ...
  }
}
```

To convert these directives one needs to use the `h()` function from
`ui/Framework` and rewrite the template by replacing all structural Angular
directives.

```js
{
  template: '<cf-component-bridge component="component">'
  controller: ['$scope', function ($scope) {
    var state = {
      items: ...
      clickItem () {
        // do the work
        update()
      }
    };

    update();

    function update () {
      $scope.component = render(state);
    }

    function render ({items, clickItem}) {
      return h('ul', item.map((item) => {
        if (item.enabled) {
          return h('li', {
            onClick: clickItem(item.id),
          } [item.text])
        }
      }))
    }
  }]
}
```

## Legacy Jade templates

Some directives use Jade files as their templates, like so:
```js
angular.directive('jadeDirective', function () {
  return {
    templates: JST.my_template(),
    // ...
  }
})
```

Jade templates can be converted to equivalent Javascript code using the
`bin/jade-to-h` script and some manual fixes.
