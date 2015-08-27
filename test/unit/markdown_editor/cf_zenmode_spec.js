'use strict';

describe('cfZenmode', function () {
  var editor;
  var libs = window.cfLibs.markdown;
  var apiMock = { registerChild: sinon.spy(), syncToParent: sinon.spy() };

  beforeEach(function () {
    module('contentful/test');

    var $q = this.$inject('$q');
    var LazyLoader = this.$inject('LazyLoader');
    var scopeProps = { zenApi: apiMock, preview: {} };

    sinon.stub(LazyLoader, 'get', function () {
      return $q.when(libs);
    });

    var elem = this.$compile('<cf-zenmode zen-api="zenApi" />', scopeProps);
    var scope = elem.isolateScope();

    // resolve lazy-load promise:
    scope.$apply();
    // can get CodeMirror instance from DOM node now:
    editor = elem.find('.CodeMirror').get(0).CodeMirror;
  });

  it('Registers editor on startup', function () {
    sinon.assert.calledOnce(apiMock.registerChild);
  });

  it('Syncs changes from editor to parent', function () {
    editor.setValue('ZEN MODE VALUE');
    sinon.assert.calledOnce(apiMock.syncToParent);
  });
});
