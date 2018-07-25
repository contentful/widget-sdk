'use strict';

describe('command service', () => {

  beforeEach(function () {
    module('cf.ui');
    this.create = this.$inject('command').create;
    this.executions = this.$inject('command').executions;
  });

  describe('#execute', () => {

    it('calls action', function () {
      const action = sinon.stub();
      const command = this.create(action);

      command.execute();
      sinon.assert.calledOnce(action);
    });

    it('resolves only when action resolve', function () {
      const deferred = this.$inject('$q').defer();
      const action = sinon.stub().returns(deferred.promise);
      const command = this.create(action);

      let executed = false;
      command.execute().then(() => {
        executed = true;
      });

      this.$apply();
      expect(executed).toBe(false);
      deferred.resolve();

      this.$apply();
      expect(executed).toBe(true);
    });

    it('triggers #executions signal', function () {
      const command = this.create(sinon.stub());

      const executed = sinon.stub();
      this.executions.attach(executed);

      command.execute();
      sinon.assert.calledOnce(executed);
      sinon.assert.calledWith(executed, command);
    });

  });

  describe('#isDisabled()', () => {
    it('is "true" when command in progress', function () {
      const action = sinon.stub().resolves();
      const command = this.create(action);

      expect(command.isDisabled()).toBe(false);
      command.execute();
      expect(command.isDisabled()).toBe(true);
      this.$apply();
      expect(command.isDisabled()).toBe(false);
    });
  });

  describe('#inProgress()', () => {
    it ('is "true" when command in progress', function () {
      const action = sinon.stub().resolves();
      const command = this.create(action);

      expect(command.inProgress()).toBe(false);
      command.execute();
      expect(command.inProgress()).toBe(true);
      this.$apply();
      expect(command.inProgress()).toBe(false);

    });
  });


});
