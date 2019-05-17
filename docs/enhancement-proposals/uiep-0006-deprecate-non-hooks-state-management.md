> id: UIEP-0006
>
> title: Deprecate non-React based state management
>
> champions: Joshua Smock (@jo-sm)
>
> endDate: May 22, 2019
>
> status: *Open*

# [UIEP-0006] Deprecate non-React based state management

## Introduction

I propose that, going forward _until we are migrated away from Angular_, we deprecate all non-React based state management. In other words, deprecate using our homemade `Store` and Redux.

## Description

In the current UI codebase, we have many ways to handle stateful components:

1. `ui/Framework/Store.es6.js` (Redux-like store used in e.g. Environments)
2. Calling `setState` directly
3. Redux
4. Hooks

Although there is a general direction of how we approach managing state, there is no strong consensus; some teams choose to use Hooks primarily, other teams choose to use Redux primarily, and this causes fragmentation in determining where state lives in the application. This fragmentation adds another piece of complexity when migrating an existing component or creating a new component.

As mentioned in the introduction above, this proposal is intended to deprecate non-Hooks until we are migrated fully to React. Once we have migrated to React we can revisit this topic and determine which state management (global, local, or both) we want to use.

## Motivation

My main motivation for this proposal are a few things:

1. Fragmentation makes it difficult to figure out which solution to use (there is no "blessed" or default solution)
2. Hooks is built into React, and are not alpha, and so will be supported and improved as time goes on
3. There have been somewhat regular discussions about state management in the past, and while it is important especially considering some of the stateful and opaque services we have like `spaceContext`, one of the most important things is to move towards an Angular-less `user_interface` and state management is a lower priority, especially global state management.

Additionally, specifically for Redux: Hooks encourage keeping most of the state local to the component, whereas Redux is a single "global" store, which may add confusion or complexity when creating a new stateful component.

## Risks

There are three main risks.

1. Currently it is a challenge to test some Hooks with Enzyme, but [UIEP-0007 Replace Enzyme with React Testing Library][2] will mitigate this.
2. Hooks are new and may evolve in API specification
3. Hooks have a learning curve
4. Existing React code that uses non-Hooks state management should most likely be migrated at some point

The main risks is 1 and 2. I do not feel that 1. is a strong risk as we already are writing components using hooks, but especially more complicated components using `useEffect` will be challenging to test without `react-testing-library`. 2 is a potential risk but since the API is public and React major versions do not change significantly often this is an acceptable risk. 3. is a risk with any new technology so I also don't feel it's a strong risk. 4. is more of a potential risk due to tech debt when refactoring components and is dependent on if we as a chapter feel it is something that needs to be migrated.

## Migration

A migration path is not explicitly recommended. Going forward we should use Hooks (and for simpler components, `setState`), but since the existing state management solutions above are small or built into React, it is not costing us much as far as bundle size is concerned. The only reason that a migration plan would be recommended is if the cost of tech debt (keeping non-React style state management) outweighs keeping them as-is. For hooks specifically, this is in line with the [recommendation from the official React docs][1], as they require a slight change in mindset.

[1]: https://reactjs.org/docs/hooks-intro.html#gradual-adoption-strategy
[2]: https://github.com/contentful/user_interface/pull/4380
