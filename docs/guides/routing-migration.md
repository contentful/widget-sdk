# Migrating Angular ui-router to react-router

A step-by-step approach to migrate from Angular UI Router to React Router v6.

## Links

- React Router v6 docs: https://github.com/ReactTraining/react-router/tree/dev/docs
- API Reference for React Router v6: https://github.com/ReactTraining/react-router/blob/dev/docs/api-reference.md
- Working with Query Params in React Router
  v6: https://github.com/ReactTraining/react-router/blob/dev/docs/advanced-guides/working-with-the-search-string.md

## Description of the approach

React Migration team came up with an approach that will allow us to migrate from Angular UI Router to React Router step
by step, view by view. This requirement was the most important one and all decisions that were taken were optimized to
satisfy this requirement.

Simplified, an approach consists of several simple steps:

1. Replace a leaf of Angular Router configuration with a React Router.
2. Add definitions of the new links to `core/react-routing/routes.ts`
3. Replace all relative links (like `^.list` to absolute once) with new absolute values created at the previous step.
4. Change how route parameters are read.

Let's take a look at each step in detail.

### Replace a leaf of Angular Router configuration with a React Router.

For
example, [locale settings configuration](https://github.com/contentful/user_interface/blob/master/src/javascripts/states/settingsLocales.js#L54-L75):

```jsx
// before

export const localesSettingsState = {
  name: 'locales',
  url: '/locales',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: LocalesListRoute,
    },
    {
      name: 'new',
      url: '_new',
      component: withUnsavedChangesDialog(LocalesNewRoute),
    },
    {
      name: 'detail',
      url: '/:localeId',
      component: withUnsavedChangesDialog(LocalesEditRoute),
    },
  ],
};

// after

import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';

const LocaleRouter = () => {
  const [basename] = window.location.pathname.split('locales');

  return (
    <CustomRouter splitter="settings/locales">
      <RouteErrorBoundary>
        <Routes basename={basename + 'locales'}>
          <Route
            name="spaces.detail.settings.locales.list"
            path="/"
            element={<LocalesListRoute />}
          />
          <Route
            name="spaces.detail.settings.locales.new"
            path="/new"
            element={<UnsavedNewRoute />}
          />
          <Route
            name="spaces.detail.settings.locales.detail"
            path="/:localeId"
            element={<UnsavedEditRoute />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const localesSettingsState = {
  name: 'locales',
  url: '/locales{pathname:any}',
  params: {
    navigationState: null,
  },
  component: LocaleRouter,
};
```

Basically, we're delegating everything after `/locales/` to our LocaleRouter component and the JSX inside this component
a typical React Router configuration with the only difference that we're using `CustomRouter` as a wrapper of everything
here.

What does `CustomRouter` do? It maps initial parameters from Angular UI Router into React Router params and creates a
router that allows us to use React Router hooks and structure our code in a way if it were a usual React application.

### 2. Add definitions of the new links to `core/react-routing/routes.ts`

In this part we need to write several route functions that will allow us to transform links from React Router to
Angular `$state.go` calls.

This part is a bit explicit but it allows us to achieve type-safety and allows to simplify using links inside of the
application (you will see this in the last step)

```tsx
type LocalesListRouteType = { path: 'locales.list' };
type LocalesNewRouteType = { path: 'locales.new' };
type LocalesDetailRouteType = { path: 'locales.detail'; localeId: string };

type LocalesRouteType = LocalesListRouteType | LocalesNewRouteType | LocalesDetailRouteType;

const localesRoutes = {
  'locales.list': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings.locales'),
    params: {
      pathname: '/',
    },
  }),
  'locales.new': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings.locales'),
    params: {
      pathname: '_new',
    },
  }),
  'locales.detail': (env: EnvironmentParams, params: Omit<LocalesDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.locales'),
    params: {
      pathname: `/${params.localeId}`,
    },
  }),
};

// when you need to pass a navigationState parameter

type UsersListRouteType = {
  path: 'users.list';
  navigationState?: {
    jumpToRole?: string;
  };
};

const usersListRoutes = {
  'users.list': (env: EnvironmentParams, params?: Omit<UsersListRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.users'),
    params: {
      pathname: '/',
      navigationState: params?.navigationState,
    },
  }),
};

export const routes = {
  ...localesRoutes,
  ...usersListRoutes,
};
```

This abstraction layer allows us to encapsulate transformation from Angular UI to React Router links, so while
refactoring our application further we will change only details of this abstraction layer without touching the other
parts of the application.

### 3. Replace all relative links with absolute ones.

#### 3.1 Links from a different react-router leaf

Find all links in the applications that were referring to the previous route configuration:

- relative links links `^.list`, `^.details`
- or absolute links like `['spaces', 'environment', 'locales', 'list']`
  or `spaces.environment.locales.list`

Replace these links with our functions created on the previous step and their alternatives that wraps our existing ways
of navigation:

```jsx
import { ReactRouterLink } from 'core/react-routing';

// before

<StateLink path="^.detail" params={{ localeId: locale.sys.id }}>...</StateLink>

// after

<ReactRouterLink route={{ path: 'locales.detail', localeId: locale.sys.id }}>...</ReactRouterLink>
```

```jsx
import { ReactRouterRedirect } from 'core/react-routing';

// before

<StateRedirect path="^.list" />;

// after

<ReactRouterRedirect route={{ path: 'locales.list' }} />;
```

```jsx
import { router } from 'core/react-routing';

// before

Navigator.go({ path: '^.detail', params: { localeId: locale.sys.id } });

// after

router.navigate({ path: 'locale.detail', localeId: locale.sys.id });
```

#### 3.2 Links within the same react-router tree

Find all links in the applications that were referring to the previous route configuration:

- relative links links `^.list`, `^.details`
- or absolute links like `['spaces', 'environment', 'locales', 'list']`
  or `spaces.environment.locales.list`

Replace these links with our functions created on the previous step and their alternatives that wraps our existing ways
of navigation. You can refer
to [react-router Link documentation for specific properties](https://github.com/ReactTraining/react-router/blob/dev/docs/api-reference.md#link)
.

```jsx
import { RouteLink } from 'core/react-routing';

// before

<StateLink path="^.detail" params={{ localeId: locale.sys.id }}>...</StateLink>

// after

<RouteLink route={{ path: 'locales.detail', localeId: locale.sys.id }}>...</RouteLink>
```

```jsx
import { RouteNavigate } from 'core/react-routing';

// before

<StateRedirect path="^.list" />;

// after

<RouteNavigate route={{ path: 'locales.list' }} replace />;
```

```jsx
import { useRouteNavigate, withRouteNavigate } from 'core/react-routing';

// before

Navigator.go({ path: '^.detail', params: { localeId: locale.sys.id } });

// after

// when calling from a functional component

const navigate = useRouteNavigate();
navigate({ path: 'locales.detail', localeId: locale.sys.id });

// when calling from a class component

const ComponentWithNavigate = withRouteNavigate(Component);

// inside Component
this.props.navigate({ path: 'locales.detail', localeId: locale.sys.id });
```

### 4. Change how route params are read

All routes params are not passed into route components as properties anymore but have to be consumed using ReactRouter
hooks.

```jsx
import { QueryParam, useNavigationState, useParams, useQueryParams } from 'core/react-routing';

// For path params, like`/locales/:localeId`

const { localeId } = useParams();

// For navigation state (params what are not visible in the URL but are passed from one route to another)

const { jumpToRole } = useNavigationState();
```

For query params like `/test?foo=bar` refer
to ["Working with the Search/Query String" guide](https://github.com/ReactTraining/react-router/blob/dev/docs/advanced-guides/working-with-the-search-string.md)
.

## Next steps

Step by step, we'll be able to have only several `CustomRouter` in the
application and it will be the point of the final PR which replaces `CustomRouter` with `BrowserRouter` and completely
removes Angular UI Router from the application.
