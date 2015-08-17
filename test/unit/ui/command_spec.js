'use strict';

describe('command service', function () {

  beforeEach(module('cf.ui'));

  it('triggers #executions signal', function () {
    var Command = this.$inject('command');
    var command = Command.create(sinon.stub().resolves());

    var executed = sinon.stub();
    Command.executions.attach(executed);

    command.execute();
    sinon.assert.calledOnce(executed);
    sinon.assert.calledWith(executed, command);
  });

});
