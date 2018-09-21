# Testing with Jest

## Table of Contents

- [Running tests](#running-tests)
- [Filename conventions](#filename-conventions)
- [About Enzyme and Jest](#about-enzyme-and-jest)
- [Writing tests](#writing-tests)
  - [Testing basic component rendering](#testing-basic-component-rendering)
  - [Testing events](#testing-events)
  - [Testing event handlers](#testing-event-handlers)
  - [Matchers](#matchers)
  - [Async tests](#async-tests)
  - [Mocks](#mocks)
- [Skipping tests](#skipping-tests)
- [Debugging tests](#debugging-tests)
  - [In Chrome](#debugging-tests-in-chrome)
  - [In VSCode](#debugging-tests-in-visual-studio-code)
- [Migration to Jest from Karma](#migration-to-jest-from-karma)
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

## Filename Conventions

Jest will look for test files with any of the following naming conventions:

* Files with `.spec.js` suffix in `src/javascripts` folder
* Files with `.spec.js` suffix in `src/javascripts/**/__tests__` folders.

The files can be located at any depth under the `src/javascripts` folder.

It's recommended to put the test files (or __tests__ folders) next to the code they are testing so that relative imports appear shorter. For example, if `App.spec.js` and `App.js` are in the same folder, the test just needs to import App from './App' instead of a long relative path. Colocation also helps find tests more quickly in larger projects.

## About Enzyme and Jest

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

#### Snapshots

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

### Testing basic component rendering

That's enought for most non-interactive components:

```js
import { shallow } from 'enzyme';

describe('Label component', () => {
  it('render a label', () => {
    const wrapper = shallow(<Label>Hello Jest!</Label>);
    expect(wrapper).toMatchSnapshot();
  });

  it('render a small render', () => {
    const wrapper = shallow(<Label small>Hello Jest!</Label>);
    expect(wrapper).toMatchSnapshot();
  });
});
```

### Testing events

You can simulate an event like click or change and then compare component to a snapshot:

```js
it('render Markdown in preview mode', () => {
  const wrapper = shallow(<MarkdownEditor value="*Hello* Jest!" />);

  expect(wrapper).toMatchSnapshot();

  wrapper.find('[name="toggle-preview"]').simulate('click');

  expect(wrapper).toMatchSnapshot();
});
```

### Testing event handlers

Similar to events testing but instead of testing component’s rendered output with a snapshot use Jest’s mock function to test an event handler itself:

```js
it('pass a selected value to the onChange handler', () => {
  const value = '2';
  const onChange = jest.fn();
  const wrapper = shallow(<Select items={ITEMS} onChange={onChange} />);

  expect(wrapper).toMatchSnapshot();

  wrapper.find('select').simulate('change', {
    target: { value }
  });

  expect(onChange).toBeCalledWith(value);
});
```

### Matchers

Refer to [Jest Cheet sheet](https://github.com/sapegin/jest-cheat-sheet#matchers) to learn matchers;

### Async tests

See [more examples](https://jestjs.io/docs/en/tutorial-async.html) in Jest docs.

It’s a good practice to specify a number of expected assertions in async tests, so the test will fail if your assertions weren’t called at all.

```js
it('async test', () => {
  expect.assertions(3); // Exactly three assertions are called during a test
  // OR
  expect.hasAssertions(); // At least one assertion is called during a test

  // Your async tests
});
```

Refer [Jest Cheet sheet](https://github.com/sapegin/jest-cheat-sheet#async-tests) to learn more about async tests.

### Mocks

#### Mock functions

[Mock functions docs](https://jestjs.io/docs/en/mock-function-api)

```js
it('call the callback', () => {
  const callback = jest.fn();
  fn(callback);
  expect(callback).toBeCalled();
  expect(callback.mock.calls[0][1].baz).toBe('pizza'); // Second argument of the first call
});
```

#### Mock modules

```js
jest.mock('lodash/memoize', () => a => a) // The original lodash/memoize should exist
jest.mock('lodash/memoize', () => a => a, { virtual: true }) // The original lodash/memoize isn’t required
```

## Skipping tests

Don’t run these tests:

```js
describe.skip('makePoniesPink'...
it.skip('make each pony pink'...
```

Run only these tests:

```js
describe.only('makePoniesPink'...
it.only('make each pony pink'...
```

## Debugging tests

There are various ways to setup a debugger for your Jest tests. We cover debugging in Chrome and [Visual Studio Code](https://code.visualstudio.com/).

>Note: debugging tests requires Node 8 or higher.

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
```
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "node",
      "program": "${workspaceRoot}/run-tests-jest.js",
      "args": [
        "--runInBand",
        "--no-cache"
      ],
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

* Move file from 'test/**/*.spec.js' to 'src/**/__tests__/*.spec.js', so file that is being tests is located in parent folder.
* Import `sinon` directly as `import sinon from "sinon"` if it was used.
* Fix all ESLint errors in the file.

### If your tests have Angular dependencies and use injection

Do all steps from the previous chapter.

#### Proper way

* Provide all Angular dependencies to React component using `ServicesConsumer`.
* Get rid of `module('contentful/test')` and `$provide` in tests and inject all mocks using `MockedProvider`.

#### Quick way

We have to get rid of injection and use `jest.mock` to mock all imports of Angular modules.

Let's say that some React component imports `notification` Angular service.

```js
import notification from 'notification';

export default class TestedComponent extends React.Component {}
```

By using `jest.mock` with `virtual: true` we can mock import of the module and don't pull all Angular infrastructure to our test.

```js
import TestedComponent from '../TestedComponent';

jest.mock('notification', () => {
    show: jest.fn()
}, { virtual: true });
```


## Resources

- [Official Jest Website](https://jestjs.io/)
- [Jest cheet sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Testing components with Jest and Enzyme](http://blog.sapegin.me/all/react-jest)
- [Testing with Jest: 15 Awesome Tips and Tricks](https://medium.com/@stipsan/testing-with-jest-15-awesome-tips-and-tricks-42150ec4c262)
