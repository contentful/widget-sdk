import * as K from 'helpers/mocks/kefir';

describe('cfWelcome directive', function () {
  beforeEach(function () {
    this.hourStub = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('moment', () => {
        return {
          hour: this.hourStub,
          format: () => {}
        };
      });
      $provide.value('$state', {
        current: {
          name: 'home'
        }
      });
      $provide.value('services/ContactSales', {
        createContactLink: () => ''
      });
    });

    this.tokenStore = this.$inject('services/TokenStore');

    this.compileElement = (isNew) => {
      this.tokenStore.user$ = K.createMockProperty({
        firstName: 'Foo',
        signInCount: isNew ? 1 : 2
      });
      const el = this.$compile('<cf-welcome />');

      return el.isolateScope().welcome;
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
