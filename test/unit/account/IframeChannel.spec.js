import * as K from 'helpers/mocks/kefir';

describe('account/IframeChannel', () => {
  beforeEach(function () {
    module('contentful/test');
    const $window = this.$inject('$window');
    const IframeChannel = this.$inject('account/IframeChannel');

    const iframe = {contentWindow: {}};

    const messages$ = IframeChannel.default(iframe);
    this.messages = K.extractValues(messages$);

    this.postMessage = (data, src) => {
      const event = _.assign(new Event('message'), {
        source: src || iframe.contentWindow,
        data: data
      });

      $window.dispatchEvent(event);
    };
  });

  it('emits only messages from the iframe', function () {
    this.postMessage('A');
    this.postMessage('B', {});
    this.postMessage('C');
    expect(this.messages).toEqual(['C', 'A']);
  });

  it('parses data as JSON on IE', function () {
    const UA = this.mockService('userAgent');
    UA.isIE.returns(true);

    const data = {a: true};
    this.postMessage(JSON.stringify(data));
    expect(this.messages[0]).toEqual(data);
  });
});
