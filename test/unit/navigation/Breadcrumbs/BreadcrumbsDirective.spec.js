import { constant, range } from 'lodash';
import sinon from 'sinon';
import { $initialize, $flush, $compile } from 'test/utils/ng';
import * as DOM from 'test/utils/dom';

describe('cfBreadcrumbsDirective spec', () => {
  beforeEach(async function() {
    this.stubs = {
      go: sinon.stub()
    };

    const { default: contextHistory } = await this.system.import(
      'navigation/Breadcrumbs/History.es6'
    );

    await $initialize(this.system, $provide => {
      $provide.constant('$state', {
        go: this.stubs.go,
        includes: sinon.stub()
      });
    });

    const el = $compile('<cf-breadcrumbs />');
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
      $flush();
    };
  });

  describe('"back" button', () => {
    it('goes back to second to last crumb', function() {
      this.setCrumbs(4);
      this.view.find('breadcrumbs-back-btn').click();
      sinon.assert.calledOnceWith(this.stubs.go, 'state2', { id: 'param2' });
    });

    it('is only shown for more than one crumbs', function() {
      this.setCrumbs(1);
      this.view.find('breadcrumbs-back-btn').assertNotVisible();

      this.setCrumbs(2);
      this.view.find('breadcrumbs-back-btn').assertIsVisible();
    });
  });
});
