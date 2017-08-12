Redux/React-style UIs
=====================

This guide explains how to write Redux/React-style UIs and use them from
Angular.

- [Implementing a store](#implementing-a-store)
- [Using a component from Angular](#using-a-component-from-angular)
- [Actions and render functions](#actions-and-render-functions)
- [Async operations](#async-operations)
- [Differences from Redux](#differences-from-redux)

This approach is currently a work in progress.

## Implementing a store

Implementing a store with our style is conceptually identical to implementing a
store with Redux. However, our style introduces some major syntactical
improvements and makes some behavioral tweaks. The style heavily relies on the
“Tagged Values” pattern described in more detail in the [`utils/TaggedValues`
module](src:TaggedValues).

The following is an example of a simple store implemented with Redux.

```js
import { createStore } from 'redux';

const SetFlag = (value) => ({type: 'SetFlag', value})
// ... more actions

function reducer (state, action) {
  switch (action.type) {
    case 'MyAction':
       state.flag = action.value;
       return state;
    // ... other cases
  }
}

const store = createStore(reducer)
store.dispatch(SetFlag('VALUE'))
```

Within our codebase the same store would be implemented as follows.

```js
import { makeCtor } from 'utils/TaggedValues'
import { createStore, makeReducer } from 'ui/Framework/Store';

const SetFlag = makeCtor('SetFlag')
// 'SetFlag' parameter is optional but helpful for debugging.

const reducer = makeReducer({
  [SetFlag]: (state, value) => {
    state.flag = value;
    return state
  }
})

const store = createStore(reducer)
store.dispatch(SetFlag, 'VALUE')
```

Note that we use tagged values to create action constructors and the
`makeReducer` function instead of a `switch` statement.

To learn about the details, see the [`ui/Framework/Store`][src:store]
documentation. In addition, we provide a detailed list of differences from Redux
below.


## Using a component from Angular

To use a component from Angular we define the mountpoint of the component with
an Angular directive and add a component specification on the scope.

The component specification should be defined in a separate file and consists of
the store instance, the render function, and the available actions. The render
function and actions are further explained below.

```js
const ActionA = makeCtor('ActionA');
// ...
export default function createComponent (someContextParams) {
  const store = createStore(initialValue, reducer),
  // We need a reference so we can call store.dispatch() from async operations.
  return {
    store: store,
    render: (state, actions) => { ... },
    actions: { ActionA, ActionB }
  }
}
```

Using this specification in an existing directive is easy.

```js
angular.directive('myView', ['require', function () {
  var createComponent = require('MyComponent');
  return {
    template:
      '......' +
      '  <cf-component-store-bridge component="component">' +
      '......',
    controller: ['$scope', function ($scope) {
      // Directive logic...

      $scope.component = createComponent($scope.someData)
    }]
  }
}])
```

You can see a component in action in the `app/api/CMATokens` module.

For more information, see the [`cfComponentStoreBridge`][src:bridge-directive].

If you need more flexibility over when and how to render or ignore the store you
can use the [`cfComponentBridge`][src:bridge-directive] directive.


## Actions and render functions

The root render function for a component takes two arguments: The current state
of the store and an actions object. It returns a Virtual DOM tree.

The actions object is a collection of methods that dispatch actions on the
store. These can be called from event handlers to trigger updates in the state.

In the example above the action constructor `ActionA` is added to the `actions`
property of the components spec. This entails that the `actions` object passed
to the render function has a `ActionA` method. Calling this method will dispatch
an action on the store meaning the following are equivalent

```
actionsForRender.ActionA('VALUE');
store.dispatch(ActionA, 'VALUE');
```

Action objects can be created manually with
[`ui/Framework/Store.bindActions`][src:store]. See the `bindActions`
documentation for more information.

## Async operations

Some actions may trigger asynchronous operations that will later dispatch
further actions. Until we have figured out a better pattern the async operations
need to have a reference to the store instance and call `dispatch` on it.

```js
const Request = makeCtor()
const ReceiveResponse = makeCtor()

export default function createComponent (someContextParams) {
  const reducer = makeReducer({
    [Request]: (state, params) => {
      triggerRequest(params);
      return state,
    },
    [ReceiveReponse]: (state, response) => {
      state.response = response;
      return state;
    }
  });

  const store = createStore(initialValue, reducer),

  return { store, render, actions }

  function triggerRequest (params) {
    req(params).then((response) => store.dispatch(ReceiveResponse, response))
  }
}
```


## Differences from Redux

- Arguments to `createStore` are flipped to make it harder to omit
  an initial value.
- When creating a store the reducer is _not_ called once to initialize the
  state.
- `dispatch` takes an action constructor and a value instead of just
  one value.
- Exposes `$state` property instead of `subscribe`.
- No `replaceReducer` method. Using it is an anti pattern.
- For simplicity we don’t support middlewares and `combineReducers` yet.


[src:store]: ../../src/javascripts/ui/Framework/Store.es6.js
[src:bridge-directive]: ../../src/javascripts/ui/Framework/CfComponentBridgeDirective.js
[src:TaggedValues]: ../../src/javascripts/utils/TaggedValues.es6.js
