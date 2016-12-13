'use strict';

describe('cfHome directive', function () {
  beforeEach(function () {
    this.momentStub = sinon.stub();
    module('contentful/test', ($provide) => {
      $provide.value('moment', () => {
        return {
          format: this.momentStub
        };
      });
    });

    this.compileElement = function (isNewUser) {
      const signInCount = isNewUser ? 1 : 2;
      this.user = {firstName: 'Foo', signInCount: signInCount};
      this.element = this.$compile('<cf-home />', {context: {}});
      this.controller = this.element.scope().home;
    };

    this.moment = this.$inject('moment');

  });

  describe('greeting', function () {
    it('says welcome on initial login', function () {
      this.compileElement(true);
      expect(this.controller.getGreeting(this.user)).toBe('Welcome, Foo.');
    });

    it('greets user on subsequent login', function () {
      greetsUserBasedOnTimeOfDay.call(this, 7, 'morning');
      greetsUserBasedOnTimeOfDay.call(this, 16, 'afternoon');
      greetsUserBasedOnTimeOfDay.call(this, 19, 'evening');
    });

    function greetsUserBasedOnTimeOfDay (hour, timeOfDay) {
      this.momentStub.returns(hour);
      this.compileElement(false);
      expect(this.controller.getGreeting(this.user)).toBe(`Good ${timeOfDay}, Foo.`);
    }
  });
});
