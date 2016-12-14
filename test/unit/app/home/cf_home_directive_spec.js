'use strict';

describe('cfHome directive', function () {
  beforeEach(function () {
    this.hourStub = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('moment', () => {
        return {hour: this.hourStub};
      });
    });

    this.compileElement = () => {
      const el = this.$compile('<cf-home />');
      return el.scope().home;
    };
  });

  const getUser = (isNew) => {
    return {firstName: 'Foo', signInCount: isNew ? 1 : 2};
  };

  describe('greeting', function () {
    it('says welcome on initial login', function () {
      const ctrl = this.compileElement();
      expect(ctrl.getGreeting(getUser(true))).toBe('Welcome, Foo.');
    });

    it('greets user on subsequent login', function () {
      greetsUserBasedOnTimeOfDay.call(this, 7, 'morning');
      greetsUserBasedOnTimeOfDay.call(this, 16, 'afternoon');
      greetsUserBasedOnTimeOfDay.call(this, 19, 'evening');
    });

    function greetsUserBasedOnTimeOfDay (hour, timeOfDay) {
      this.hourStub.returns(hour);
      const ctrl = this.compileElement();
      expect(ctrl.getGreeting(getUser())).toBe(`Good ${timeOfDay}, Foo.`);
    }
  });
});
