> id: UIEP-0006
>
> title: Deprecate non-Hooks state management
>
> champions: Joshua Smock (@jo-sm)
>
> endDate: May 22, 2019
>
> status: *Open*

# [UIEP-0006] Deprecate non-Hooks state management

## Introduction

I propose that, going forward _until we are migrated away from Angular_, we deprecate all non-Hooks state management ("non-Hooks"). In other words, deprecate using our homemade `Store` and Redux, as well as discourage using `setState` for any non-presentational state (e.g. for menu opened/closed state).

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
2. Hooks is built into React, so it will be supported and improved as time goes on
3. There have been somewhat regular discussions about state management in the past, and while it is important especially considering some of the stateful and opaque services we have like `spaceContext`, one of the most important things is to move towards an Angular-less `user_interface` and state management is a lower priority.

Additionally, specifically for Redux: Hooks encourage keeping most of the state local to the component, whereas Redux is a single "global" store, which

## Risks

There are three main risks.

1. Currently it is a challenge to test some Hooks with Enzyme, but an upcoming UIEP to propose migrating to `react-testing-library` will mitigate this.
2. Hooks are new and may evolve in API
3. Existing React code that uses non-Hooks state management should most likely be migrated at some point

The main risks is 1 and 2. since there is not a specific migration path recommended. 3. is more of a potential risk due to tech debt when refactoring components.

## Migration

A migration path is not explicitly recommended. Going forward we should use Hooks, but since the existing state management solutions above are small or built into React, it is not costing us much as far as bundle size is concerned. The only reason that a migration plan would be recommended is if the cost of tech debt (keeping non-Hooks style state management) outweighs keeping them as-is. This is in line with the [recommendation from the official React docs][1] w.r.t. Hooks, as they require a slight change in mindset.

[1]: https://reactjs.org/docs/hooks-intro.html#gradual-adoption-strategy
