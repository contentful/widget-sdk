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
    sinon.stub(LazyLoader, 'get', function () { return $q.when(libs); });
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

  it('notifies with error for incorrect HTML', function () {
    startLivePreview(getContentFn, function(err) {
      expect(err !== null).toBe(true);
    });
    scope.$apply();
    content = '<img src=>';
    $timeout.flush();
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
