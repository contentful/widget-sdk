'use strict';

describe('Account View directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.channel = {onMessage: sinon.spy(), off: sinon.spy()};
    this.$inject('iframeChannel').create = sinon.stub().returns(this.channel);

    this.compile = function () {
      this.element = this.$compile('<cf-account-view />', {context: {}});
    }.bind(this);
  });

  it('mounts GK handlers', function () {
    this.compile();
    sinon.assert.calledOnce(this.channel.onMessage.withArgs(this.$inject('handleGatekeeperMessage')));
  });

  it('marks as ready on the first iframe message', function () {
    this.compile();
    this.channel.onMessage.secondCall.args[0]({});
    expect(this.element.scope().context.ready).toBe(true);
  });

  it('closes open modals on `update location` message', function () {
    const message = {action: 'update', type: 'location'};
    const modalDialog = this.$inject('modalDialog');
    modalDialog.closeAll = sinon.stub();
    this.compile();
    this.channel.onMessage.secondCall.args[0](message);
    sinon.assert.calledOnce(modalDialog.closeAll);
  });

  it('sets a source of the GK iframe using state params', function () {
    this.$inject('authentication').accountUrl = _.constant('http://test.com/account');
    this.$inject('$stateParams').pathSuffix = 'x/y/z';
    this.compile();
    expect(this.element.find('iframe').first().prop('src')).toBe('http://test.com/account/x/y/z');
  });

  it('turns channel off when destroyed', function () {
    this.compile();
    this.element.scope().$broadcast('$destroy');
    sinon.assert.calledOnce(this.channel.off);
  });
});
