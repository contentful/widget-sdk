import { extend } from 'lodash';
import $window from '$window';
import * as K from 'utils/kefir';

/**
 * Create a XHR debugger.
 *
 * Has methods to enable, disable, and control the rules.
 *
 * This is used by the cfMockXhrConsole directive.
 */
export function create () {
  const rules = [];
  const defaultRule = {
    urlPattern: '',
    status: 200,
    responseText: ''
  };

  const OrigXHR = $window.XMLHttpRequest;
  const XHR = createMockClass(rules, OrigXHR);

  enable();

  return {
    enable,
    restore,
    addRule,
    removeRule
  };

  function enable () {
    $window.XMLHttpRequest = XHR;
  }
  function restore () {
    $window.XMLHttpRequest = OrigXHR;
  }

  /**
   * Add a rule for mocking HTTP requests
   *
   * A rule has the following properties
   * - `urlPattern`. RegExp that is matched against the URL of the XHR request
   * - `status`  Status code to be returned for the matched URLs
   * - `responseText`  Response to be returned for the matched URLs. Defaults to
   *   the empty string.
   */
  function addRule (rule) {
    if (!(rule.urlPattern instanceof RegExp)) {
      rule.urlPattern = RegExp(rule.urlPattern);
    }
    rule = extend({}, defaultRule, rule);
    rules.push(rule);
  }
  function removeRule (ix) {
    rules.splice(ix, 1);
  }
}

/**
 * Create a mock XHR adapter class.
 *
 * Instances of that class either delegate to a corresponding instance of the
 * original XHR class or sends mock responses if a rule matches the URL on the
 * instance.
 *
 * Note that rules is a reference to a mutable array that is changed by the
 * `addRule()` method above.
 *
 * Instances also emit events on the `eventBus` whenever one of the class
 * methods is called.
 */
function createMockClass (rules, XMLHttpRequest) {
  const XHR = function () {
    this._loadBus = K.createBus();
    this._loadBus.stream.onValue(() => {
      if (typeof this.onload === 'function') {
        this.onload();
      }
    });
    this._xhr = new XMLHttpRequest();
  };

  XHR.prototype.open = function (method, url, ...args) {
    this._method = method;
    this._url = url;
    this._rule = rules.find(rule => rule.urlPattern.exec(url));

    if (!this._rule) {
      return this._xhr.open(method, url, ...args);
    }
  };

  XHR.prototype.send = function (body) {
    if (this._rule) {
      // eslint-disable-next-line no-console
      console.log('Sending mock request', {
        method: this._method,
        url: this._url,
        body,
        status: this._rule.status
      });
      this.readyState = XMLHttpRequest.DONE;
      this.status = this._rule.status;
      this.responseText = this._rule.responseText;
      this._loadBus.emit();
    } else {
      const xhrWrapper = this;
      const realXhr = this._xhr;

      realXhr.onload = () => {
        ['status', 'statusText', 'response', 'responseText', 'responseType', 'readyState']
          .forEach(key => {
            xhrWrapper[key] = realXhr[key];
          });

        xhrWrapper._loadBus.emit();
      };

      return this._xhr.send(body);
    }
  };

  XHR.prototype.abort = function () {
    if (!this._rule) {
      return this._xhr.abort.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.addEventListener = function (event, handler) {
    if (event === 'load') {
      this._loadBus.stream.onValue(handler);
    }
  };

  XHR.prototype.setRequestHeader = function () {
    if (!this._rule) {
      this._xhr.setRequestHeader.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.getAllResponseHeaders = function () {
    if (this._rule) {
      return '';
    } else {
      return this._xhr.getAllResponseHeaders.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.getResponseHeader = function () {
    if (this._rule) {
      return '';
    } else {
      return this._xhr.getResponseHeader.apply(this._xhr, arguments);
    }
  };

  return XHR;
}
