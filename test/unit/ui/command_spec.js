'use strict';

describe('command service', () => {

  beforeEach(function () {
    module('cf.ui');
    this.create = this.$inject('command').create;
    this.executions = this.$inject('command').executions;
  });

  describe('#execute', () => {

    it('calls action', function () {
      var action = sinon.stub();
      var command = this.create(action);

      command.execute();
      sinon.assert.calledOnce(action);
    });

    it('resolves only when action resolve', function () {
      var deferred = this.$inject('$q').defer();
      var action = sinon.stub().returns(deferred.promise);
      var command = this.create(action);

      var executed = false;
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
      var command = this.create(sinon.stub());

      var executed = sinon.stub();
      this.executions.attach(executed);

      command.execute();
      sinon.assert.calledOnce(executed);
      sinon.assert.calledWith(executed, command);
    });

  });

  describe('#isDisabled()', () => {
    it('is "true" when command in progress', function () {
      var action = sinon.stub().resolves();
      var command = this.create(action);

      expect(command.isDisabled()).toBe(false);
      command.execute();
      expect(command.isDisabled()).toBe(true);
      this.$apply();
      expect(command.isDisabled()).toBe(false);
    });
  });

  describe('#inProgress()', () => {
    it ('is "true" when command in progress', function () {
      var action = sinon.stub().resolves();
      var command = this.create(action);

      expect(command.inProgress()).toBe(false);
      command.execute();
      expect(command.inProgress()).toBe(true);
      this.$apply();
      expect(command.inProgress()).toBe(false);

    });
  });


});
