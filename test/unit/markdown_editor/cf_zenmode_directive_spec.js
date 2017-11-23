import * as sinon from 'helpers/sinon';

describe('cfZenmode', function () {
  let editor;
  const libs = window.cfLibs.markdown;

  const tieSpy = sinon.spy();
  const apiMock = {
    registerChild: sinon.spy(),
    syncToParent: sinon.spy(),
    getParent: function () {
      return {
        tie: {editorToEditor: tieSpy},
        restoreCursor: sinon.stub()
      };
    },
    getLocale: _.constant('en-US')
  };

  beforeEach(function () {
    module('contentful/test');

    const $q = this.$inject('$q');
    const LazyLoader = this.$inject('LazyLoader');
    const scopeProps = { zenApi: apiMock, preview: {} };

    sinon.stub(LazyLoader, 'get').callsFake(function () {
      return $q.resolve(libs);
    });

    const elem = this.$compile('<cf-zenmode zen-api="zenApi" />', scopeProps);
    this.scope = elem.isolateScope();

    // resolve lazy-load promise:
    this.scope.$apply();
    // can get CodeMirror instance from DOM node now:
    editor = elem.find('.CodeMirror').get(0).CodeMirror;
  });

  it('Registers editor on startup', function () {
    sinon.assert.calledOnce(apiMock.registerChild);
    sinon.assert.calledOnce(tieSpy);
  });

  it('Syncs changes from editor to parent', function () {
    editor.setValue('ZEN MODE VALUE');
    sinon.assert.calledOnce(apiMock.syncToParent);
  });

  it('shows preview by default', function () {
    expect(this.scope.isPreviewActive).toEqual(true);
  });

  it('remembers preview state for other instances', function () {
    this.scope.showPreview(false);
    expect(this.scope.isPreviewActive).toEqual(false);

    const otherZenMode = this.$compile('<cf-zenmode zen-api="zenApi">', {zenApi: apiMock});
    const otherScope = otherZenMode.isolateScope();
    expect(otherScope.isPreviewActive).toEqual(false);
  });
});
