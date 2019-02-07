import * as sinon from 'test/helpers/sinon';

describe('states/deeplink/resolver.es6', () => {
  beforeEach(function() {
    this.logException = sinon.stub();
    module('contentful/test', $provide => {
      $provide.constant('services/logger.es6', {
        logException: this.logException
      });
    });

    this.resolver = this.$inject('states/deeplink/resolver.es6');
  });

  describe('#resolveLink', () => {
    it('should log an error in case of error', function*() {
      yield this.resolver.resolveLink('some random link');

      expect(this.logException.calledOnce).toBe(true);
    });
  });
});
