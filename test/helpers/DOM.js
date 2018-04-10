import JQuery from 'jquery';
import _createMountPoint from 'ui/Framework/DOMRenderer';
import * as ReactTestUtils from 'react-dom/test-utils';


/**
 * Create an object that allows you to render virtual DOM trees,
 * interact with the result and make assertions.
 *
 * This function should not be used directly. Instead use the
 * `this.createUI()` test context helper.
 *
 * ~~~js
 * const ui = createUI()
 * ui.render(h('div', [
 *   h('input', { dataTestId: 'my-input' })
 * ]))
 * ui.find('my-input').setValue('hello')
 * ui.find('my-input').assertValue('hello')
 * ~~~
 *
 * The returned object has the following methods
 * - render(vtree)
 * - find(testId)
 * - destroy()`
 *
 * See `createView()` below for more information on interacting with
 * a UI.
 *
 * This function is available in a test case context
 * ~~~js
 * beforeEach(function () {
 *   this.ui = this.createUI();
 * });
 * ~~~
 *
 * The rendered DOM element is attached to the document body and must
 * be removed with `ui.destroy()`.
 *
 */
export function createUI ({ createMountPoint = _createMountPoint } = {}) {
  const sandbox = document.createElement('div');
  document.body.appendChild(sandbox);
  const view = createView(sandbox);
  const mountpoint = createMountPoint(sandbox);
  return Object.assign(view, mountpoint, {
    destroy () {
      mountpoint.destroy();
      sandbox.remove();
    }
  });
}


/**
 * Create a high-level interface to interact with the DOM and make
 * assertions on it.
 *
 * ~~~js
 * const view = createView(document.body)
 * view.find('my-input').setValue('hello')
 * ~~~
 *
 * The `find()` method accepts one or more ids ([data-test-id]) and returns an object that
 * interacts with the selected DOM node. (See below for the API)
 *
 * Elements are adressed by their `data-test-id` attribute. For
 * example, `view.find('x')` will look for an element with
 * `data-test-id="x"`. If the id starts with a dot, we find an element
 * that ends with the ID. For example `view.find('.z')` will select
 * `data-test-id="x.y.z"`.
 * If passed more than one selector `view.find('x', 'y')` will return
 * the element selected by `[data-test-id=x] [data-test-id=y]`
 *
 * Note that elements need not exist when `find()` is called. The
 * element is resolved lazily when one of the element methods is
 * called.
 *
 * When an element is resolved we also assert that it is unique in the
 * container and visible. We throw an error otherwise.
 *
 * TODO We should use the 'assert' library instead of `expect`.
 */
export function createView (container) {
  return {
    element: container,

    find (...ids) {
      return createElement(container, makeTestIdSelector(...ids));
    },

    /**
     * Assert that the view does not have an element with the given
     * test ID.
     *
     * TODO Deprecated. Replace with `find(id).assertNonExistent()`.
     */
    assertNotHasElement (...ids) {
      assertNotHasSelector(container, makeTestIdSelector(...ids));
    }
  };
}

function makeTestIdSelector (...ids) {
  return ids.map((id) => {
    if (id.startsWith('.')) {
      return `[data-test-id$="${id}"]`;
    } else {
      return `[data-test-id="${id}"]`;
    }
  }).join(' ');
}


