Hyperscript
===========

You can use hyperscript to generate HTML strings that can be used as templates.

Note: Jade templates are deprecated, Hyperscript should be used instead for new components!

## Usage example

Directive and template in one file (preferable for smaller templates):

```js
// this is an excerpt from space_settings_directive.js

import {h} from 'utils/hyperscript';

const workbenchContent = h('.workbench-main__middle-content', [
  h('.cfnext-form__field', [
    h('label', {for: 'space-id'}, ['Space ID:']),
    h('input#space-id.cfnext-form__input--full-size',
      {type: 'text',
        value: '{{spaceId}}',
        readonly: 'readonly',
        cfSelectAllInput: true}),
    h('.cfnext-form__field', [
      h('label', {for: 'space-name'}, ['Space name:']),
      h('input#space-name.cfnext-form__input--full-size',
        {type: 'text', ngModel: 'model.name'})
    ])
  ])
]);
```

Template in a separate file:

```js
// spaceSettingsTemplates.es6.js
import {h} from 'utils/hyperscript';

export function form () {
  const actions = [
    h('button.btn-caution',
      {uiCommand: 'openRemovalDialog'},
      ['Remove space and all its contents']
    ),
    h('button.btn-primary-action', {uiCommand: 'save'}, ['Save'])
  ];

  const content = [
    h('.cfnext-form__field', [...])
  ];

  return simpleWorkbench('Space settings', 'page-settings', actions, content);
}
```

```js
// spaceSettingsDirective.js
angular.module('contentful')

.directive('cfSpaceSettings', ['require', function (require) {
  var templates = require('components/tabs/space_settings/space_settings_templates');

  return {
    template: templates.form(),
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}]);
```


## API remarks

- arity (1) generates an empty element:
  `h('div') // '<div></div>'`
- arity (2) takes:
  either `h(elSpec, objOfAttrs)` or `h(elSpec, arrayOfChildren)`
- arity (3) takes:
  `h(elSpec, objOfAttrs, arrayOfChildren)`
- void elements are not being closed:
  `h('input') // '<input>'`
- tag defaults to `div`:
  `h('#test') // '<div id="test"></div>'`
- definition ID overrides the ID attribute:
  `h('#test', {id: 'boo'}) // '<div id="test"></div>'`
- classes and ID can be mixed:
  `h('#test.foo.bar') // '<div id="test" class="foo bar"></div>'`
- dashed attributes are used "as is":
  `h('div', {'foo-bar': 'baz'}) // '<div foo-bar="baz"></div>'`
- attribute values are escaped:
  `h('div', {foo: 'quotes: ""!'}) // '<div foo="quotes: &quot;&quot;!"></div>'`
- camel-cased attributes are converted to dashed attributes:
  `h('div', {fooBar: 'baz'}) // '<div foo-bar="baz"></div>'`
- definition classes are merged with `class` attribute:
  `h('.clazz', {class: 'klass'}) // '<div class="clazz klass"></div>'`
- children must always be provided as an array:
  `h('div', ['foo', h('span', ['bar'])]) // '<div>foo<span>bar</span></div>'`
- children that are no strings or numbers are ignored:
  `h('p', ['foo', 100, false && 'boom']) // '<p>foo100</p>'`
- `true` indicates an attribute w/o a value:
  `h('div', {someAttr: true}) // '<div some-attr></div>'`


## Helper for inline styles

You can provide the `style` attribute as an object. Camel-cased properties will be converted:

```js
// we don't touch strings:
h('div', {style: 'color: red'}) // '<div style="color: red"></div>'

// but you can also:
h('div', {
  style: {
    fontFamily: 'sans-serif',
    fontSize: '100px',
    color: 'red',
    // you can still mix camelCased and dashed-properties:
    'z-index': 100
  }
}, ['yolo']);
// '<div style="font-family: sans-serif;font-size: 100px;color: red;z-index: 100">yolo</div>'
```
