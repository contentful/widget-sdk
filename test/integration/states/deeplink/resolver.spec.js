import sinon from 'sinon';
import { $initialize } from 'test/utils/ng';

describe('states/deeplink/resolver.es6', () => {
  beforeEach(async function() {
    this.logException = sinon.stub();
    this.system.set('services/logger.es6', {
      logException: this.logException
    });

    this.resolver = await this.system.import('states/deeplink/resolver.es6');

    await $initialize(this.system);
  });

  describe('#resolveLink', () => {
    it('should log an error in case of error', async function() {
      await this.resolver.resolveLink('some random link');

      expect(this.logException.calledOnce).toBe(true);
    });
  });
});
