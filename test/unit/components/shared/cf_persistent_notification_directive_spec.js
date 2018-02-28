'use strict';

describe('cfPersistentNotification Directive', function () {
  let element, scope;
  let $rootScope, $timeout;

  beforeEach(function () {
    this.logger = {};

    module('contentful/test', ($provide) => {
      $provide.value('logger', this.logger);
    });

    $rootScope = this.$inject('$rootScope');
    $timeout = this.$inject('$timeout');

    const data = { field: {} };
    element = this.$compile('<cf-persistent-notification />', data);
    scope = element.scope();
  });

  afterEach(function () {
    element.remove();
    element = scope = $rootScope = $timeout = null;
  });

  describe('broadcast a `message`', function () {
    const MESSAGE = 'SOME MESSAGE';

    beforeEach(function () {
      $rootScope.$broadcast('persistentNotification', {
        message: MESSAGE
      });
      digest();
    });

    itShowsTheNotification();

    it('shows the message', function () {
      expect($message().text()).toBe(MESSAGE);
    });
  });

  describe('broadcast nothing', function () {
    beforeEach(function () {
      $rootScope.$broadcast('persistentNotification');
      $rootScope.$broadcast('persistentNotification', null);
      digest();
    });

    it('hides the notification', function () {
      expect($body().length).toBe(0);
    });
  });

  describe('broadcast `actionMessage`', function () {
    beforeEach(function () {
      $rootScope.$broadcast('persistentNotification', {
        actionMessage: 'some message'
      });
      digest();
    });

    itShowsTheNotification();

    it('shows a button', function () {
      expect($body().find('button')).not.toBeNgHidden();
    });
  });

  describe('reset', function () {
    beforeEach(function () {
      $rootScope.$broadcast('persistentNotification', {
        message: 'foo'
      });
    });

    it('hides the notification', function () {
      $rootScope.$broadcast('resetPersistentNotification');
      scope.$digest();
      expect($body().length).toBe(0);
    });
  });

  describe('concurrent notifications handling', function () {
    const PARAMS_1 = { message: 'FIRST MESSAGE' };
    const PARAMS_2 = { message: 'some message 2' };

    beforeEach(function () {
      this.logger.logWarn = sinon.stub();
      $rootScope.$broadcast('persistentNotification', null);
      $rootScope.$broadcast('persistentNotification', PARAMS_1);
      $rootScope.$broadcast('persistentNotification', PARAMS_2);
      $rootScope.$broadcast('persistentNotification', null);
      digest();
    });

    itShowsTheNotification();

    it('shows the first message and ignores resets', function () {
      expect($message().text()).toBe(PARAMS_1.message);
    });

    it('dismisses all notifications', function () {
      $rootScope.$broadcast('resetPersistentNotification');
      scope.$digest();
      expect($body().length).toBe(0);
    });

    it('logs concurrent broadcasted notification params', function () {
      const RESET_NOTE = '*RESET NOTIFICATION*';
      sinon.assert.calledOnce(this.logger.logWarn);
      sinon.assert.calledWithExactly(this.logger.logWarn,
        sinon.match.string,
        { notifications: [ RESET_NOTE, PARAMS_1, PARAMS_2, RESET_NOTE ] }
      );
    });
  });

  function itShowsTheNotification () {
    it('shows the notification', function () {
      expect($body().length).toBe(1);
    });
  }

  function $body () {
    return element.find('.persistent-notification');
  }

  function $message () {
    return $body().find('[data-test-id="message"]');
  }

  function digest () {
    scope.$digest();
    $timeout.flush();
    $timeout.verifyNoPendingTasks();
  }
});