// TODO document
export function setCheckbox (el, value) {
  if (el instanceof JQuery) {
    el = el.get(0);
  }
  // TODO assert input[type=checkbox]
  el.checked = value;
  // TODO explain click
  el.dispatchEvent(new Event('click', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  ReactTestUtils.Simulate.change(el);
  ReactTestUtils.Simulate.click(el);
}


/**
 * Returns an interface for controlling a DOM element and making
 * assertions.
 *
 * You can find documentation for each method above their
 * implementation below.
 *
 * Note that the element is computed lazily from the `container` and
 * `selector` argument so it need not exist at the time of creation.
 */
function createElement (container, selector) {
  // Most of these methods are functions bound to the defined element.
  return {
    get element () {
      return getElement();
    },

    getDescriptor: bindEl(getDescriptor),

    // Control
    setValue: bindEl(setValue),
    setChecked: bindEl(setCheckbox),
    click: () => getElement().click(),
    keyDown: bindEl(keyDown),

    // Assertions
    assertValue: bindEl(assertValue),
    assertValid: bindEl(assertValid),
    assertIsAlert: bindEl(assertIsAlert),
    assertIsSelected: bindEl(assertIsSelected),
    assertIsChecked: bindEl(assertIsChecked),
    assertIsVisible: bindEl(assertIsVisible),
    assertNotVisible () {
      assertNotVisible(container, selector);
    },
    assertHasText: bindEl(assertHasText),
    assertNonExistent () {
      assertNotHasSelector(container, selector);
    }
  };

  // Bind a function that excepts an element as its first argument to
  // the lazily computed element of this interface.
  function bindEl (fn) {
    return function (...args) {
      return fn(getElement(), ...args);
    };
  }

  function getElement () {
    const el = findOne(container, selector);
    return el;
  }
}


/**
 * Find and return exactly one element matched by the selector.
 *
 * Throws if there is no element or more then one that is matched by
 * the selector.
 */
function findOne (element, selector) {
  const results = element.querySelectorAll(selector);
  if (results.length === 0) {
    throw new Error(`Cannot find element matching ${selector}`);
  } else if (results.length > 1) {
    throw new Error(`Element selected by ${selector} is not unique`);
  } else {
    return results[0];
  }
}


/**
 * Return an element wrapper for the element that describes the given
 * element.
 *
 * The descriptor element is determined by resolving the ID in the
 * 'aria-describedby' attribute of the given element.
 */
function getDescriptor (element) {
  const source = findOne(element, '[aria-describedby]');
  const id = source.getAttribute('aria-describedby');
  return createElement(document.body, `#${id}`);
}


function setValue (element, value) {
  // TODO extend to textarea, select
  if (element.tagName !== 'INPUT') {
    throw new Error(`Cannot set value of element ${element.tagName}`);
  }
  element.value = value;
  element.dispatchEvent(new Event('input', {bubbles: true}));
  element.dispatchEvent(new Event('change', {bubbles: true}));
  ReactTestUtils.Simulate.change(element);
}


function getValue (element) {
  // TODO extend to textarea, select
  if (element.tagName !== 'INPUT') {
    throw new Error(`Cannot get value of element ${element.tagName}`);
  }
  return element.value;
}


/**
 * Trigger a 'keydown' event with the given keycode on an input
 * element.
 *
 * At the moment only input elements are supported. Using this method
 * on another element will throw an error. We will extend this as we
 * see fit.
 *
 * The keycode must by a number that corresponds to the value of the
 * events `keyCode` property [1]. In the future we should add support
 * for providing a `key` string [2] as an argument since these are more
 * readable.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
 * [2]: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
 */
function keyDown (element, keyCode) {
  // TODO extend to textarea, elements with tabindex
  if (element.tagName !== 'INPUT') {
    throw new Error(`Cannot trigger keyboard event on element ${element.tagName}`);
  }
  if (typeof keyCode !== 'number') {
    throw new Error('Only numerical `keyCode` arguments are supported for triggering keyboard events');
  }
  const eventProps = { bubbles: true, keyCode };
  const event = new KeyboardEvent('keydown', eventProps);

  // There is a bug in Chrome that sets the `keyCode` property to 0. We
  // need to set it ourselves.
  Object.defineProperty(event, 'keyCode', { value: keyCode });
  element.dispatchEvent(event);

  ReactTestUtils.Simulate.keyDown(eventProps);
}


/**
 * Asserts that the element has the `aria-invalid` attribute set
 * corresponding to the second argument.
 */
function assertValid (element, valid) {
  if (valid) {
    expect(element.getAttribute('aria-invalid')).not.toBe('true');
  } else {
    expect(element.getAttribute('aria-invalid')).toBe('true');
  }
}


/**
 * Asserts that the given element has role "alert".
 *
 * TODO Maybe extend this with a second `code` argument that allows to
 * make assertion on a `data-status-code` attribute to distinguish
 * alerts.
 */
function assertIsAlert (element) {
  const role = element.getAttribute('role');
  expect(role).toBe('alert', `Element role "${role}" is not "alert"`);
}


/**
 * Asserts that the element’s value is the given value.
 *
 * Throws when the element does not support the `value` property.
 */
function assertValue (element, value) {
  expect(getValue(element)).toBe(value);
}


/**
 * Assert that the element is visible in the DOM.
 *
 * Specifically the element and all its parents must satisfy
 * - The element is rendered in the current window. This implies that
 *   'display' is not 'none'.
 * - The 'visibility' style is not set to 'hidden'
 * - The opacity is not 0
 */
function assertIsVisible (element) {
  let el = element;
  while (el) {
    expect(el.getClientRects().length).not.toBe(0, 'Element is not rendered on the page. \'display\' style might be \'none\'');
    const { opacity, visibility } = window.getComputedStyle(el);
    expect(opacity).not.toBe(0, 'Element is not visible. Opacity is 0');
    expect(visibility).not.toBe('hidden', 'Element is not visible. Visibility is \'hidden\'');
    expect(element.getAttribute('aria-hidden')).not.toBe('true', 'Element is not visible. aria-hidden is \'true\'');
    el = el.parentElement;
  }
}


/**
 * Assert that an element matching the selector is not visible or does
 * not exist.
 *
 * This function also throws if the element selected by `selector` is
 * not unique.
 */
function assertNotVisible (container, selector) {
  const found = container.querySelectorAll(selector);
  expect(found.length <= 1).toBe(true, `Element selected by ${selector} is not unique`);

  if (!found.length) {
    return;
  }

  let el = found[0];
  while (el) {
    const notRendered = el.getClientRects().length === 0;
    const { opacity, visibility } = window.getComputedStyle(el);
    const ariaHidden = el.getAttribute('aria-hidden') === 'true';
    if (notRendered || !opacity || visibility === 'hidden' || ariaHidden) {
      return;
    }
    el = el.parentElement;
  }
  throw new Error('Element is visible on page');
}


/**
 * Assert that the element’s 'aria-selected' attribute is set to
 * 'true'.
 */
function assertIsSelected (element) {
  const message =
    'Expected element to be selected. ' +
    '\'aria-selected\' attribute is not \'true\'';
  expect(element.getAttribute('aria-selected')).toBe('true', message);
}


/**
 * Asserts if an element is checked by either inspecting the `checked`
 * property for `input[type="checkbox]" or the `aria-checked` attribute
 * for all other elements
 *
 *     // Equivalent
 *     assertIsChecked(el)
 *     assertIsChecked(el, true)
 *
 *     // Converse
 *     assertIsChecked(false)
 */
function assertIsChecked (element, shouldBeChecked = true) {
  if (element.tagName === 'INPUT' && element.type === 'checkbox') {
    expect(element.checked).toBe(shouldBeChecked);
  } else {
    const message = shouldBeChecked
      ? "Expected element to be checked. 'aria-checked' attribute is not 'true'"
      : "Expected element not to be checked. 'aria-checked' attribute is not 'false'";
    expect(element.getAttribute('aria-checked')).toBe(String(shouldBeChecked), message);
  }
}


/**
 * Assert that the text content of the element matches `text`.
 *
 * `text` maybe a regular expression or a string. In the latter case
 * substring matching is performed.
 */
function assertHasText (element, text) {
  expect(element.textContent).toMatch(text);
}


/**
 * Assert that the element does not have a descendant element that
 * matches the given selector.
 */
function assertNotHasSelector (element, selector) {
  const results = element.querySelectorAll(selector);
  expect(results.length).toBe(0, `Expected element not to have child matching ${selector}`);
}
