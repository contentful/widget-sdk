'use strict';

describe('cfLinkEditorSearch Controller', function () {
  var cfLinkEditorSearchCtrl, createController;
  var scope, stubs, attrs, space;
  var $q, notification, logger;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'loadPromise'
      ]);
    });
    inject(function ($rootScope, $controller, cfStub, PromisedLoader, $injector) {
      $q = $injector.get('$q');
      notification = $injector.get('notification');
      logger = $injector.get('logger');
      scope = $rootScope.$new();

      space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('content_type1');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);


      stubs.loadPromise = sinon.stub(PromisedLoader.prototype, 'loadPromise').returns($q.defer().promise);

      attrs = {
        addEntity: 'addLink(entity)',
        entityType: 'Entry',
        entityContentTypes: 'linkContentTypes',
        entityMimeTypeGroup: 'linkMimetypeGroup'
      };

      createController = function() {
        cfLinkEditorSearchCtrl = $controller('cfLinkEditorSearchController', { $scope: scope, $attrs: attrs });
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    stubs.loadPromise.restore();
  });

  describe('creates a controller', function() {
    beforeEach(function() {
      createController();
    });

    it('when autocomplete result is selected sets the selected entity on the scope', inject(function ($rootScope) {
      var result = {result: true};
      $rootScope.$broadcast('autocompleteResultSelected', 0, result);
      expect(scope.selectedEntity).toBe(result);
    }));

    describe('when autocomplete result is picked', function() {
      beforeEach(inject(function($rootScope) {
        spyOn(cfLinkEditorSearchCtrl, 'clearSearch');
        var result = {result: true};
        scope.addLink = sinon.stub().returns($q.when());
        $rootScope.$broadcast('autocompleteResultPicked', 0, result);
      }));

      it('calls the addLink method', function() {
        scope.$apply();
        sinon.assert.called(scope.addLink);
      });

      it('clears the search', function () {
        scope.$apply();
        expect(cfLinkEditorSearchCtrl.clearSearch).toHaveBeenCalled();
      });
    });

    it('should clear the search when autocompleteResults are canceled', function () {
      sinon.stub(cfLinkEditorSearchCtrl, 'clearSearch');
      scope.$broadcast('autocompleteResultsCancel');
      sinon.assert.called(cfLinkEditorSearchCtrl.clearSearch);
    });

    it('should prevent the default action on the cancel event when search is already clear', function () {
      var event;
      cfLinkEditorSearchCtrl._searchResultsVisible = true;
      event = scope.$broadcast('autocompleteResultsCancel');
      expect(event.defaultPrevented).toBe(false);

      cfLinkEditorSearchCtrl._searchResultsVisible = false;
      event = scope.$broadcast('autocompleteResultsCancel');
      expect(event.defaultPrevented).toBe(true);
    });

    it('should emit a searchResultsHidden event when hiding the search results', function () {
      spyOn(scope, '$emit');
      cfLinkEditorSearchCtrl.hideSearchResults();
      expect(scope.$emit).toHaveBeenCalledWith('searchResultsHidden');
    });

    it('should clear the search when the tokenized search displays its dropdown', function () {
      spyOn(cfLinkEditorSearchCtrl, 'clearSearch');
      scope.$emit('tokenizedSearchShowAutocompletions', true);
      expect(cfLinkEditorSearchCtrl.clearSearch).toHaveBeenCalled();
    });

    it('should clear the search when the tokenized search changes its input', function () {
      spyOn(cfLinkEditorSearchCtrl, 'clearSearch');
      scope.$emit('tokenizedSearchInputChanged');
      expect(cfLinkEditorSearchCtrl.clearSearch).toHaveBeenCalled();
    });

    describe('on searchSubmitted event', function() {
      var childScope;
      beforeEach(function() {
        cfLinkEditorSearchCtrl._resetEntities = sinon.stub();
        childScope = scope.$new();
      });

      it('refreshes search if button was clicked', function() {
        childScope.$emit('searchSubmitted');
        sinon.assert.called(cfLinkEditorSearchCtrl._resetEntities);
      });
    });

    describe('the pick method', function() {
      var entity;
      beforeEach(function() {
        spyOn(cfLinkEditorSearchCtrl, 'clearSearch');
        entity = {entity: true};
        scope.addLink = sinon.stub().returns($q.when());
        scope.pick(entity);
        scope.$apply();
      });

      it('calls add link with the given entity', function () {
        sinon.assert.calledWith(scope.addLink, entity);
      });

      it('clears the search', function () {
        expect(cfLinkEditorSearchCtrl.clearSearch).toHaveBeenCalled();
      });

    });

  });

  function makeAddMethodTests(entityType) {

    describe('adding a new '+entityType, function() {
      var uppercasedEntityType = entityType.charAt(0).toUpperCase() + entityType.substr(1),
          entityTypeStateName = entityType === 'entry' ? 'spaces.detail.entries' : 'spaces.detail.assets';

      var contentType, entity, $state;
      var createEntityStub;
      beforeEach(inject(function(cfStub, $injector) {
        createController();
        scope.addLink = sinon.stub();
        $state = $injector.get('$state');
        $state.go = sinon.stub();
        createEntityStub = sinon.stub(scope.spaceContext.space, 'create'+uppercasedEntityType);
        contentType = cfStub.contentType(space, 'ct1', 'Content Type 1');
        entity = cfStub[entityType](space, 'entity1', entityType == 'entry' ? 'ct1' : []);
      }));

      describe('successfully', function() {
        beforeEach(function() {
          scope.addLink.returns($q.when(null));
          createEntityStub.returns($q.when(entity));
          scope['addNew'+uppercasedEntityType](contentType);
          scope.$apply();
        });

        it('create '+entityType+' called', function() {
          sinon.assert.called(createEntityStub);
        });

        if(entityType == 'entry') {
          it('create '+ entityType +' called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink called', function() {
          sinon.assert.called(scope.addLink);
        });

        it('addLink called with '+ entityType, function() {
          expect(scope.addLink.args[0][0]).toBe(entity);
        });

        it('server error not called', function() {
          sinon.assert.notCalled(notification.error);
          sinon.assert.notCalled(logger.logServerWarn);
        });

        it(entityType +' editor called', function() {
          var stateParams = {};
          stateParams[entityType + 'Id'] = entity.getId();
          stateParams.addToContext = true;
          sinon.assert.called($state.go, entityTypeStateName + '.detail', stateParams);
        });
      });

      describe('fails on create'+uppercasedEntityType, function() {
        beforeEach(function() {
          scope.addLink.returns($q.when(null));
          createEntityStub.returns($q.reject({}));
          scope['addNew'+uppercasedEntityType](contentType);
          scope.$apply();
        });

        it('create '+ entityType +' called', function() {
          sinon.assert.called(createEntityStub);
        });

        if(entityType == 'entry') {
          it('create entry called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink not called', function() {
          sinon.assert.notCalled(scope.addLink);
        });

        it('server error called', function() {
          sinon.assert.called(notification.error);
          sinon.assert.called(logger.logServerWarn);
        });

        it(entityType +' editor not called', function() {
          sinon.assert.notCalled($state.go);
        });
      });

      describe('fails on linking '+ entityType, function() {
        beforeEach(function() {
          scope.addLink.returns($q.reject({}));
          sinon.stub(entity, 'delete');
          createEntityStub.returns($q.when(entity));
          entity.delete.returns($q.when());
          scope['addNew'+uppercasedEntityType](contentType);
          scope.$apply();
        });

        it('create '+ entityType +' called', function() {
          sinon.assert.called(createEntityStub);
        });

        if(entityType == 'entry') {
          it('create entry called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink called', function() {
          sinon.assert.called(scope.addLink);
        });

        it('addLink called with '+ entityType, function() {
          expect(scope.addLink.args[0][0]).toBe(entity);
        });

        it('server error called', function(done) {
          _.defer(function () {
            sinon.assert.called(notification.error);
            sinon.assert.called(logger.logServerWarn);
            done();
          });
        });

        it(entityType +' editor not called', function() {
          sinon.assert.notCalled($state.go);
        });
      });

      describe('fails on deleting failed linked '+ entityType, function() {
        beforeEach(function() {
          scope.addLink.returns($q.reject({}));
          sinon.stub(entity, 'delete');
          createEntityStub.returns($q.when(entity));
          scope['addNew'+uppercasedEntityType](contentType);
          entity.delete.returns($q.reject({}));
          scope.$apply();
        });

        it('create '+ entityType +' called', function() {
          sinon.assert.called(createEntityStub);
        });

        if(entityType == 'entry') {
          it('create '+ entityType +' called with content type id', function() {
            expect(createEntityStub.args[0][0]).toEqual('ct1');
          });
        }

        it('addLink called', function() {
          sinon.assert.called(scope.addLink);
        });

        it('addLink called with '+ entityType, function() {
          expect(scope.addLink.args[0][0]).toBe(entity);
        });

        it('server error called', function(done) {
          _.defer(function () {
            _.defer(function () {
              sinon.assert.calledTwice(notification.error);
              sinon.assert.calledTwice(logger.logServerWarn);
              done();
            });
          });
        });

        it(entityType +' editor not called', function() {
          sinon.assert.notCalled($state.go);
        });
      });
    });

  }

  makeAddMethodTests('entry');
  makeAddMethodTests('asset');

  describe('_loadEntities', function () {
    it('should still be tested');
  });

  describe('_buildQuery', function () {
    var query, getterMethod;

    function performQuery() {
      createController();
      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
      scope.$apply();
      stubs.loadPromise.restore();
      cfLinkEditorSearchCtrl._loadEntities();
      sinon.spy(scope.spaceContext.space, getterMethod);
      scope.$apply();
      query = scope.spaceContext.space[getterMethod].args[0][0];
    }

    beforeEach(function () {
      scope.entityType = 'Entry';
      getterMethod = 'getEntries';
    });

    it('with a defined order', function() {
      performQuery();
      expect(query.order).toEqual('-sys.updatedAt');
    });

    it('with a defined limit', function() {
      performQuery();
      expect(query.limit).toEqual(3);
    });

    it('with a defined skip param', function() {
      performQuery();
      expect(query.skip).toBeTruthy();
    });

    it('for linked content type', function() {
      attrs.entityType = 'Entry';
      scope.linkContentTypes = [{
        getName: sinon.stub().returns('123 Type'),
        getId:   sinon.stub().returns(123)
      }];
      scope.$apply();
      performQuery();
      expect(query.content_type).toBe(123);
    });

    it('for mimetype group', function() {
      getterMethod = 'getAssets';
      attrs.entityType = 'Asset';
      scope.linkMimetypeGroup = ['attachment', 'pdfdocument'];
      scope.$apply();
      performQuery();
      expect(query['fields.file.contentType[in]'])
      .toBe('application/octet-stream,application/pdf');
    });

    it('for search term', function() {
      scope.searchTerm = 'term';
      performQuery();
      expect(query.query).toBe('term');
    });
  });

  describe('resetting entities', function() {
    var entities, entity;
    beforeEach(function() {
      createController();
      entity = {entity: true};
      entities = {
        0: entity,
        total: 30
      };
      sinon.stub(cfLinkEditorSearchCtrl, '_loadEntities').returns($q.when(entities));
      sinon.spy(cfLinkEditorSearchCtrl, 'clearSearch');
      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
      scope.$apply();
      cfLinkEditorSearchCtrl._resetEntities();
      scope.$apply();
    });

    it('clear the searchResult', function () {
      sinon.assert.called(cfLinkEditorSearchCtrl.clearSearch);
    });

    it('sets entities num on the paginator', function() {
      expect(scope.paginator.numEntries).toEqual(30);
    });

    it('sets entities on scope', function() {
      expect(scope.entities).toBe(entities);
    });

    it('sets first entity as selected on scope', function() {
      expect(scope.selectedEntity).toBe(entity);
    });

  });


  describe('loadMore', function () {
    var entities;
    beforeEach(function() {
      createController();
      scope.$apply();
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

      sinon.stub(cfLinkEditorSearchCtrl, '_loadEntities').returns($q.when(entities));
      scope.paginator.atLast = sinon.stub();
      scope.paginator.atLast.returns(false);
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      cfLinkEditorSearchCtrl.loadMore();
      sinon.assert.notCalled(stubs.loadPromise);
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      cfLinkEditorSearchCtrl.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      cfLinkEditorSearchCtrl.loadMore();
      sinon.assert.called(cfLinkEditorSearchCtrl._loadEntities);
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        scope.paginator.page = 1;
        cfLinkEditorSearchCtrl.loadMore();
        scope.$apply();
      });

      it('sets num entities', function() {
        expect(scope.paginator.numEntries).toEqual(30);
      });

      it('appends entities to scope', function () {
        expect(scope.entities.push.apply.args[0][1]).toEqual(entities);
      });
    });

    describe('on failed load response', function() {
      beforeEach(function() {
        cfLinkEditorSearchCtrl._loadEntities.returns($q.reject());
        scope.paginator.page = 1;
        scope.entities.push = sinon.stub();
        cfLinkEditorSearchCtrl.loadMore();
        scope.$apply();
      });

      it('does not append entities', function () {
        sinon.assert.notCalled(scope.entities.push);
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
      });
    });
  });

});
