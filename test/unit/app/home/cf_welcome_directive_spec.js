import { createElement as h } from 'react';

describe('Welcome react component', () => {
  beforeEach(function() {
    this.hourStub = sinon.stub();

    module('contentful/test', $provide => {
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

    this.tokenStore = this.$inject('services/TokenStore.es6');

    const Welcome = this.$inject('app/home/welcome/Welcome.es6').default;

    this.renderWelcomeElement = isNew => {
      this.ui = this.createUI();
      this.ui.render(
        h(Welcome, {
          user: {
            firstName: 'Foo',
            signInCount: isNew ? 1 : 2
          }
        }),
        this.container
      );
    };
  });

  describe('greeting', () => {
    it('says welcome on initial login', function() {
      this.renderWelcomeElement(true);
      const welcomeElement = this.ui.find('greeting');

      welcomeElement.assertHasText('Welcome, Foo');
    });

    it('greets user on subsequent login', function() {
      greetsUserBasedOnTimeOfDay.call(this, 7, 'morning');
      greetsUserBasedOnTimeOfDay.call(this, 16, 'afternoon');
      greetsUserBasedOnTimeOfDay.call(this, 19, 'evening');
    });

    function greetsUserBasedOnTimeOfDay(hour, timeOfDay) {
      this.hourStub.returns(hour);
      this.renderWelcomeElement(false);
      const welcomeElement = this.ui.find('greeting');
      welcomeElement.assertHasText(`Good ${timeOfDay}, Foo.`);
    }
  });
});
