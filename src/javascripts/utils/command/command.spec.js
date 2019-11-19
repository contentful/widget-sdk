import { createCommand } from './command';

describe('command service', () => {
  describe('#execute', () => {
    it('calls action', function() {
      const action = jest.fn();
      const command = createCommand(action);

      command.execute();
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('resolves only when action resolve', function(done) {
      let promiseResolve;

      const deferred = new Promise(resolve => {
        promiseResolve = resolve;
      });
      const action = jest.fn().mockReturnValue(deferred);
      const command = createCommand(action);

      let executed = false;
      command.execute().then(() => {
        executed = true;
        done();
      });

      expect(executed).toBe(false);
      promiseResolve();
    });
  });

  describe('#isDisabled()', () => {
    it('is "true" when command in progress', function(done) {
      const action = jest.fn().mockResolvedValue();
      const command = createCommand(action);

      expect(command.isDisabled()).toBe(false);
      command.execute().then(() => {
        expect(command.isDisabled()).toBe(false);
        done();
      });
    });
  });

  describe('#inProgress()', () => {
    it('is "true" when command in progress', function(done) {
      const action = jest.fn().mockResolvedValue();
      const command = createCommand(action);

      expect(command.inProgress()).toBe(false);
      command.execute().then(() => {
        expect(command.inProgress()).toBe(false);
        done();
      });
    });
  });
});
