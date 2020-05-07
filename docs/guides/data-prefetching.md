# Data prefetching

This mechanism is used to fetch needed data based route and org role (and potentially more conditions in the future).

**Currently not to be used outside the Teams feature.**

This uses the term `dataset` for collections of entities that contain `sys.id` and optionally contains Links in `sys`, e.g. Users and Teams.

See selector tests for documentation of behaviour: `redux/selectors/access.spec.js`.
Also use the redux dev tools to inspect behaviour and state during runtime.

## Loading defined datasets for routes

Add your route including datasets to load here: `redux/routes.es6.js`
```js
const ROUTES = {
  organization: {
    path: '/account/organizations/:orgId',
    children: {
      teams: {
        path: '/teams',
        requiredDataSets: [TEAMS, TEAM_MEMBERSHIPS],
        feature: 'teams',
        children: {
          team: {
            path: '/:teamId',
            requiredDataSets: [
              USERS,
              ORG_MEMBERSHIPS,
              TEAM_SPACE_MEMBERSHIPS,
              ORG_SPACES,
              { orgRoles: ['admin', 'owner'], datasets: [ORG_SPACE_ROLES] }
            ]
          }
        }
      },
      projects: {
        path: '/projects',
        requiredDataSets: [USERS, ORG_SPACES, ORG_MEMBERSHIPS],
        children: {
          project: {
            path: '/:projectId'
          }
        }
      }
    }
  },
  space: {
    path: '/spaces/:spaceId'
  }
};
```
Note that child routes inherit required datasets from ancestors (which is desired behaviour in most cases).

Data will be refetched on user navigation, similar to how data is refetched when react lifecycles are used.
There is a limit how often this will happen, defined here (`MAX_AGE`): `redux/selectors/datasets.es6.js`

Limiting for which roles a dataset is to be fetched is optional, if just the constant is given it will always be fetched for that route.

## Checking for dataset loading

To get if required datasets are loaded or not (`isMissingRequiredDatasets`): `redux/selectors/datasets.es6.js`
This will also be true in case of an error. Errors are currently not distinguishable, as there is no recovery for failed loading of datasets and it has to be treated as a bug (fail fast).

## Using loaded datasets

The 'basic' way to get a dataset is to get the map of all datasets via `getDatasets` selector and use the dataset key on it: `redux/selectors/datasets.es6.js`
This will also resolve links, given
 - the link type equals the dataset constant (e.g. USERS => `User`, corresponds with `{ linkType: User }`)
 - the dataset the link points to is loaded (this will update if it's loaded later because it's `redux`)
 - the link is in `sys` (e.g. org memeberships have a duplicated `user` link outside `sys` for some reason and that will not be resolved)

Based on `getDatasets` and other selectors, more specific selectors can be created and many already exist in `redux/selectors`, e.g.:
 - `getRolesBySpace`
 - `getOrgMemberships`: filters out old-style invitations
 - `getCurrentTeamMembershipList`: sorted list of all members of current team (currently determined only by path param)