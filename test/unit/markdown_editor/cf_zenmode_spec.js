'use strict';

describe('cfZenmode', function () {
  var editor;
  var libs = window.cfLibs.markdown;

  var tieSpy = sinon.spy();
  var apiMock = {
    registerChild: sinon.spy(),
    syncToParent: sinon.spy(),
    getParent: function () {
      return { tie: { editorToEditor: tieSpy } };
    }
  };

  beforeEach(function () {
    module('contentful/test');

    var $q = this.$inject('$q');
    var LazyLoader = this.$inject('LazyLoader');
    var scopeProps = { zenApi: apiMock, preview: {} };

    sinon.stub(LazyLoader, 'get', function () {
      return $q.when(libs);
    });

    var elem = this.$compile('<cf-zenmode zen-api="zenApi" />', scopeProps);
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

    var otherZenMode = this.$compile('<cf-zenmode zen-api="zenApi">', {zenApi: apiMock});
    var otherScope = otherZenMode.isolateScope();
    expect(otherScope.isPreviewActive).toEqual(false);
  });
});
