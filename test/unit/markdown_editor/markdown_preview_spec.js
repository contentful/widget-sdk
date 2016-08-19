'use strict';

describe('Markdown preview', function() {
  var $timeout, scope;
  var startLivePreview;
  var libs = window.cfLibs.markdown;

  var content;
  var getContentFn = function () { return content || '__test__'; };

  beforeEach(function () {
    module('contentful/test');

    $timeout = this.$inject('$timeout');
    scope = this.$inject('$rootScope');
    startLivePreview = this.$inject('MarkdownEditor/preview');

    var $q = this.$inject('$q');
    var LazyLoader = this.$inject('LazyLoader');
    sinon.stub(LazyLoader, 'get', function () { return $q.resolve(libs); });
  });

  afterEach(function () { content = null; });

  it('notifies with Markdown preview and stats', function () {
    startLivePreview(getContentFn, function (err, preview) {
      expect(err).toBe(null);
      expect(_.isObject(preview)).toBe(true);
      expect(preview.tree.type).toBe('div');
      expect(preview.info.words).toBe(1);
    });
    scope.$apply(); // resolve lazy loader
    $timeout.flush(); // notify
  });

  it('notifies even when content is null or undefined', function () {
    var s1 = sinon.spy();
    var s2 = sinon.spy();
    startLivePreview(function () { return null; }, s1);
    startLivePreview(function () { return undefined; }, s2);
    scope.$apply();
    $timeout.flush();
    sinon.assert.called(s1);
    sinon.assert.called(s2);
  });

  it('notifies after the change to content only', function () {
    var previewSpy = sinon.spy();
    startLivePreview(getContentFn, previewSpy);
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
    var previewSpy = sinon.spy();
    var off = startLivePreview(getContentFn, previewSpy);
    scope.$apply();
    $timeout.flush();
    sinon.assert.calledOnce(previewSpy);
    content = '__test2__';
    off();
    $timeout.flush();
    sinon.assert.calledOnce(previewSpy);
  });
});
