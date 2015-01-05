'use strict';

describe('SlugEditorController', function () {
  beforeEach(function () {
    module('contentful/test');

    this.scope = this.$inject('$rootScope').$new();

    var cfStub = this.$inject('cfStub'),
        space = cfStub.space('testSpace'),
        contentTypeData = cfStub.contentTypeData('testType'),
        scope = this.scope,
        $q = this.$inject('$q');

    dotty.put(this.scope, 'fieldData.value', null);
    dotty.put(this.scope, 'locale.code', 'en_US');
    dotty.put(this.scope, 'field.apiName', 'slug');
    this.scope.otEditable = true;
    this.scope.otGetValue = sinon.stub().returns(null);

    this.scope.otChangeStringP = function (value) {
      scope.otGetValue.returns(value || null);
      return $q.when();
    };
    this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
    this.scope.entry = cfStub.entry(space, '__ID__', 'testType', {}, {
      sys: { publishedVersion: 1 }
    });
    this.scope.entry.isPublished = sinon.stub().returns(false);
    this.scope.spaceContext.entryTitle = sinon.stub().returns(null);

    this.controller = this.$inject('$controller')('SlugEditorController', {$scope: this.scope});
    this.$apply();
  });

  describe('#titleToSlug', function () {
    beforeEach(function () {
      this.scope.spaceContext.entryTitle = sinon.stub().returns(null);
      this.$apply();
    });

    it('should use the ID for the slug when the title is empty', function () {
      expect(this.scope.fieldData.value).toEqual('__ID__');
    });

    it('should set the slug to a representation of the title', function () {
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is a title');
      this.$apply();
      expect(this.scope.fieldData.value).toEqual('this-is-a-title');
    });

    it('should not track the title if both fields have diverged', function () {
      // Set divergent slug and title
      this.scope.fieldData.value = 'das-ist-ein-weiterer-titel';
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is another title');
      this.$apply();
      // Notice the slug has not changed
      expect(this.scope.fieldData.value).toEqual('das-ist-ein-weiterer-titel');
    });

    it('should track the title if both fields have not diverged', function () {
      // Set similar slug and title
      this.scope.fieldData.value = 'this-is-the-first-title';
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is the first title');
      this.$apply();
      // Change title
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is the second title');
      this.$apply();
      // Notice the slug has been updated
      expect(this.scope.fieldData.value).toEqual('this-is-the-second-title');
    });

    it('should not track the title if the entry has been published', function () {
      // Write a title
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is the first title');
      this.$apply();
      // Publish the entry
      this.scope.entry.isPublished = sinon.stub().returns(true);
      this.$apply();
      // Change the title
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is the second title');
      this.$apply();
      // Notice the slug is still the first title
      expect(this.scope.fieldData.value).toEqual('this-is-the-first-title');
    });
  });
});
