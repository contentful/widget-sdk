import * as sinon from 'test/helpers/sinon';
import _ from 'lodash';

describe('cfZenmode', () => {
  let editor;

  const tieSpy = sinon.spy();
  const parentSetHistory = sinon.spy();
  const apiMock = {
    registerChild: sinon.spy(),
    syncToParent: sinon.spy(),
    getParent: function() {
      return {
        tie: { editorToEditor: tieSpy },
        restoreCursor: sinon.stub(),
        setHistory: parentSetHistory
      };
    },
    getLocale: _.constant('en'),
    setHistory: sinon.spy()
  };

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    const scopeProps = { zenApi: apiMock, preview: {} };
    const elem = this.$compile('<cf-zenmode zen-api="zenApi" />', scopeProps);
    this.scope = elem.isolateScope();

    // can get CodeMirror instance from DOM node now:
    editor = elem.find('.CodeMirror').get(0).CodeMirror;
  });

  it('Registers editor on startup', () => {
    sinon.assert.calledOnce(apiMock.registerChild);
    sinon.assert.calledOnce(tieSpy);
  });

  it('sets history of parent', () => {
    sinon.assert.calledOnceWith(parentSetHistory, editor.getHistory());
  });

  it('Syncs changes from editor to parent', () => {
    editor.setValue('ZEN MODE VALUE');
    sinon.assert.calledOnce(apiMock.syncToParent);
  });

  it('shows preview by default', function() {
    expect(this.scope.isPreviewActive).toEqual(true);
  });

  it('remembers preview state for other instances', function() {
    this.scope.showPreview(false);
    expect(this.scope.isPreviewActive).toEqual(false);

    const otherZenMode = this.$compile('<cf-zenmode zen-api="zenApi">', { zenApi: apiMock });
    const otherScope = otherZenMode.isolateScope();
    expect(otherScope.isPreviewActive).toEqual(false);
  });
});
