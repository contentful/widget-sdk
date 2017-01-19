'use strict';

describe('Account View directive', function () {
  beforeEach(function () {
    this.handleGatekeeperMessage = sinon.spy();
    module('contentful/test', ($provide) => {
      $provide.value('handleGatekeeperMessage', this.handleGatekeeperMessage);
    });

    const K = this.$inject('mocks/kefir');
    this.messages$ = K.createMockStream();

    const IframeChannel = this.mockService('account/IframeChannel');
    IframeChannel.default.returns(this.messages$);

    this.compile = function () {
      this.element = this.$compile('<cf-account-view />', {context: {}});
    }.bind(this);
  });

  it('calls "handleGatekeeperMessage" on message', function () {
    this.compile();
    this.messages$.emit('DATA');
    sinon.assert.calledOnce(this.handleGatekeeperMessage.withArgs('DATA'));
  });

  it('marks as ready on the first iframe message', function () {
    this.compile();
    this.messages$.emit({});
    expect(this.element.scope().context.ready).toBe(true);
  });

  it('closes open modals on `update location` message', function () {
    const message = {action: 'update', type: 'location'};
    const modalDialog = this.$inject('modalDialog');
    modalDialog.closeAll = sinon.stub();
    this.compile();
    this.messages$.emit(message);
    sinon.assert.calledOnce(modalDialog.closeAll);
  });

  it('sets a source of the GK iframe using state params', function () {
    this.$inject('$stateParams').pathSuffix = 'x/y/z';
    this.compile();
    expect(this.element.find('iframe').first().prop('src')).toBe('http://be.test.com/account/x/y/z');
  });
});
