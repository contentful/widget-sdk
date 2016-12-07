'use strict';

describe('cfHome directive', function () {
  let momentStub;
  beforeEach(function () {
    momentStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('moment', function () {
        return {
          format: momentStub
        };
      });
    });

    this.compileElement = function (isNewUser) {
      const signInCount = isNewUser ? 1 : 2;
      this.tokenStore.getUser = sinon.stub().resolves({firstName: 'Foo', signInCount: signInCount});
      this.element = this.$compile('<cf-home />', {context: {}});
      this.controller = this.element.scope().home;
    };

    this.tokenStore = this.$inject('tokenStore');
    this.moment = this.$inject('moment');

  });

  afterEach(function () {
    momentStub = null;
  });

  describe('greeting', function () {
    it('says welcome on initial login', function () {
      this.compileElement(true);
      expect(this.controller.greeting).toBe('Welcome, Foo.');
    });

    it('greets user on subsequent login', function () {
      greetsUserBasedOnTimeOfDay.call(this, 7, 'morning');
      greetsUserBasedOnTimeOfDay.call(this, 16, 'afternoon');
      greetsUserBasedOnTimeOfDay.call(this, 19, 'evening');
    });

    function greetsUserBasedOnTimeOfDay (hour, timeOfDay) {
      momentStub.returns(hour);
      this.compileElement(false);
      expect(this.controller.greeting).toBe(`Good ${timeOfDay}, Foo.`);
    }
  });
});
