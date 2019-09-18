import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';

describe('command service', () => {
  beforeEach(async function() {
    await $initialize(this.system);
    this.create = $inject('command').create;
  });

  describe('#execute', () => {
    it('calls action', function() {
      const action = sinon.stub();
      const command = this.create(action);

      command.execute();
      sinon.assert.calledOnce(action);
    });

    it('resolves only when action resolve', function() {
      const deferred = $inject('$q').defer();
      const action = sinon.stub().returns(deferred.promise);
      const command = this.create(action);

      let executed = false;
      command.execute().then(() => {
        executed = true;
      });

      $apply();
      expect(executed).toBe(false);
      deferred.resolve();

      $apply();
      expect(executed).toBe(true);
    });
  });

  describe('#isDisabled()', () => {
    it('is "true" when command in progress', function() {
      const action = sinon.stub().resolves();
      const command = this.create(action);

      expect(command.isDisabled()).toBe(false);
      command.execute();
      expect(command.isDisabled()).toBe(true);
      $apply();
      expect(command.isDisabled()).toBe(false);
    });
  });

  describe('#inProgress()', () => {
    it('is "true" when command in progress', function() {
      const action = sinon.stub().resolves();
      const command = this.create(action);

      expect(command.inProgress()).toBe(false);
      command.execute();
      expect(command.inProgress()).toBe(true);
      $apply();
      expect(command.inProgress()).toBe(false);
    });
  });
});
