import JQuery from 'jquery';

/**
 * Create a high-level interface to interact with the DOM and make
 * assertions on it.
 *
 * ~~~js
 * const view = createView(document.body)
 * view.find('my-input').setValue('hello')
 * ~~~
 *
 * The `find()` method accepts a string and returns an object that
 * interacts with the selected DOM node. (See below for the API)
 *
 * Elements are adressed by their `data-test-id` attribute. The
 * argument to find specifies that attribute. Note that elements need
 * not exist when `find()` is called. The element is resolved lazily
 * when one of the element methods is called.
 *
 * When an element is resolved we also assert that it is visible in the
 * DOM and throw an error otherwise.
 *
 * TODO We should use the 'assert' library instead of `expect`.
 */
export function createView (container) {
  return {
    element: container,
    find (id) {
      return createElement(container, `[data-test-id="${id}"]`);
    },

    /**
     * Assert that the view does not have an element with the given
     * test ID.
     */
    assertNotHasElement (id) {
      assertNotHasSelector(container, `[data-test-id="${id}"]`);
    }
  };
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
}

/**
 * Returns an interface for controlling a DOM element and making
 * assertions.
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

    // Input controls
    setValue: bindEl(setValue),

    // Click control
    click: () => getElement().click(),

    // Assertions
    assertValue: bindEl(assertValue),
    assertValid: bindEl(assertValid),
    assertIsAlert: bindEl(assertIsAlert),
    assertHasText: bindEl(assertHasText)
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
    assertIsVisible(el);
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


function setValue (element, value) {
  // TODO extend to textarea, select
  if (element.tagName !== 'INPUT') {
    throw new Error(`Cannot set value of element ${element.tagName}`);
  }
  element.value = value;
  element.dispatchEvent(new Event('input', {bubbles: true}));
  element.dispatchEvent(new Event('change', {bubbles: true}));
}


function getValue (element) {
  // TODO extend to textarea, select
  if (element.tagName !== 'INPUT') {
    throw new Error(`Cannot get value of element ${element.tagName}`);
  }
  return element.value;
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
 * Specifically
 * - The element is rendered in the current window
 * - The 'visibility' style is not set to 'hidden'
 * - The opacity is not 0
 *
 * TODO we should probably walk up the element tree to assert that the
 * element is visible and not transparent.
 */
function assertIsVisible (element) {
  expect(element.getClientRects().length).not.toBe(0, 'Element is not rendered on the page');
  const styles = window.getComputedStyle(element);
  expect(styles.opacity).not.toBe(0, 'Element is not visible. Opacity is 0');
  expect(styles.visibility).not.toBe('hidden', 'Element is not visible. Visibility is \'hidden\'');
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
