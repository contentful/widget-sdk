import sinon from 'sinon';
import { $initialize, $compile } from 'test/helpers/helpers';

describe('cfUiSticky directive', () => {
  beforeEach(async function() {
    await $initialize(this.system);
    const markup = `<div class="workbench-main" cf-ui-sticky-container>
                    <div>Block of content</div>
                    <nav cf-ui-sticky>Nav</nav>
                    <p>Some long content</p>
                    </div></div>`;
    this.$container = $compile(markup);
    this.$nav = this.$container.find('[cf-ui-sticky]');
    this.$container.offset = sinon.stub().returns({ top: 0 });
    this.$container.triggerHandler('scroll');
    this.clock = sinon.useFakeTimers();
    this.clock.tick(100);
  });

  afterEach(function() {
    this.clock.restore();
    this.$container.remove();
  });

  it('applies .fixed class when page is scrolled to the bottom', function() {
    this.$nav.parent()[0].getBoundingClientRect = sinon.stub().returns({ top: -50 });
    this.$container.triggerHandler('scroll');
    expect(this.$nav.hasClass('fixed')).toBe(true);
  });

  it('does not apply .fixed class when element is in viewport', function() {
    this.$nav.parent()[0].getBoundingClientRect = sinon.stub().returns({ top: 100 });
    this.$container.triggerHandler('scroll');
    expect(this.$nav.hasClass('fixed')).toBe(false);
  });
});
