import * as K from 'helpers/mocks/kefir';

describe('ui/ResizeDetector', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$scope = this.$inject('$rootScope').$new();
  });

  afterEach(function () {
    $('body').empty();
    this.$scope.$destroy();
  });

  it('emits when container is resized', function* () {
    const {h} = this.$inject('utils/hyperscript');
    const {observeResize} = this.$inject('ui/ResizeDetector');
    const container = $(h('#container', {
      style: {
        display: 'flex',
        width: '100px',
        height: '100px'
      }
    }, [h('#inner', {style: {flexGrow: 1}})])).appendTo('body');
    const inner = container.find('#inner');
    const width$ = observeResize(inner.get(0))
      .map(() => inner.width());
    const onValue = sinon.spy();
    width$.onValue(onValue);
    container.width(1000);
    // Not sure why we need to wait twice.
    yield rafWait(2);
    sinon.assert.calledWith(onValue, 1000);
  });

  it('removes helper elements when unsubscribed', function* () {
    const {h} = this.$inject('utils/hyperscript');
    const {observeResize} = this.$inject('ui/ResizeDetector');
    const container = $(h('#container', {
      style: {
        display: 'flex',
        width: '100px',
        height: '100px'
      }
    }, [h('#inner', {style: {flexGrow: 1}})])).appendTo('body');
    const inner = container.find('#inner');
    const resize$ = observeResize(inner.get(0));
    expect(inner.children().length).toBe(0);
    const off = K.onValue(resize$, _.noop);
    yield rafWait();
    expect(inner.children().length).toBe(1);
    off();
    yield rafWait();
    expect(inner.children().length).toBe(0);
  });

  function rafWait (n = 1) {
    return new Promise((resolve) => {
      window.requestAnimationFrame(resolve);
    }).then(() => {
      if (n > 0) {
        return rafWait(n - 1);
      }
    });
  }
});
