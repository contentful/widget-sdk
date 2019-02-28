import { constant, range } from 'lodash';
import * as sinon from 'test/helpers/sinon';
import * as DOM from 'test/helpers/DOM';

describe('cfBreadcrumbsDirective spec', () => {
  beforeEach(function() {
    module('contentful/test');

    const contextHistory = this.$inject('navigation/Breadcrumbs/History.es6').default;
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
