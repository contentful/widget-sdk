import * as sinon from 'helpers/sinon';

describe('states/deeplink/resolver', () => {
  beforeEach(function() {
    this.logException = sinon.stub();
    module('contentful/test', $provide => {
      $provide.value('logger', {
        logException: this.logException
      });
    });

    this.resolver = this.$inject('states/deeplink/resolver');
  });

  describe('#resolveLink', () => {
    it('should log an error in case of error', function*() {
      yield this.resolver.resolveLink('some random link');

      expect(this.logException.calledOnce).toBe(true);
    });
  });
});
