> id: UIEP-0012
>
> title: React Space Context API
>
> champions: Cezar Sampaio, Tanya Bessonova, Aleksandr Suevalov, Josh Smock, Johann Röhl
>
> endDate: Aug 18, 2020
>
> status: Approved

# [UIEP-0012] React Space Context API

## Introduction

The React Migration Team is going to refactor the space context on the `user_interface` repo to a React Context solution.

## Description

The current `spaceContext` is living in Angular and is responsible for a lot of things, for example:

- Listen to space changes. Example: when users navigate from one space to another or away from it.
- Provide space data to other Angular services, controllers, and even for React components by using `getModule`
- Provides commonly used functions such as `isMasterEnvironment`, `getEnvironmentId`, `getId`, `getAliasesId`, etc
- Initialize and load some dependencies

In summary, the solution is going to be a React Context Provider on top of the application that is going to pass the data down to the components whenever the user changes to a different space. The components will access the data through the `useSpaceEnvContext` hook for function component, `this.context` or `SpaceEnvContext.Provider`.

##### Author's preferred solution

```js
// SpaceEnvContext/SpaceEnvContextProvider.js
import React, { createContext, useMemo } from 'react';
import { getModule } from 'core/NgRegistry';
import { getSpaceId, getSpaceName } from 'SpaceEnvContext/utils.js';

function getSpaceContext() {
  return getModule('spaceContext') ?? null;
}

export const SpaceEnvContext = createContext({});

export function SpaceEnvContextProvider(props) {
  const spaceEnvContext = useMemo(() => getSpaceContext(), []);

  // We return the most common values and the space context instance as well
  const value = {
    spaceId: getSpaceId(spaceContext),
    spaceName: getSpaceName(spaceContext),
    space: spaceContext,
  }

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
}

// SpaceEnvContext/utils.js
export function isAdmin(space) {
  return space.spaceMember.admin ?? false;
}

export function getSpaceId(space) {
  return space?.data?.sys.id ?? null;
}

export function getSpaceName() {
  return space?.data?.name ?? null;
}

// TestComponent.js
import { useSpaceEnvContext } from 'SpaceEnvContext/SpaceEnvContext.js';
import { isAdmin } from 'SpaceEnvContext/utils.js';

function Test() {
  const { space, spaceId } = useSpaceEnvContext();

  return isAdmin(space) ? (
    <h1>Hello Admin! Your space is: {spaceId}</h1>
  ) : (
    <h1>You cannot see this page!</h1>
  );
}
```

Pros

- Easier to maintain, all utilities will be located into the same file, separated from the provider, deleting methods won't have impact on any other method for example
- Easier to test in case of unit tests, they will be pure functions so we can mock or pass any desired value as parameter
- Webpack can do dead code elimination (tree shaking)
- It's statically analyzable, we can use tools like Webpack Analyzer

Cons

- `SpaceEnvContext` must be wrapped on every test that uses `useSpaceEnvContext`

#### Alternative approach/solution

The main difference is that utility functions will be exported by the provider in this case. We wouldn't have the `SpaceEnvContext/utils.js` file, for example.

```js
// SpaceEnvContext/SpaceEnvContextProvider.js
import React, { createContext, useMemo } from 'react';
import { getModule } from 'core/NgRegistry';

function getSpaceContext() {
  return getModule('spaceContext') ?? null;
}

export const SpaceEnvContext = createContext({});

export function SpaceEnvContextProvider(props) {
  const spaceEnvContext = useMemo(() => getSpaceContext(), []);

  // More utilities will come here
  function isAdmin() {
    return spaceContext.data?.spaceMember.admin ?? false;
  }

  function getSpaceId() {
    return spaceContext.data?.sys.id ?? null;
  }

  function getSpaceName() {
    return spaceContext.data?.name ?? null;
  }

  // We return the most common values and the space context instance as well + not so used as methods
  const value = {
    spaceId: getSpaceId(spaceContext),
    spaceName: getSpaceName(spaceContext),
    space: spaceContext,

    // Not so used and exported as methods
    isAdmin,
  }

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
}

// TestComponent.js
import { useSpaceEnvContext } from 'SpaceEnvContext/SpaceEnvContext.js';

function Test() {
  const { space, spaceName spaceId, isAdmin } = useSpaceEnvContext();

  return isAdmin() ? (
    <h1>Hello Admin! Your space is: {spaceId}. Name: {spaceName}</h1>
  ) : (
    <h1>You cannot see this page!</h1>
  );
}
```

#### Other potential solutions

- Framework agnostic singleton service
- Observables

We discussed these other two possible solutions, however the application is going to be pretty much React at the end of the migration and it seemed to us that a React Context is the perfect solution for this case because we are able to listen to changes on the space data and at the same time provide this new updated data to all children components so updating the UI for our users. 

## Motivation

It's a natural and expected refactor as we follow our ultimate goal which is to remove Angular completely out of the `user_interface`.

Much has been discussed because this will affect the way we are used to use the information deriving from the current `spaceContext` and we want to make sure we will have a friendly API for experts and newcomers to the project. 

## Risks

No risks identified.

## Migration

1. Create the space context provider.
1. Refactor all react components to start using the new provider, by doing this, we will figure out if we need to add more utilities
1. Start refactoring the logic out of Angular service to smaller methods and implement them on this provider
1. Implement react router and fetch required space data when the app initialize with the new methods and provider
1. Implement “listeners” for when spaces are changed so we could tell the components in the tree to render again

## Outcome

The UIEP has been approved.

Main requests:

- Change the name to `SpaceEnvContext` because a space is also followed by an environment
- Added cons for the preferred solution

---

**Footnotes**

Much has been discussed and learned about the next space context approach. You can find all of those discussions through the links:

- https://contentful.atlassian.net/browse/REACT-345 - Space Context POC
- https://contentful.atlassian.net/browse/REACT-327 - Space Context Spike
- https://github.com/orgs/contentful/teams/chapter-frontend/discussions/1 - Github Discussion
- https://github.com/contentful/user_interface/pull/6438 - POC Pull Request (active)