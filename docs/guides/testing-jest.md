# Testing with Jest

## Table of Contents

- [Testing with Jest](#testing-with-jest)
  - [Table of Contents](#table-of-contents)
  - [Running tests](#running-tests)
  - [Filename Conventions](#filename-conventions)
  - [_(Deprecated)_ Testing components with Enzyme](#deprecated-testing-components-with-enzyme)
    - [Enzyme](#enzyme)
      - [Shallow rendering with `Enzyme.shallow`](#shallow-rendering-with-enzymeshallow)
      - [Full Rendering API with `Enzyme.mount`](#full-rendering-api-with-enzymemount)
      - [Static Rendering API with `Enzyme.render`](#static-rendering-api-with-enzymerender)
      - [`shallow` vs. `mount` vs. `render`](#shallow-vs-mount-vs-render)
    - [Jest](#jest)
      - [Snapshots [deprecated]](#snapshots-[deprecated])
  - [Writing tests](#writing-tests)
    - [Unit vs Component tests](#unit-vs-component-tests)
    - [React Testing Library](#react-testing-library)
      - [Cheatsheet](#cheatsheet)
      - [Async Utils](#async-utils)
      - [Testing custom react hooks](#testing-custom-react-hooks)
    - [Matchers](#matchers)
    - [Mocks](#mocks)
      - [Faker Library](#faker-library)
      - [Mock functions](#mock-functions)
      - [mockResolveValue vs mockReturnValue vs mockRejectedValueOnce](#mockResolveValue-vs-mockReturnValue-vs-mockRejectedValueOnce)
      - [What not to mock](#What-not-to-mock)
      - [Modals](#modals)
      - [Mock Angular modules](#mock-angular-modules)
  - [Skipping tests](#skipping-tests)
  - [Debugging tests](#debugging-tests)
    - [Debugging Tests in Chrome](#debugging-tests-in-chrome)
    - [Debugging Tests in Visual Studio Code](#debugging-tests-in-visual-studio-code)
  - [Migration to Jest from Karma](#migration-to-jest-from-karma)
    - [If your tests have no Angular dependencies](#if-your-tests-have-no-angular-dependencies)
    - [If your tests have Angular dependencies and use injection](#if-your-tests-have-angular-dependencies-and-use-injection)
      - [Proper way](#proper-way)
      - [Quick way](#quick-way)
  - [Resources](#resources)

## Running tests

Jest is a Node-based runner. This means that the tests always run in a Node environment and not in a real browser. This lets us enable fast iteration speed and prevent flakiness.

While Jest provides browser globals such as window thanks to jsdom, they are only approximations of the real browser behavior. Jest is intended to be used for unit tests of your logic and your components rather than the DOM quirks.

```bash
# Run tests in interactive mode
npm run jest
```

```bash
# Run tests and generate coverage report
npm run jest:coverage
```

```bash
# Run tests in debug mode
npm run jest:debug
```

```bash
# Run tests in debug mode in command-line, instead of inspector protocol
npm run jest:cli-debug
```

## Filename Conventions

Jest will look for test files with `.spec.js` suffix in `src/javascripts` folder.

The files can be located at any depth under the `src/javascripts` folder.

It's recommended to put the test files next to the code they are testing so that relative imports appear shorter. For example, if `App.spec.js` and `App.js` are in the same folder, the test just needs to import App from './App' instead of a long relative path. Colocation also helps find tests more quickly in larger projects.

## _(Deprecated)_ Testing components with Enzyme

### Enzyme

#### Shallow rendering with `Enzyme.shallow`

Shallow rendering renders only component itself without its children. So if you change something in a child component it won't change shallow output of your component. Or a bug, introduced in a child component, won't break your component's test. It also doesn't required DOM.

For example this component:

```js
const ButtonWithIcon = ({ icon, children }) => (
  <button>
    <Icon icon={icon} />
    {children}
  </button>
);
```

Will be rendered by React like this:

```html
<button>
  <i class="icon icon_coffee"></i>
  Hello Jest!
</button>
```

But like this with shallow rendering:

```html
<button>
  <Icon icon="coffee" />
  Hello Jest!
</button>
```

#### Full Rendering API with `Enzyme.mount`

Full DOM rendering is ideal for use cases where you have components that may interact with DOM APIs or need to test components that are wrapped in higher order components.

The only way to test componentDidMount and componentDidUpdate. Full rendering including child components. Requires a `jsdom`. More constly in execution time.

#### Static Rendering API with `Enzyme.render`

Enzyme's render function is used to render react components to static HTML and analyze the resulting HTML structure.

#### `shallow` vs. `mount` vs. `render`

- Always begin with `shallow`
- If `componentDidMount` or `componentDidUpdate` should be tested, use mount.
- If you want to test component lifecycle and children behaviour, use `mount`
- If you want to test children rendering with less overhead than `mount` and you are not interested in lifecycle methods, use `render`

### Jest

#### Snapshots [Deprecated]

**Please create at least a basic render test instead of using a snapshot as while snapshots are easy to set up, they generally do a worse job at checking if something was broken from a change and are easy to ignore**

Snapshot is a rendered output of your component stored in a text file.

You tell Jest that you want to be sure that output of this component should never change accidentally and Jest saves it to a file that looks like this:

```js
exports[`test should render a label 1`] = `
<label
  className="isBlock">
  Hello Jest!
</label>
`;
```

Every time you change your markup Jest will show you a diff and ask you to update a snapshot if the change was intended.

Jest stores snapshots besides your tests in files like `__snapshots__/Label.spec.js.snap` and you need to commit them with your code.

## Writing tests

### Unit vs Component tests

By unit testing, we mean testing an individual functionality or method. Ideally, a tests get input and expect a specific output, so we can check if the implementation is correctly covering corner cases.

Here is an example of a good set of unit tests:

```javascript
/**
 * Make a storage unit number more readable by making them smaller
 * shortenStorageUnit(1000, 'GB'); // "1 TB"
 * shortenStorageUnit(0.001, 'TB'); // "1 GB"
 * @param {Number} number
 * @param {String} uom Unit of measure
 * @returns {String}
 */
export function shortenStorageUnit(value, uom) {
  if (value <= 0) {
    return '0 B';
  }

  const units = ['PB', 'TB', 'GB', 'MB', 'KB', 'B'];

  const getBigger = (unit) => units[units.indexOf(unit) - 1];
  const getSmaller = (unit) => units[units.indexOf(unit) + 1];
  const isBiggestUnit = (unit) => units.indexOf(unit) === 0;
  const isSmallestUnit = (unit) => units.indexOf(unit) === units.length - 1;

  const reduce = (number, unit) => {
    if (number < 0.99 && !isSmallestUnit(unit)) {
      return reduce(number * 1000, getSmaller(unit));
    } else if (number >= 1000 && !isBiggestUnit(unit)) {
      return reduce(number / 1000, getBigger(unit));
    } else {
      return { number, unit };
    }
  };

  const { number, unit } = reduce(value, uom);

  return `${formatFloat(number)} ${unit}`;
}

// spec for the function:
describe('shortenStorageUnit', () => {
  it('supports 0 as a number', () => {
    expect(shortenStorageUnit(0, 'MB')).toEqual('0 B');
  });

  it('transforms numbers lower than 0.99 into smaller units', () => {
    expect(shortenStorageUnit(0.01, 'PB')).toEqual('10 TB');
    expect(shortenStorageUnit(0.0025, 'TB')).toEqual('2.5 GB');
    expect(shortenStorageUnit(0.615, 'TB')).toEqual('615 GB');
  });

  it('does not transform numbers greater than 0.99 and smaller than 1000', () => {
    expect(shortenStorageUnit(1.01, 'TB')).toEqual('1.01 TB');
    expect(shortenStorageUnit(999, 'GB')).toEqual('999 GB');
  });

  it('transforms numbers bigger than 999 into bigger units', () => {
    expect(shortenStorageUnit(1000, 'B')).toEqual('1 KB');
    expect(shortenStorageUnit(25729, 'MB')).toEqual('25.73 GB');
  });

  it('does not transform if there no bigger unit', () => {
    expect(shortenStorageUnit(10000, 'PB')).toEqual('10000 PB');
  });

  it('does not transform if there is no smaller unit', () => {
    expect(shortenStorageUnit(0.01, 'B')).toEqual('0.01 B');
  });
});
```

Component test - recommendation is to use react-library, which work with actual DOM nodes. This approach reflects more how the user would interact with the actual rendered component in a browser.

Here's an example of a good component test:

```javascript
// Component that we are testing in UserListRow which display item with
// description, tooltip and dropdown
const UserListRow = ({props here} => {
  ...
  return (
   // and markup
  );
});

// Spec

const build = custom => {
  const props = Object.assign(
    {
      member: defaultSpaceMembership,
      canModifyUsers: false,
      openRoleChangeDialog: openRoleChangeDialog,
      openRemovalConfirmationDialog: openRemovalConfirmationDialog,
      numberOfTeamMemberships: { 'random id': 4 },
      adminCount: 1
    },
    custom
  );

  render(<UserListRow {...props} />);

  return wait();
};

describe('renders correctly', () => {

  it('should display the name correctly', async () => {
    await build();

    expect(screen.getByTestId('user-list.name')).toHaveTextContent('John Doe');
  });

  describe('Edit user dropdown', () => {
    it('should drop down when clicked', async () => {
      await build({ canModifyUsers: true });
      userEvent.click(screen.getByTestId('user-list.actions'));

      expect(screen.getByTestId('user-change-role')).toBeDefined();
    });

    it('should call openRoleChangeDialog when that is clicked', async () => {
      await build({ canModifyUsers: true });
      userEvent.click(screen.getByTestId('user-list.actions'));

      const editUserRoleButtonContainer = screen.getByTestId('user-change-role');
      userEvent.click(
        within(editUserRoleButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(openRoleChangeDialog).toHaveBeenCalled();
    });
  });
});
```

#### React Testing Library

##### Cheatsheet

Can be viewed [here](https://gist.github.com/vbeleuta/7d85ee5799fece8a4fba0229cf2bfcd0)

##### Async Utils

For information on:

- Solving act() warnings
- wait, waitForElement, waitForElementToBeRemoved

Look [here!](https://gist.github.com/guilebarbosa/df244462c823986a22d16fc4e9a5704c)

#### Commonly used Jest assertions

- A list of all jest assertions can be found [here](https://jestjs.io/docs/en/expect)

#### Testing custom react hooks

You can use `renderHook()` to wrap the custom hook under test and use `act()` to call it's update functions in order to simulate the rendering cycle.
The documentation for `@testing-library/react-hooks` can be found [here](https://react-hooks-testing-library.com/usage/basic-hooks).

```js
import { useState, useCallback } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

// Given a custom react hook
const useCounter = (initial = 0) => {
  const [count, setCount] = useState(initial);

  const increment = useCallback(() => setCount((x) => x + 1), []);

  return { count, increment };
};

// This is a corresponding test case
test('should increment counter', () => {
  const { result } = renderHook(() => useCounter(1));

  expect(result.current.count).toBe(1);

  // act() is used to call an update function
  act(() => result.current.increment());

  expect(result.current.count).toBe(2);
});
```

### Matchers

Refer to [Jest Cheet sheet](https://github.com/sapegin/jest-cheat-sheet#matchers) and [jest-dom](https://github.com/testing-library/jest-dom#readme) to learn about matchers;

### Mocks

#### Faker Library

We use [fakeFactory.js](https://github.com/contentful/user_interface/blob/master/src/javascripts/test/helpers/fakeFactory.js) to fake testing objects so we do not have to recreate these each time we write a new test. For example we have have a basic Space object that can be created.

```javascript
export function Space(options = {}) {
  return {
    name: uniqueId(types.SPACE),
    organization: Organization(),
    spaceMembership: SpaceMembership(),
    sys: sys({
      type: types.SPACE,
      id: uniqueId(types.SPACE),
      createdAt: DEFAULT_CREATED_AT_TIME_ISO,
      createdBy: User(),
    }),
    ...options,
  };
}
```

Any part of this can be overwritten, or any field add. Here's an example where two spaces are made for testing. One that doesn't have a spaceMembership, and one that's a default space.

```javascript
// It's creation and set up
const spaces = [fake.Space({ spaceMembership: null }), fake.Space()];

beforeEach(() => {
  getSpaces.mockResolvedValue(spaces);
});

...

// How it's tested. Use the spaces constant to verify that it's called with the correct ID
expect(someFunction).toHaveBeenCalledWith(spaces[1].sys.id);
```

A more complex example would be:

```js
import * as fakeFactory from 'testHelpers/fakeFactory';

const user = fakeFactory.User({
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
});

const mockOrgMemberships = [fakeFactory.OrganizationMembership('member', 'active', user)];

const editorRole = fakeFactory.Role('Editor');
const authorRole = fakeFactory.Role('Author');
const mockSpaceRoles = [editorRole, authorRole];

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllMembershipsWithQuery: jest.fn(async () => ({ items: mockOrgMemberships })),
}));
jest.mock('access_control/RoleRepository', () => ({
  getInstance: () => ({
    getAll: jest.fn(async () => mockSpaceRoles),
  }),
}));
```

#### Mocking functions

Mocking functions: When mocking dependencies, you’ll want to verify that the function was called correctly. That requires keeping track of how often the function was called and what arguments it was called with. That way we can make assertions on how many times it was called and ensure it was called with the right arguments.

Often it is a good idea to check that the mocked functions are called the expected number of times and with the expected arguments.

Simple case usage:

- setup:

```js
import { createOrganizationEndpoint } from 'data/EndpointFactory';

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn().mockReturnValue(VALUE_YOU_WANT_FUNCTION_TO_RETURN),
}));
```

- Update it using `mockReturnValue()`

```js
createOrganizationEndpoint.mockReturnValue(fakeOrgEnpoint);
```

- Mocking external dependencies

```js
jest.mock('lodash/memoize', () => (a) => a); // The original lodash/memoize should exist
jest.mock('lodash/memoize', () => (a) => a, { virtual: true }); // The original lodash/memoize isn’t required
```

- More complex examples:

```js
// When there are multiple chained calls to the mock
jest.mock('moment', () => ({
  utc: jest.fn(() => {
    return {
      format: jest.fn(() => {
        return MOCK_CREATED_AT_TIME_DAY_MONTH_YEAR;
      }),
    };
  }),
}));

// Mocks returning mocks of mocks on mocks.

// Set up
jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('access_control/SpaceMembershipRepository', () => ({
  remove: jest.fn(),
  create: jest.fn(),
}));

jest.mock('data/EndpointFactory', () => ({
  createSpaceEndpoint: jest.fn(),
}));

// ...

const spaces = [fake.Space({ spaceMembership: null }), fake.Space()];
const createdEndpoint = { example: 'test' };

beforeEach(() => {
  getSpaces.mockResolvedValue(spaces);
  createSpaceEndpoint.mockReturnValue(createdEndpoint);
  create.mockReturnValue({ remove: remove });
});

// ...
// Testing the mocks
expect(createSpaceEndpoint).toHaveBeenCalledWith(spaces[1].sys.id);
expect(create).toHaveBeenCalledWith(createdEndpoint);
expect(remove).toHaveBeenCalledWith(spaces[1].spaceMembership);
```

#### mockResolveValue vs mockReturnValue vs mockRejectedValueOnce

- mockResolvedValue Returns a resolved promise. Should be used when mocking async functions
- mockReturnValue Returns a value. Should be used when mocking synchronous functions
- mockReset().mockRejectedValueOnce(new Error()) When testing try - catch code, when imported modules can throw errors
- mockResolvedValueOnce && mockReturnValueOnce These functions should generally not be used as react components especially ones using hooks can be rendered multiple times leading to the incorrect state being passed to the react component when running the expect().tobe()

#### What not to mock

See here: https://gist.github.com/guilebarbosa/fdfcff0fda0108a6d8f71276c0f1a9c0

#### Mocking Modals

How to test Modals

Modals are automatically mocked. So just put

`import ModalLauncher from 'app/common/ModalLauncher';`

in your testing file, returns the mock defined at which currently looks like this:

```js
export const open = jest.fn().mockResolvedValue(true);

export default {
  open,
};
```

The mock defaults the resolved value to true meaning the user clicked the “confirm” button on the modal

Test example that the modal is called:

```js
userEvent.click(buttonThatTriggersModal);

await expect(ModalLauncher.open).toHaveBeenCalled();
```

Test example when the modal shouldn’t be called (for example, clicking on a disabled button that normally triggers a modal)

```js
userEvent.click(buttonThatTriggersModalButIsDisable);

await expect(ModalLauncher.open).not.toHaveBeenCalled();
```

#### Mock Angular modules

All ES6 modules import their Angular dependencies via `getModule(name)`. These modules can be mocked by their name prefixed by `ng/`:

```js
import * as logger from 'ng/logger';

jest.mock('ng/logger', () => ({ logServerError: jest.fn() }));
```

## Skipping tests

Don’t run these tests:

```js
describe.skip('makePoniesPink'...
it.skip('makes each pony pink'...
```

Run only these tests:

```js
describe.only('makePoniesPink'...
it.only('makes each pony pink'...
```

## Debugging tests

There are various ways to setup a debugger for your Jest tests. We cover debugging in Chrome and [Visual Studio Code](https://code.visualstudio.com/).

> Note: debugging tests requires Node 8 or higher.

### Debugging Tests in Chrome

Place `debugger;` statements in any test and run:

```bash
$ npm run jest:debug
```

This will start running your Jest tests, but pause before executing to allow a debugger to attach to the process.

Open the following in Chrome

```
about:inspect
```

After opening that link, the Chrome Developer Tools will be displayed. Select `inspect` on your process and a breakpoint will be set at the first line of the react script (this is done simply to give you time to open the developer tools and to prevent Jest from executing before you have time to do so). Click the button that looks like a "play" button in the upper right hand side of the screen to continue execution. When Jest executes the test that contains the debugger statement, execution will pause and you can examine the current scope and call stack.

### Debugging Tests in Visual Studio Code

Debugging Jest tests is supported out of the box for [Visual Studio Code](https://code.visualstudio.com).

Use the following [`launch.json`](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations) configuration file:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "node",
      "program": "${workspaceRoot}/run-tests-jest.js",
      "args": ["--runInBand", "--no-cache"],
      "cwd": "${workspaceRoot}",
      "protocol": "inspector",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Migration to Jest from Karma

### If your tests have no Angular dependencies

Good news. Migration to Jest should be easy.

- Move file from `test/**/*.spec.js` to `src/**/*.spec.js`, so file that is being tested is located in next to test file.
- Import `sinon` directly as `import sinon from "sinon"` if it was used.
- Fix all ESLint errors in the file.

### If your tests have Angular dependencies and use injection

Do all steps from the previous chapter.

#### Proper way

- Provide all Angular dependencies to React component using `ServicesConsumer`.
- Get rid of `module('contentful/test')` and `$provide` in tests and inject all mocks using `MockedProvider`.

#### Quick way

We have to get rid of injection and use `jest.mock` to mock all imports of Angular modules.

Let's say that some React component imports `$state` Angular service.

```js
import { getModule } from 'core/NgRegistry';
const $state = getModule('$state');

export default class TestedComponent extends React.Component {}
```

By using `jest.mock` with `virtual: true` we can mock import of the module and don't pull all Angular infrastructure to our test.

```js
import TestedComponent from '../TestedComponent';

jest.mock('ng/$state', () => ({ go: jest.fn() }), { virtual: true });
```

## Resources

- [Official Jest Website](https://jestjs.io/)
- [Jest cheet sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Testing components with Jest and Enzyme](http://blog.sapegin.me/all/react-jest)
- [Testing with Jest: 15 Awesome Tips and Tricks](https://medium.com/@stipsan/testing-with-jest-15-awesome-tips-and-tricks-42150ec4c262)
