'use strict';

describe('Entry List Controller', function () {
  var controller, scope;
  var stubs;
  var createController;

  var makeEntry = function (sys) {
    var entry;
    inject(function (contentfulClient) {
      entry = new contentfulClient.Entity({ sys: sys || {} });
    });
    stubs.deleted = sinon.stub(entry, 'isDeleted');
    stubs.published = sinon.stub(entry, 'isPublished');
    stubs.hasUnpublishedChanges = sinon.stub(entry, 'hasUnpublishedChanges');
    entry.isArchived = stubs.archived;
    entry.getContentTypeId = stubs.getContentTypeId;
    return entry;
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'archived',
        'getContentTypeId',
        'track',
        'load',
        'then',
        'captureError',
        'getUIConfig',
        'setUIConfig'
      ]);
      $provide.value('sentry', {
        captureError: stubs.captureError
      });

      $provide.value('analytics', {
        track: stubs.track
      });
    });
    inject(function ($rootScope, $controller, cfStub, PromisedLoader) {
      stubs.load = sinon.stub(PromisedLoader.prototype, 'load');
      stubs.load.returns({
        then: stubs.then
      });
      scope = $rootScope.$new();

      scope.tab = {
        params: {}
      };

      var space = cfStub.space('test');
      space.getUIConfig = stubs.getUIConfig;
      space.setUIConfig = stubs.setUIConfig;
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      createController = function() {
        controller = $controller('EntryListCtrl', {$scope: scope});
      };
    });
  });

  afterEach(inject(function ($log) {
    stubs.load.restore();
    $log.assertEmpty();
  }));

  describe('loads ui config', function() {
    it('initializes a non existing config', function() {
      stubs.getUIConfig.callsArgWith(0, null);
      createController();
      expect(scope.uiConfig).toBeTruthy();
    });

    it('loads an existing config', function() {
      var config = {savedPresets: [{}]};
      stubs.getUIConfig.callsArgWith(0, null, config);
      createController();
      expect(scope.uiConfig).toBe(config);
    });
  });

  describe('loads a ui config preset', function() {
    var preset;

    beforeEach(function() {
      createController();
      scope.resetEntries = sinon.stub();

      preset = {
        id: 'foo',
        title: 'Derp',
        searchTerm: 'search term',
        contentTypeId: 'ctid',
        displayedFields: ['field1', 'field2'],
        order: {
          fieldId: 'fieldid',
          direction: 'descending'
        }
      };
      scope.loadPreset(preset);
    });


    it('sets the preset, omitting the id', function () {
      var loaded = _.omit(preset, 'id');
      loaded.title = 'Derp (copy)';
      expect(scope.tab.params.preset).toEqual(loaded);
    });

    it('resets entries', function() {
      expect(scope.resetEntries).toBeCalled();
    });

  });

  xdescribe('opens the view saving dialog', function() {
    // TODO WTF is this supposed to do?
    var fields = ['field1', 'field2'];
    var orderField = {id: 'fieldid', sys: false};
    beforeEach(inject(function(modalDialog) {
      stubs.open = sinon.stub(modalDialog, 'open');
      stubs.open.returns({then: stubs.then});
      stubs.then.callsArg(0);
      createController();
    }));

    describe('loads an existing preset', function() {
      beforeEach(function() {
        var preset = {
          id: 'existing id',
          title: 'existing preset',
          searchTerm: 'search term',
          contentTypeId: 'ctid',
          displayedFields: fields,
          order: {
            fieldId: 'fieldid',
            direction: 'descending'
          }
        };
        scope.uiConfig = {
          savedPresets: [preset]
        };

        scope.openSaveView();
      });

      it('updates the preset in the presets collection', function() {
        var presets = scope.uiConfig.savedPresets;
        var foundPreset = _.find(presets, function (val) { return val.id == 'existing id';});
        expect(foundPreset).toBe(scope.uiConfigLoadedPreset);
      });

      it('saves ui config', function() {
        expect(stubs.setUIConfig).toBeCalled();
      });

    });

    describe('creates a new preset', function() {
      beforeEach(function() {
        scope.searchTerm = 'search term';
        scope.tab.params.contentTypeId = 'ctid';
        scope.displayedFields = fields;
        scope.orderField = orderField;
        scope.orderDirection = 'ascending';

        scope.uiConfig = {
          savedPresets: []
        };

        scope.openSaveView();
      });

      it('has new id', function() {
        expect(scope.uiConfigLoadedPreset.id).toBeDefined();
      });

      it('has new title', function() {
        expect(scope.uiConfigLoadedPreset.title).toBe('');
      });

      it('has search term', function() {
        expect(scope.uiConfigLoadedPreset.searchTerm).toBe('search term');
      });

      it('has content type id', function() {
        expect(scope.uiConfigLoadedPreset.contentTypeId).toBe('ctid');
      });

      it('has displayedFields', function() {
        expect(scope.uiConfigLoadedPreset.displayedFields).toBe(fields);
      });

      it('has order field id', function() {
        expect(scope.uiConfigLoadedPreset.order.field.id).toBe(orderField.id);
      });

      it('has order field sys', function() {
        expect(scope.uiConfigLoadedPreset.order.field.sys).toBe(orderField.sys);
      });

      it('has order direction', function() {
        expect(scope.uiConfigLoadedPreset.order.direction).toBe('ascending');
      });

      it('pushes the preset into the presets collection', function() {
        var presets = scope.uiConfig.savedPresets;
        var foundPreset = _.find(presets, function (val) { return val.searchTerm == 'search term';});
        expect(foundPreset).toBe(scope.uiConfigLoadedPreset);
      });

      it('saves ui config', function() {
        expect(stubs.setUIConfig).toBeCalled();
      });

    });


  });

  xdescribe('gets a path for the field content', function() {
    // TODO turn into test for orderquery
    beforeEach(function() {
      createController();
    });

    it('for sys fields', function() {
      expect(scope.getFieldPath({
        id: 'fieldid',
        sys: true
      })).toEqual('sys.fieldid');
    });

    it('for regular fields', function() {
      expect(scope.getFieldPath({
        id: 'fieldid'
      })).toEqual('fields.fieldid.en-US');
    });
  });

  describe('on search term change', function () {
    beforeEach(function() {
      createController();
    });

    describe('if term is null', function () {
      beforeEach(function () {
        scope.searchTerm = null;
        scope.$digest();
      });

      it('list is not defined', function () {
        expect(scope.tab.params.list).toBeUndefined();
      });

      it('contentTypeId is not defined', function () {
        expect(scope.tab.params.contentTypeId).toBeUndefined();
      });
    });

    describe('if term is set', function () {
      beforeEach(function () {
        scope.searchTerm = 'thing';
        scope.$digest();
      });

      it('page is set to the first one', function () {
        expect(scope.paginator.page).toBe(0);
      });
    });

  });

  describe('page parameters change trigger entries reset', function () {
    beforeEach(function () {
      createController();
      stubs.reset = sinon.stub(scope, 'resetEntries');
      scope.$digest();
      stubs.reset.restore();
    });

    it('search term', function () {
      scope.tab.params.searchTerm = 'thing';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('page', function () {
      scope.paginator.page = 1;
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('contentTypeId', function () {
      scope.tab.params.preset.contentTypeId = 'something';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('space id', function () {
      stubs.id = sinon.stub(scope.spaceContext.space, 'getId').returns(123);
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
      stubs.id.restore();
    });
  });

  describe('resetting entries', function() {
    var entries;
    beforeEach(function() {
      createController();
      stubs.switch = sinon.stub();
      entries = {
        total: 30
      };
      stubs.then.callsArgWith(0, entries);

      scope.selection = {
        switchBaseSet: stubs.switch
      };

      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
    });

    it('loads entries', function() {
      scope.resetEntries();
      scope.$apply();
      expect(stubs.load).toBeCalled();
    });

    it('sets entries num on the paginator', function() {
      scope.resetEntries();
      scope.$apply();
      expect(scope.paginator.numEntries).toEqual(30);
    });

    it('sets entries on scope', function() {
      scope.resetEntries();
      scope.$apply();
      expect(scope.entries).toBe(entries);
    });

    it('switches the selection base set', function() {
      scope.resetEntries();
      scope.$apply();
      expect(stubs.switch).toBeCalled();
    });

    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2].skip).toBeTruthy();
      });

      // TODO these tests should go into a test for the search query helper
      it('for all list', function() {
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.tab.params.preset.searchTerm = 'status:published';
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.tab.params.preset.searchTerm = 'status:changed';
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.load.args[0][2].changed).toBe('true');
      });

      it('for draft list', function() {
        scope.tab.params.preset.searchTerm = 'status:draft';
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.load.args[0][2]['sys.publishedVersion[exists]']).toBe('false');
        expect(stubs.load.args[0][2].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.tab.params.preset.searchTerm = 'status:archived';
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for contentType list', function() {
        pending('Need to change the test so that the content type is actually found');
        scope.tab.params.preset.contentTypeId = 'ct1';
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2]['content_type']).toBe('ct1');
      });

      it('for search term', function() {
        scope.tab.params.preset.searchTerm = 'term';
        scope.resetEntries();
        scope.$apply();
        expect(stubs.load.args[0][2].query).toBe('term');
      });
    });
  });

  it('has a query', function() {
    createController();
    scope.tab.params.preset.searchTerm = 'foo';
    expect(scope.hasQuery()).toBeTruthy();
  });

  it('has no query', function() {
    createController();
    scope.tab.params.preset.searchTerm = null;
    expect(scope.hasQuery()).toBeFalsy();
  });

  describe('loadMore', function () {
    var entries;
    beforeEach(function() {
      createController();
      entries = [];
      Object.defineProperty(entries, 'total', {value: 30});

      scope.entries = new Array(60);

      stubs.switch = sinon.stub();
      // loadMore triggers resetEntries which in reality will not
      // run because the promisedLoader prevents that. In this test
      // the PromisedLoader is stubbed, so we need to fake
      // resetEntries not running:
      scope.resetEntries = sinon.stub();
      scope.selection = {
        setBaseSize: sinon.stub(),
        switchBaseSet: stubs.switch
      };

      scope.paginator.atLast = sinon.stub();
      scope.paginator.atLast.returns(false);
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      scope.loadMore();
      expect(stubs.load).not.toBeCalled();
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      scope.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.loadMore();
      scope.$apply();
      expect(stubs.load.args[0][2]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      scope.$apply();
      expect(stubs.load).toBeCalled();
    });

    it('triggers analytics event', function () {
      scope.loadMore();
      scope.$apply();
      expect(stubs.track).toBeCalled();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        stubs.then.callsArgWith(0, entries);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('sets num entries', function() {
        scope.$apply();
        expect(scope.paginator.numEntries).toEqual(30);
      });

      it('appends entries to scope', function () {
        scope.$apply();
        expect(scope.entries.slice(60)).toEqual(entries);
      });

      it('sets selection base size', function () {
        scope.$apply();
        expect(scope.selection.setBaseSize.args[0][0]).toBe(60);
      });

    });

    it('discards entries already in the list', function () {
      scope.entries = ['a'];
      entries = ['a', 'b', 'c'];
      Object.defineProperty(entries, 'total', {value: 30});
      stubs.then.callsArgWith(0, entries);
      scope.paginator.page = 2;
      scope.loadMore();
      scope.$apply();
      expect(scope.entries).toEqual(['a', 'b', 'c']);
    });

    describe('on failed load response', function() {
      beforeEach(function() {
        stubs.load.returns(entries);
        scope.paginator.page = 1;
        scope.$apply(); //trigger resetEntries
        stubs.load.returns(null);
        scope.loadMore();
        scope.$apply(); //trigger loadMore promises
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push).not.toBeCalled();
      });

      it('sends an error', function() {
        expect(stubs.captureError).toBeCalled();
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        scope.$apply(); // trigger resetEntries
        stubs.then.callsArg(1);
        scope.paginator.page = 1;
        scope.loadMore();
        scope.$apply();
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push).not.toBeCalled();
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
      });
    });
  });

  describe('status class', function () {
    beforeEach(function() {
      createController();
    });

    it('is updated', function () {
      var entry = makeEntry();
      stubs.published.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusClass(entry)).toBe('updated');
    });

    it('is published', function () {
      var entry = makeEntry();
      stubs.published.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusClass(entry)).toBe('published');
    });

    it('is archived', function () {
      var entry = makeEntry();
      stubs.published.returns(false);
      stubs.archived.returns(true);
      expect(scope.statusClass(entry)).toBe('archived');
    });

    it('is draft', function () {
      var entry = makeEntry();
      stubs.published.returns(false);
      stubs.archived.returns(false);
      expect(scope.statusClass(entry)).toBe('draft');
    });
  });

  describe('when tab becomes active', function () {
    beforeEach(function() {
      createController();
      scope.resetEntries = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      expect(scope.resetEntries).not.toBeCalled();
    }));

    it('resets entries', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.resetEntries).toBeCalled();
    }));
  });

});
