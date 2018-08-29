import { constant, range } from 'lodash';
import * as sinon from 'helpers/sinon';
import * as DOM from 'helpers/DOM';

describe('cfBreadcrumbsDirective spec', () => {
  beforeEach(function() {
    module('contentful/test');

    const contextHistory = this.$inject('navigation/Breadcrumbs/History').default;
    this.$state = this.mockService('$state');

    const el = this.$compile('<cf-breadcrumbs />');
    this.view = DOM.createView(el.get(0));

    // Set the current breadcrumbs to a list of breadcrumbs of the
    // given size.
    this.setCrumbs = count => {
      const crumbs = range(count).map(i => {
        return {
          getTitle: constant(`title${i}`),
          link: {
            state: `state${i}`,
            params: { id: `param${i}` }
          },
          type: `type${i}`,
          id: i,
          icon: 'settings'
        };
      });

      contextHistory.set(crumbs);
      this.$flush();
    };
  });

  describe('ancestor menu', () => {
    it('is only shown for more then two crumbs', function() {
      this.setCrumbs(1);
      this.view.find('breadcrumbs-ancestor-btn').assertNotVisible();

      this.setCrumbs(2);
      this.view.find('breadcrumbs-ancestor-btn').assertNotVisible();

      this.setCrumbs(3);
      this.view.find('breadcrumbs-ancestor-btn').assertIsVisible();
    });

    it('shows crumb title in menu', function() {
      this.setCrumbs(4);
      this.view.find('breadcrumbs-ancestor-btn').click();
      this.$flush();
      range(0, 3).map(i => {
        const el = this.view.find(`breadcrumbs.crumb.${i}`);
        el.assertHasText(`title${i}`);
      });
      this.view.find('breadcrumbs.crumb.3').assertNotVisible();
    });

    it('goes to crumb state on click', function() {
      this.setCrumbs(4);

      this.view.find('breadcrumbs-ancestor-btn').click();
      this.$flush();

      this.view.find(`breadcrumbs.crumb.${2}`).click();
      this.$flush();
      sinon.assert.calledOnceWith(this.$state.go, 'state2', { id: 'param2' });
    });
  });

  describe('"back" button', () => {
    it('goes back to second to last crumb', function() {
      this.setCrumbs(4);
      this.view.find('breadcrumbs-back-btn').click();
      sinon.assert.calledOnceWith(this.$state.go, 'state2', { id: 'param2' });
    });

    it('is only shown for more than one crumbs', function() {
      this.setCrumbs(1);
      this.view.find('breadcrumbs-back-btn').assertNotVisible();

      this.setCrumbs(2);
      this.view.find('breadcrumbs-back-btn').assertIsVisible();
    });
  });
});
