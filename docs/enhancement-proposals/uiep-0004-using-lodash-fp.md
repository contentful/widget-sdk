> id: UIEP-0004
>
> title: Using `lodash/fp`
>
> champion(s): Markus Lautenbach (@MarkusLaut)
>
> end date: Feb 21, 2019
>
> status: Rejected

# UIEP - Using `lodash/fp`

I'm using the description from the `immer` PR as a base here, for comparability.

## Description

[lodash docs](https://lodash.com/docs)
[lodash fp guide](https://github.com/lodash/lodash/wiki/FP-Guide)
[better, inofficial docs specifically for lodash/fp](https://gist.github.com/jfmengels/6b973b69c491375117dc)

`lodash/fp` is part of `lodash`, which we already use (same implementations with a slightly different interface) that allows you to work with immutable state in a more convenient way.

`lodash` provides general use utility functions which help to not reimplement these and we already use it through our codebase.
`lodash/fp` provides the same functions, but guarantees that all updates are immutable (updated structure is returned, arguments unchanged).

## Use Cases

* `lodash/fp` for reducers: both in `redux` and `useReducer` hook.
* `lodash/fp` for complex `setState` in class components
* (optional) `lodash/fp` with `flow` to compose functions into more complex functions; in my experience this results in less layers of helper functions and less variables to keep track of; e.g. reducers, selectors, request control, ...

##  API

`lodash/fp` exposes `lodash` functions with a different argument order (see docs above).

```set(path, value, object) => updatedObject```

(The functions are also precurried, meaning they take arguments in any number of calls. But that only matters when using them with `flow`)

## Example

```js
import { set } from 'immer';

const baseState = [
  { todo: 'Use React in Web app', done: true },
  { todo: 'Get rid of Angular', done: false }
];

(state) =>{
  const stateWithTodo = state.concat({ todo: 'Start using immer', done: false });
  return set([1, 'done'], true, stateWithTodo);
});
```

### React.setState example

```js
/**
 * Classic React.setState with a deep merge
 */
onBirthDayClick1 = () => {
    this.setState(prevState => ({
        user: {
            ...prevState.user,
            age: prevState.user.age + 1
        }
    }))
}

/**
 * ...But, since setState accepts functions,
 * we can just use precurried functions from lodash/fp and further simplify!
 */
import {update, add} from 'lodash/fp';

onBirthDayClick2 = () => {
    this.setState(update('draft.user.age', add(1))
}
```

### Reducer example

Here is a simple example of the difference that `lodash/fp` could make in practice.

```js
// Redux reducer
// Shortened, based on: https://github.com/reactjs/redux/blob/master/examples/shopping-cart/src/reducers/products.js
export const reducer = (state = {}, action) => {
    switch (action.type) {
        case 'RECEIVE_PRODUCTS':
            return {
                ...state,
                ...action.products.reduce((obj, product) => {
                    obj[product.id] = product
                    return obj
                }, {})
            }
        default:
            return state
    }
}
```

After using `lodash/fp`, that simply becomes:

```js
import { keyBy, merge } from 'lodash/fp'

export const reducer = produce((state = {}, action) => {
    switch (action.type) {
        case 'RECEIVE_PRODUCTS': {
          const productsById = keyBy('id', action.products);
          return merge(state, productsById);
        }
    }
   return state;
};
```

You will have to ensure that some state is always returned or `redux` will throw `Uncaught Error: Reducer returned undefined when handling action`.

## Pros

* Immutability using powerful utility functions we already do and should use, provided by the most widely used utility library
* No need to wrap functions
* All functions are already typed with Typescript: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/lodash/fp.d.ts
* Deep updates are a breeze (using `set` or `update` or `...Deep` function variants; `update` is well suited to be used with other functions in a pre-curryied way and with `flow`)
* Boilerplate reduction. Less noise, more concise code.
* No additional lib required
* No dependencies on advanced JS features, it's just function calls

## Cons
* multiple function applications on the same argument need to use the return value of the previous call, meaning intermediate `const`s are required (or use `flow`)
* need to learn `lodash` functions and their `fp` variant interface
* official documentation for `fp` specifically is not great (but see inofficial documentation)

## Learnings

`lodash` and `lodash/fp` can be confusing initially, with it's very abstract functions and (for `fp`) different argument order.

Thanks for @suevalov to point out and handle the circular references.
I simply took token values the angular uses and didn't realize that.

### Links
* [Dipping a toe into functional JS with lodash/fp](https://simonsmith.io/dipping-a-toe-into-functional-js-with-lodash-fp/)
* [Function Composition with Lodash](https://hackernoon.com/function-composition-with-lodash-d30eb50153d1)
* [lodash docs](https://lodash.com/docs)
* [lodash fp guide](https://github.com/lodash/lodash/wiki/FP-Guide)
* [better, inofficial docs specifically for lodash/fp](https://gist.github.com/jfmengels/6b973b69c491375117dc)
