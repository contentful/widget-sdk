import sinon from 'sinon';
import { $initialize } from 'test/utils/ng';

describe('states/deeplink/resolver', () => {
  beforeEach(async function() {
    this.logException = sinon.stub();
    this.system.set('services/logger', {
      logException: this.logException
    });

    this.resolver = await this.system.import('states/deeplink/resolver');

    await $initialize(this.system);
  });

  describe('#resolveLink', () => {
    it('should log an error in case of error', async function() {
      await this.resolver.resolveLink('some random link');

      expect(this.logException.calledOnce).toBe(true);
    });
  });
});
