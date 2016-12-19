'use strict';

describe('Markdown preview', function () {
  let $timeout, scope;
  let preview;
  const libs = window.cfLibs.markdown;

  let content;
  const getContentFn = function () { return content || '__test__'; };

  beforeEach(function () {
    module('contentful/test');

    $timeout = this.$inject('$timeout');
    scope = this.$inject('$rootScope');
    preview = this.$inject('markdown_editor/markdown_preview');

    const $q = this.$inject('$q');
    const LazyLoader = this.$inject('LazyLoader');
    sinon.stub(LazyLoader, 'get', function () { return $q.resolve(libs); });
  });

  afterEach(function () { content = null; });

  it('notifies with Markdown preview and stats', function () {
    preview.start(getContentFn, function (err, preview) {
      expect(err).toBe(null);
      expect(_.isObject(preview)).toBe(true);
      expect(preview.tree.type).toBe('div');
      expect(preview.info.words).toBe(1);
    });
    scope.$apply(); // resolve lazy loader
    $timeout.flush(); // notify
  });

  it('notifies even when content is null or undefined', function () {
    const s1 = sinon.spy();
    const s2 = sinon.spy();
    preview.start(function () { return null; }, s1);
    preview.start(function () { return undefined; }, s2);
    scope.$apply();
    $timeout.flush();
    sinon.assert.called(s1);
    sinon.assert.called(s2);
  });

  it('notifies after the change to content only', function () {
    const previewSpy = sinon.spy();
    preview.start(getContentFn, previewSpy);
    scope.$apply();
    sinon.assert.notCalled(previewSpy);
    $timeout.flush();
    sinon.assert.calledOnce(previewSpy);
    $timeout.flush();
    sinon.assert.calledOnce(previewSpy);
    content = '__test2__';
    $timeout.flush();
    sinon.assert.calledTwice(previewSpy);
  });

  it('stops notifications when killed', function () {
    const previewSpy = sinon.spy();
    const stop = preview.start(getContentFn, previewSpy);
    scope.$apply();
    $timeout.flush();
    sinon.assert.calledOnce(previewSpy);
    content = '__test2__';
    stop();
    $timeout.flush();
    sinon.assert.calledOnce(previewSpy);
  });
});
