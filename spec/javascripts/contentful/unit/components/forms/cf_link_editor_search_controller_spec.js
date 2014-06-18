'use strict';

describe('cfLinkEditorSearch Controller', function () {
  var cfLinkEditorSearchCtrl;
  var scope, stubs;
  var space;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'serverError',
        'loadCallback',
        'then'
      ]);
      $provide.value('notification', {
        serverError: stubs.serverError
      });
    });
    inject(function ($rootScope, $controller, cfStub, PromisedLoader) {
      scope = $rootScope.$new();

      space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('content_type1');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      stubs.loadCallback = sinon.stub(PromisedLoader.prototype, 'loadCallback');
      stubs.loadCallback.returns({
        then: stubs.then
      });

      cfLinkEditorSearchCtrl = $controller('cfLinkEditorSearchCtrl', { $scope: scope });
    });
  });

  afterEach(inject(function ($log) {
    stubs.loadCallback.restore();
    $log.assertEmpty();
  }));

  it('if searchTerm changes, reset entities', function() {
    scope.searchTerm = null;
    scope.$digest();
    scope.resetEntities = sinon.stub();
    scope.searchTerm = 'term';
    scope.$digest();
    expect(scope.resetEntities).toBeCalled();
  });

  it('when autocomplete result is selected sets the selected entity on the scope', inject(function ($rootScope) {
    var result = {result: true};
    $rootScope.$broadcast('autocompleteResultSelected', 0, result);
    expect(scope.selectedEntity).toBe(result);
  }));

  describe('when autocomplete result is picked', function() {
    beforeEach(inject(function($rootScope) {
      var result = {result: true};
      scope.addLink = sinon.stub();
      $rootScope.$broadcast('autocompleteResultPicked', 0, result);
    }));

    it('calls the addLink method', function() {
      expect(scope.addLink).toBeCalled();
    });
  });

  describe('on refresh search event', function() {
    var childScope;
    beforeEach(function() {
      scope.resetEntities = sinon.stub();
      childScope = scope.$new();
    });

    it('refreshes search if button was clicked', function() {
      childScope.$emit('refreshSearch', {trigger: 'button'});
      expect(scope.resetEntities).toBeCalled();
    });

    it('does not refresh search if other trigger was used', function() {
      childScope.$emit('refreshSearch', {trigger: ''});
      expect(scope.resetEntities).not.toBeCalled();
    });
  });

  describe('the pick method', function() {
    var entity;
    beforeEach(function() {
      entity = {entity: true};
      scope.addLink = sinon.stub();
      scope.addLink.callsArg(1);
      scope.pick(entity);
    });

    it('calls add link with the given entity', function () {
      expect(scope.addLink).toBeCalledWith(entity);
    });

    it('sets search term to undefined', function() {
      expect(scope.searchTerm).toBeUndefined();
    });
  });


  function makeAddMethodTests(entityType, createEntityArgIndex) {

    describe('adding a new '+entityType, function() {
      var uppercasedEntityType = entityType.charAt(0).toUpperCase() + entityType.substr(1);
      var contentType, entity;
      var createEntityStub, entityEditorStub;
      beforeEach(inject(function(cfStub) {
        scope.addLink = sinon.stub();
        entityEditorStub = sinon.stub();
        scope.navigator = {};
        scope.navigator[entityType+'Editor'] = entityEditorStub;
        entityEditorStub.returns({goTo: sinon.stub()});
        createEntityStub = sinon.stub(scope.spaceContext.space, 'create'+uppercasedEntityType);
        contentType = cfStub.contentType(space, 'ct1', 'Content Type 1');
        entity = cfStub[entityType](space, 'entity1', entityType == 'entry' ? 'ct1' : []);
      }));

      describe('successfully', function() {
        beforeEach(function() {
          createEntityStub.callsArgWith(createEntityArgIndex, null, entity);
          scope.addLink.callsArgWith(1, null);
          scope['addNew'+uppercasedEntityType](contentType);
        });

        it('create '+entityType+' called', function() {
          expect(createEntityStub).toBeCalled();
        });

        if(entityType == 'entry') {
          it('create '+ entityType +' called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink called', function() {
          expect(scope.addLink).toBeCalled();
        });

        it('addLink called with '+ entityType, function() {
          expect(scope.addLink.args[0][0]).toBe(entity);
        });

        it('server error not called', function() {
          expect(stubs.serverError).not.toBeCalled();
        });

        it(entityType +' editor called', function() {
          expect(entityEditorStub).toBeCalled();
        });
      });

      describe('fails on create'+uppercasedEntityType, function() {
        beforeEach(function() {
          createEntityStub.callsArgWith(createEntityArgIndex, {});
          scope.addLink.callsArgWith(1, null);
          scope['addNew'+uppercasedEntityType](contentType);
        });

        it('create '+ entityType +' called', function() {
          expect(createEntityStub).toBeCalled();
        });

        if(entityType == 'entry') {
          it('create entry called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink not called', function() {
          expect(scope.addLink).not.toBeCalled();
        });

        it('server error called', function() {
          expect(stubs.serverError).toBeCalled();
        });

        it(entityType +' editor not called', function() {
          expect(entityEditorStub).not.toBeCalled();
        });
      });

      describe('fails on linking '+ entityType, function() {
        var deleteStub;
        beforeEach(function() {
          createEntityStub.callsArgWith(createEntityArgIndex, null, entity);
          scope.addLink.callsArgWithAsync(1, {});
          deleteStub = sinon.stub();
          deleteStub.callsArgWith(0, null);
          entity['delete'] = deleteStub;
          scope['addNew'+uppercasedEntityType](contentType);
        });

        it('create '+ entityType +' called', function() {
          expect(createEntityStub).toBeCalled();
        });

        if(entityType == 'entry') {
          it('create entry called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink called', function() {
          expect(scope.addLink).toBeCalled();
        });

        it('addLink called with '+ entityType, function() {
          expect(scope.addLink.args[0][0]).toBe(entity);
        });

        it('server error called', function(done) {
          _.defer(function () {
            expect(stubs.serverError).toBeCalled();
            done();
          });
        });

        it(entityType +' editor not called', function() {
          expect(entityEditorStub).not.toBeCalledOnce();
        });
      });

      describe('fails on deleting failed linked '+ entityType, function() {
        var deleteStub;
        beforeEach(function() {
          createEntityStub.callsArgWith(createEntityArgIndex, null, entity);
          scope.addLink.callsArgWithAsync(1, {});
          deleteStub = sinon.stub();
          deleteStub.callsArgWithAsync(0, {});
          entity['delete'] = deleteStub;
          scope['addNew'+uppercasedEntityType](contentType);
        });

        it('create '+ entityType +' called', function() {
          expect(createEntityStub).toBeCalled();
        });

        if(entityType == 'entry') {
          it('create '+ entityType +' called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink called', function() {
          expect(scope.addLink).toBeCalled();
        });

        it('addLink called with '+ entityType, function() {
          expect(scope.addLink.args[0][0]).toBe(entity);
        });

        it('server error called', function(done) {
          _.defer(function () {
            _.defer(function () {
              expect(stubs.serverError).toBeCalledTwice();
              done();
            });
          });
        });

        it(entityType +' editor not called', function() {
          expect(entityEditorStub).not.toBeCalled();
        });
      });
    });

  }

  makeAddMethodTests('entry', 2);
  makeAddMethodTests('asset', 1);

  it('search is empty if null', function() {
    scope.searchTerm = undefined;
    expect(scope.searchIsEmpty()).toBeTruthy();
  });

  it('search is empty if undefined', function() {
    scope.searchTerm = undefined;
    expect(scope.searchIsEmpty()).toBeTruthy();
  });

  it('search is not empty if empty string', function() {
    scope.searchTerm = '';
    expect(scope.searchIsEmpty()).toBeFalsy();
  });

  it('search is not empty if string', function() {
    scope.searchTerm = 'term';
    expect(scope.searchIsEmpty()).toBeFalsy();
  });

  describe('resetting entities', function() {
    describe('with no search term', function() {
      beforeEach(function() {
        scope.searchTerm = undefined;
        scope.resetEntities();
      });

      it('resets paginator page', function() {
        expect(scope.paginator.page).toBe(0);
      });

      it('resets entities', function() {
        expect(scope.entities).toEqual([]);
      });

      it('resets selected entry', function() {
        expect(scope.selectedEntity).toBeNull();
      });
    });

    describe('with a search term', function() {
      beforeEach(function() {
        scope.searchTerm = 'term';
        scope.loadEntities = sinon.stub();
        scope.resetEntities();
      });

      it('loads entities', function() {
        expect(scope.loadEntities).toBeCalled();
      });
    });

    describe('with an empty search term', function() {
      beforeEach(function() {
        scope.searchTerm = '';
        scope.loadEntities = sinon.stub();
        scope.resetEntities();
      });

      it('loads entities', function() {
        expect(scope.loadEntities).toBeCalled();
      });
    });

  });


  describe('loading entities', function() {
    var entities, entity;
    beforeEach(function() {
      entity = {entity: true};
      entities = {
        0: entity,
        total: 30
      };
      stubs.then.callsArgWith(0, entities);

      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
    });

    it('loads entities', function() {
      scope.loadEntities();
      expect(stubs.loadCallback).toBeCalled();
    });

    it('sets entities num on the paginator', function() {
      scope.loadEntities();
      expect(scope.paginator.numEntries).toEqual(30);
    });

    it('sets entities on scope', function() {
      scope.loadEntities();
      expect(scope.entities).toBe(entities);
    });

    it('sets first entity as selected on scope', function() {
      scope.loadEntities();
      expect(scope.selectedEntity).toBe(entity);
    });


    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.loadEntities();
        expect(stubs.loadCallback.args[0][2].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.loadEntities();
        expect(stubs.loadCallback.args[0][2].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.loadEntities();
        expect(stubs.loadCallback.args[0][2].skip).toBeTruthy();
      });

      it('for linked content type', function() {
        var idStub = sinon.stub();
        idStub.returns(123);
        scope.linkContentType = {
          getId: idStub
        };
        scope.loadEntities();
        expect(stubs.loadCallback.args[0][2]['sys.contentType.sys.id']).toBe(123);
      });

      it('for mimetype group', function() {
        scope.linkMimetypeGroup = 'files';
        scope.loadEntities();
        expect(stubs.loadCallback.args[0][2]['mimetype_group']).toBe('files');
      });

      it('for search term', function() {
        scope.searchTerm = 'term';
        scope.loadEntities();
        expect(stubs.loadCallback.args[0][2].query).toBe('term');
      });
    });
  });



  describe('loadMore', function () {
    var entities;
    beforeEach(function() {
      entities = {
        total: 30
      };

      scope.entities = {
        push: {
          apply: sinon.stub()
        },
        length: 60
      };

      scope.selection = {
        setBaseSize: sinon.stub()
      };

      scope.paginator.atLast = sinon.stub();
      scope.paginator.atLast.returns(false);
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      scope.loadMore();
      expect(stubs.loadCallback).not.toBeCalled();
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      scope.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.loadMore();
      expect(stubs.loadCallback.args[0][2]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      expect(stubs.loadCallback).toBeCalled();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        stubs.then.callsArgWith(0, entities);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('sets num entities', function() {
        expect(scope.paginator.numEntries).toEqual(30);
      });

      it('appends entities to scope', function () {
        expect(scope.entities.push.apply.args[0][1]).toEqual(entities);
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        stubs.then.callsArg(1);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('appends entities to scope', function () {
        expect(scope.entities.push).not.toBeCalled();
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
      });
    });
  });



});
