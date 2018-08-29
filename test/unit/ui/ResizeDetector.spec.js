import * as K from 'helpers/mocks/kefir';
import { h } from 'ui/Framework';
import { observeResize } from 'ui/ResizeDetector';

describe('ui/ResizeDetector', () => {
  beforeEach(function() {
    const view = this.createUI();
    view.render(
      h(
        '#container',
        {
          style: {
            display: 'flex',
            width: '100px',
            height: '100px'
          }
        },
        [h('#inner', { style: { flexGrow: 1 } })]
      )
    );

    this.container = $(view.element).find('#container');
  });

  it('emits when container is resized', function*() {
    const inner = this.container.find('#inner');
    const innerWidth$ = observeResize(inner.get(0)).map(() => inner.width());
    // This promise resolves when the width of the inner container
    // changes to 1000
    const resizeDetected = innerWidth$
      .filter(width => width === 1000)
      .take(1)
      .toPromise();

    this.container.width(1000);
    // We don’t need an assertion. We just make sure that this promise
    // resolves without timing out.
    yield resizeDetected;
  });

  it('removes helper elements when unsubscribed', function*() {
    const inner = this.container.find('#inner');
    const resize$ = observeResize(inner.get(0));
    expect(inner.children().length).toBe(0);
    const off = K.onValue(resize$, _.noop);
    // Not sure why we need to wait so long
    yield rafWait(5);
    expect(inner.children().length).toBe(1);
    off();
    yield rafWait();
    expect(inner.children().length).toBe(0);
  });

  function rafWait(n = 1) {
    return new Promise(resolve => {
      window.requestAnimationFrame(resolve);
    }).then(() => {
      if (n > 0) {
        return rafWait(n - 1);
      }
    });
  }
});
