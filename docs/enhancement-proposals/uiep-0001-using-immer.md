---
id: UIEP-0001
title: Using immer
champions: ['Alex Suevalov (@suevalov)']
endDate: February 21th, 2019
---

# [UIEP-0001] Using `immer`

## Description

[immer repository](https://github.com/mweststrate/immer)

It's a tiny package ([4.4Kb](https://bundlephobia.com/result?p=immer@2.0.0)) that allows you to work with the immutable state in a more convenient way.

The basic idea is that you will apply all your changes to a temporarily `draft` state, which is a proxy of the `current` state. Once all your mutations are completed, `immer` will produce the `next` state based on the mutations to the draft state. This means that you can interact with your data by simply modifying it while keeping all the benefits of immutable data.

## Use Cases

* `immer` for reducers: both in `redux` and `useReducer` hook.
* `immer` for complex `setState` in class components

##  API

The Immer package exposes a default function that does all the work.

```produce(currentState, producer: (draftState) => void): nextState```

## Example

```js
import produce from 'immer';

const baseState = [
  { todo: 'Use React in Web app', done: true },
  { todo: 'Get rid of Angular', done: false }
];

const nextState = produce(baseState, draftState =>{
  draftState.push({ todo: 'Start using immer', done: false });
  draftState[1].done = true;
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
 * we can just create a curried producer and further simplify!
 */
onBirthDayClick2 = () => {
    this.setState(
        produce(draft => {
            draft.user.age += 1
        })
    )
}
```

### Reducer example

Here is a simple example of the difference that Immer could make in practice.

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

After using Immer, that simply becomes:

```js
import produce from "immer"

const initialState = {};

export const reducer = produce((state, action) => {
    switch (action.type) {
        case 'RECEIVE_PRODUCTS':
            action.products.forEach(product => {
                state[product.id] = product
            })
            return;
    }
}, initialState);
```

Notice that it is not needed to handle the default case, a producer that doesn't do anything will simply return the original state.

## Pros

* Immutability with normal JavaScript objects and arrays. No new APIs to learn!
* Strongly typed and works perfectly with Typescript
* Deep updates are a breeze
* Boilerplate reduction. Less noise, more concise code.
* Small size

## Cons

* Immer with proxies is roughly speaking twice to three times slower as a handwritten reduce.
* By default produce tries to use proxies for optimal performance. However, on older JavaScript engines `Proxy` is not available. In our case, it's [just IE11](https://caniuse.com/#search=Proxy). In such cases, Immer will fallback to an ES5 compatible implementation which works identically, but roughly twice slower.

## Learnings

`immer` requires state in Redux to be serializable, it means no circular references in objects. It turned out that token reducer has data with circular references which is a bug, so I had to get rid of circular references before putting it in Redux.

### Links
* [immer repository](https://github.com/mweststrate/immer)
* [The Rise of Immer in React](https://www.netlify.com/blog/2018/09/12/the-rise-of-immer-in-react/)
* [Talk: Immer Immutability made easy](https://www.youtube.com/watch?v=-gJbS7YjcSo)
