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
 * TODO We should use the 'assert' library instead of `expect`.
 */
export function createView (container) {
  return {
    find (id) {
      return createElement(container, `[data-test-id="${id}"]`);
    }
  };
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
    assertIsAlert: bindEl(assertIsAlert)
  };

  // Bind a function that excepts an element as its first argument to
  // the lazily computed element of this interface.
  function bindEl (fn) {
    return function (...args) {
      return fn(getElement(), ...args);
    };
  }

  function getElement () {
    return findOne(container, selector);
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
