'use strict';

describe('cfLinkEditorSearch Controller', function () {
  var cfLinkEditorSearchCtrl;
  var scope, stubs;
  var space;
  var $q;

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
    inject(function ($rootScope, $controller, cfStub, PromisedLoader, _$q_) {
      $q = _$q_;
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
      expect(scope.addLink).toBeCalled();
    });

    it('clears the search when linkSingle', function () {
      scope.linkSingle = true;
      scope.$apply();
      expect(cfLinkEditorSearchCtrl.clearSearch).toHaveBeenCalled();
    });

    it('clears the search when linkMultiple', function () {
      scope.linkSingle = false;
      scope.$apply();
      expect(cfLinkEditorSearchCtrl.clearSearch).not.toHaveBeenCalled();
    });
  });

  it('should clear the search when autocompleteResults are canceled', function () {
    sinon.stub(cfLinkEditorSearchCtrl, 'clearSearch');
    scope.$broadcast('autocompleteResultsCancel');
    expect(cfLinkEditorSearchCtrl.clearSearch).toBeCalled();
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
      expect(cfLinkEditorSearchCtrl._resetEntities).toBeCalled();
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
      expect(scope.addLink).toBeCalledWith(entity);
    });

    it('clears the search', function () {
      expect(cfLinkEditorSearchCtrl.clearSearch).toHaveBeenCalled();
    });

  });


  function makeAddMethodTests(entityType) {

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
          scope.addLink.returns($q.when(null));
          scope['addNew'+uppercasedEntityType](contentType);
          createEntityStub.yield(null, entity);
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
          scope.addLink.returns($q.when(null));
          scope['addNew'+uppercasedEntityType](contentType);
          createEntityStub.yield({});
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
        beforeEach(function() {
          scope.addLink.returns($q.reject({}));
          sinon.stub(entity, 'delete');
          scope['addNew'+uppercasedEntityType](contentType);
          createEntityStub.yield(null, entity);
          entity.delete.yield(null);
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
        beforeEach(function() {
          scope.addLink.returns($q.reject({}));
          sinon.stub(entity, 'delete');
          scope['addNew'+uppercasedEntityType](contentType);
          createEntityStub.yield(null, entity);
          entity.delete.yield({});
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

  makeAddMethodTests('entry');
  makeAddMethodTests('asset');

  describe('_loadEntities', function () {
    it('should still be tested');
  });
  describe('_buildQuery', function () {
    var query;

    function performQuery() {
      stubs.loadCallback.reset();
      cfLinkEditorSearchCtrl._loadEntities();
      scope.$apply();
      query = stubs.loadCallback.args[0][2];
    }

    beforeEach(function () {
      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
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
      scope.linkContentType = {
        getId: sinon.stub().returns(123)
      };
      performQuery();
      expect(query.content_type).toBe(123);
    });

    it('for mimetype group', function() {
      scope.linkMimetypeGroup = 'files';
      performQuery();
      expect(query['mimetype_group']).toBe('files');
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
      expect(cfLinkEditorSearchCtrl.clearSearch).toBeCalled();
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
      expect(stubs.loadCallback).not.toBeCalled();
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
      expect(cfLinkEditorSearchCtrl._loadEntities).toBeCalled();
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
        cfLinkEditorSearchCtrl.loadMore();
        scope.$apply();
      });

      it('does not append entities', function () {
        expect(scope.entities.push).not.toBeCalled();
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
      });
    });
  });



});
