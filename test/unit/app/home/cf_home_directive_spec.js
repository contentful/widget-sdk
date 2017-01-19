'use strict';

describe('cfHome directive', function () {
  beforeEach(function () {
    this.hourStub = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('moment', () => {
        return {hour: this.hourStub};
      });
    });

    this.K = this.$inject('mocks/kefir');
    this.tokenStore = this.$inject('tokenStore');

    this.compileElement = (isNew) => {
      this.tokenStore.user$ = this.K.createMockProperty({
        firstName: 'Foo',
        signInCount: isNew ? 1 : 2
      });
      const el = this.$compile('<cf-home />');

      return el.isolateScope().home;
    };
  });

  describe('greeting', function () {
    it('says welcome on initial login', function () {
      const ctrl = this.compileElement(true);
      expect(ctrl.greeting).toBe('Welcome, Foo.');
    });

    it('greets user on subsequent login', function () {
      greetsUserBasedOnTimeOfDay.call(this, 7, 'morning');
      greetsUserBasedOnTimeOfDay.call(this, 16, 'afternoon');
      greetsUserBasedOnTimeOfDay.call(this, 19, 'evening');
    });

    function greetsUserBasedOnTimeOfDay (hour, timeOfDay) {
      this.hourStub.returns(hour);
      const ctrl = this.compileElement(false);
      expect(ctrl.greeting).toBe(`Good ${timeOfDay}, Foo.`);
    }
  });
});
