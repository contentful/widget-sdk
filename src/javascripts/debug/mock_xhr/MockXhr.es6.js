import { extend } from 'lodash';
import $window from '$window';
import * as K from 'utils/kefir';

export function create () {
  const eventsBus = K.createBus();
  const rules = [];
  const defaultRule = {
    urlPattern: '',
    status: 200,
    responseText: ''
  };

  const OrigXHR = $window.XMLHttpRequest;
  const XHR = createMockClass(rules, eventsBus, OrigXHR);

  enable();

  return {
    enable,
    restore,
    addRule,
    removeRule,
    events$: eventsBus.stream
  };

  function enable () {
    $window.XMLHttpRequest = XHR;
  }
  function restore () {
    $window.XMLHttpRequest = OrigXHR;
  }
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

function createMockClass (rules, eventsBus, XMLHttpRequest) {
  const XHR = function () {
    this._xhr = new XMLHttpRequest();
  };

  XHR.prototype.open = function () {
    const url = arguments[1];
    this._rule = rules.find(function (rule) {
      return rule.urlPattern.exec(url);
    });

    eventsBus.emit({ method: 'open', rule: this._rule, params: arguments });

    if (!this._rule) {
      return this._xhr.open.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.send = function () {
    eventsBus.emit({ method: 'send', rule: this._rule, params: arguments });

    if (this._rule) {
      this.readyState = XMLHttpRequest.DONE;
      this.status = this._rule.status;
      this.responseText = this._rule.responseText;
      if (typeof this.onload === 'function') {
        this.onload();
      }
    } else {
      const xhrWrapper = this;
      const realXhr = this._xhr;

      realXhr.onload = function () {
        ['status', 'statusText', 'response', 'responseText', 'responseType', 'readyState']
          .forEach(function (key) {
            xhrWrapper[key] = realXhr[key];
          });

        if (typeof xhrWrapper.onload === 'function') {
          xhrWrapper.onload.apply(realXhr, arguments);
        }
      };

      return this._xhr.send.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.abort = function () {
    eventsBus.emit({ method: 'abort', rule: this._rule, params: arguments });
    if (!this._rule) {
      return this._xhr.abort.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.setRequestHeader = function () {
    eventsBus.emit({ method: 'setRequestHeader', rule: this._rule, params: arguments });
    if (!this._rule) {
      this._xhr.setRequestHeader.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.getAllResponseHeaders = function () {
    eventsBus.emit({ method: 'getAllResponseHeaders', rule: this._rule, params: arguments });
    if (this._rule) {
      return '';
    } else {
      return this._xhr.getAllResponseHeaders.apply(this._xhr, arguments);
    }
  };

  XHR.prototype.getResponseHeader = function () {
    eventsBus.emit({ method: 'getResponseHeader', rule: this._rule, params: arguments });
    if (this._rule) {
      return '';
    } else {
      return this._xhr.getResponseHeader.apply(this._xhr, arguments);
    }
  };

  return XHR;
}
