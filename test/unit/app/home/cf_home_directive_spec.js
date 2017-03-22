import * as K from 'helpers/mocks/kefir';

describe('cfHome directive', function () {
  beforeEach(function () {
    this.hourStub = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('moment', () => {
        return {hour: this.hourStub};
      });
    });

    this.tokenStore = this.$inject('tokenStore');
    this.CreateSpace = this.$inject('services/CreateSpace');
    this.CreateSpace.showDialog = sinon.stub();
    this.accessChecker = this.$inject('accessChecker');
    this.accessChecker.canCreateSpace$ = K.createMockProperty(true);

    this.compileElement = (isNew) => {
      this.tokenStore.user$ = K.createMockProperty({
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

  describe('prompt space creation', function () {
    it('does not show modal when spaces are not loaded yet', function () {
      this.tokenStore.spaces$ = K.createMockProperty(null);
      this.compileElement();
      sinon.assert.notCalled(this.CreateSpace.showDialog);
    });

    it('does not show modal when spaces exist', function () {
      this.tokenStore.spaces$ = K.createMockProperty([{}]);
      this.compileElement();
      sinon.assert.notCalled(this.CreateSpace.showDialog);
    });

    it('shows modal when there are no spaces', function () {
      this.tokenStore.spaces$ = K.createMockProperty([]);
      this.compileElement();
      sinon.assert.calledOnce(this.CreateSpace.showDialog);
    });
  });
});
