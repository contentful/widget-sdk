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

    this.$q = $q;
    dotty.put(this.scope, 'fieldData.value', null);
    dotty.put(this.scope, 'locale.code', 'en_US');
    dotty.put(this.scope, 'field.apiName', 'slug');
    this.scope.otGetValue = sinon.stub().returns(null);

    this.scope.otChangeString = function (value) {
      scope.otGetValue.returns(value || null);
      return $q.when();
    };
    this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
    this.scope.entry = cfStub.entry(space, '__ID__', 'testType', {}, {
      sys: {
        publishedVersion: 1,
        createdAt: '2015-01-28T10:38:28.989Z'
      }
    });
    this.controller = this.$inject('$controller')('SlugEditorController', {$scope: this.scope});
    this.$apply();
  });

  describe('#titleToSlug', function () {
    beforeEach(function () {
      this.scope.otEditable = true;
      this.scope.entry.isPublished = sinon.stub().returns(false);
      this.scope.spaceContext.entryTitle = sinon.stub().returns(null);
      this.$apply();
    });

    it('should use an "untitled" slug with the entry creation time, when the title is empty', function () {
      expect(this.scope.fieldData.value).toEqual('untitled-entry-2015-01-28-at-10-38-28');
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

    it('should resume tracking title if the entry has been published and unpublished', function () {
      // Write a title
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is the first title');
      this.$apply();
      // Publish the entry
      this.scope.entry.isPublished = sinon.stub().returns(true);
      this.$apply();
      // Unpublish the entry
      this.scope.entry.isPublished = sinon.stub().returns(false);
      this.$apply();
      // Change the title
      this.scope.spaceContext.entryTitle = sinon.stub().returns('This is the second title');
      this.$apply();
      // Notice the slug is updated
      expect(this.scope.fieldData.value).toEqual('this-is-the-second-title');
    });

  });

  describe('#alreadyPublished', function () {
    beforeEach(function () {
      this.scope.otEditable = true;
      this.scope.entry.isPublished = sinon.stub().returns(true);
      this.scope.spaceContext.entryTitle = sinon.stub().returns('old title');
      this.scope.fieldData.value = 'old-title';
      this.$apply();
    });

    it('does not track title when entry is already published', function () {
      this.scope.spaceContext.entryTitle = sinon.stub().returns('New title');
      this.$apply();
      expect(this.scope.fieldData.value).toEqual('old-title');
    });
  });

  describe('#uniqueness', function () {
    beforeEach(function () {
      this.scope.otEditable = true;
      this.scope.entry.isPublished = sinon.stub().returns(false);
      this.scope.spaceContext.entryTitle = sinon.stub().returns(null);
      this.$apply();
    });

    it('should show uniqueness when there are no other entries in the query result', function () {
      var $q = this.$q;
      // Let the server respond with zero entries
      this.scope.spaceContext.space.getEntries = function () {
        return $q.when({ total: 0 });
      };
      // Set a new title.
      this.scope.spaceContext.entryTitle = sinon.stub().returns('New Title');
      this.$apply();
      expect(this.scope.state).toEqual('unique');
      expect(this.scope.fieldData.value).toEqual('new-title');
    });

    it('should show the state as unique when there are matching entries in the query result', function () {
      var $q = this.$q;
      // Let the server respond with one entry
      this.scope.spaceContext.space.getEntries = function () {
        return $q.when({ total: 1 });
      };
      // Set a new title.
      this.scope.spaceContext.entryTitle = sinon.stub().returns('New Title');
      this.$apply();
      expect(this.scope.state).toEqual('duplicate');
      expect(this.scope.fieldData.value).toEqual('new-title');
    });

    it('should show the state as "checking" when the query has not been resolved', function () {
      var $q = this.$q,
          responsePDeferred = $q.defer();
      // Return a promise without resolving it yet, to mimic a delay in the server's response
      this.scope.spaceContext.space.getEntries = function () {
        return responsePDeferred.promise;
      };
      // Set a new title.
      this.scope.spaceContext.entryTitle = sinon.stub().returns('New Title');
      this.$apply();
      expect(this.scope.state).toEqual('checking');
      // Now 'receive' the server response by resolving the promise.
      responsePDeferred.resolve({ total: 0 });
      this.$apply();
      expect(this.scope.state).toEqual('unique');
      expect(this.scope.fieldData.value).toEqual('new-title');
    });
  });
});
