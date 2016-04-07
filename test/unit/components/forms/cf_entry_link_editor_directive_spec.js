'use strict';

describe('cfEntryLinkEditor Directive', function () {
  var element, scope;
  var compileElement;
  var searchField;
  var stubs;

  afterEach(function () {
    element = scope = compileElement = searchField = stubs = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can',
        'localizedField',
        'publishedEntryName',
        'publishedType',
        'entryTitle'
      ]);

      $provide.stubFilter('fileTypeFilter');
      $provide.stubFilter('fileExtensionFilter');

      $provide.removeDirectives('cfLinkEditorSearch');

      $provide.removeControllers('LinkEditorController', 'EntityStatusController');
    });

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();
      scope.isDisabled = sinon.stub().returns(false);
      scope.fieldData = { value: {
        sys: {id: 123}
      }};

      scope.field = {
        items: {}
      };

      scope.locale = {
        code: 'en-US',
        internal_code: 'en-US'
      };

      stubs.publishedType.returns({
        getName: stubs.publishedEntryName
      });
      scope.spaceContext = {
        space: {
          getEntries: sinon.stub()
        },
        localizedField: stubs.localizedField,
        publishedTypeForEntry: stubs.publishedType,
        entryTitle: stubs.entryTitle
      };

      compileElement = function (extra) {
        element = $compile('<div cf-entry-link-editor cf-link-editor="Entry" '+
                           'ng-model="fieldData.value" '+
                           extra+
                           '></div>')(scope);
        scope.$digest();
        searchField = element.find('.l-search-w-autocomplete');
      };
    });
  });

  describe('model controller gets updated with multiple links', function () {
    beforeEach(function () {
      scope.fieldData = { value: [
        { sys: {id: 123} }
      ]};

      compileElement('link-multiple="true"');
      scope.fieldData = { value: [
        { sys: {id: 456} },
        { sys: {id: 789} }
      ]};
      scope.$digest();
    });

    it('first link is updated', function () {
      expect(scope.links[0].sys.id).toBe(456);
    });

    it('second link is updated', function () {
      expect(scope.links[1].sys.id).toBe(789);
    });
  });


  describe('updating the model manually', function () {
    beforeEach(function () {
      scope.linkSingle = true;
      compileElement();
      scope.links = [{ sys: {id: 456} }];
      scope.updateModel();
    });

    it('updates the fieldData', function () {
      expect(scope.fieldData.value).toEqual({ sys: {id: 456} });
    });
  });


  describe('for entry links', function () {
    beforeEach(function () {
      scope.otDoc = {state: {editable: true}};
      scope.linkedEntities = [];
      scope.entities = [];
      compileElement();
    });

    it('does not show links list', function () {
      expect(element.find('.linked-entities')).toBeNgHidden();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('[cf-link-editor-search] .link-editor__controls')).not.toBeNgHidden();
    });

    describe('has multiple links with no array field', function () {
      var linkTitleSpy;
      beforeEach(function () {
        scope.field.type = 'Link';
        var publishStub = sinon.stub();
        publishStub.returns(true);
        scope.linkedEntities = [
          {data: {}, getId: sinon.stub() },
          {data: {}, getId: sinon.stub(), canPublish: publishStub},
          {isMissing: true, getId: sinon.stub() }
        ];
        scope.linkedEntities[0].getId.returns('entity0');
        scope.linkedEntities[1].getId.returns('entity1');
        scope.spaceContext.entryTitle.withArgs(scope.linkedEntities[0], 'en-US').returns('entity title 1');
        scope.spaceContext.entryTitle.withArgs(scope.linkedEntities[1], 'en-US').returns('entity title 2');
        linkTitleSpy = sinon.spy(scope.entryLinkController, 'linkTitle');
        scope.$digest();
      });

      it('shows links list', function () {
        expect(element.find('.linked-entities')).not.toBeNgHidden();
      });

      it('drag-file is shown because there is multiple links', function () {
        expect(element.find('[cf-drag-handle]')).not.toBeNgHidden();
      });

      it('cf-file-info is not shown', function () {
        expect(element.find('.cf-file-info').get(0)).toBeUndefined();
      });

      it('linked-entities__info is shown', function () {
        expect(element.find('.linked-entities__info').get(0)).toBeDefined();
      });

      it('link with title is shown for 1st entity', function () {
        expect(element.find('.linked-entities__info a').eq(0)).not.toBeNgHidden();
      });

      it('link with title for 1st entity has supplied title', function () {
        expect(element.find('.linked-entities__info a').eq(0).html()).toMatch('entity title 1');
      });

      it('link with title is shown for 2nd entity', function () {
        expect(element.find('.linked-entities__info a').eq(1)).not.toBeNgHidden();
      });

      it('link with title for 2nd entity has supplied title', function () {
        expect(element.find('.linked-entities__info a').eq(1).html()).toMatch('entity title 2');
      });

      it('link with title is not shown for 3rd entity', function () {
        expect(element.find('.linked-entities__info a').eq(2)).toBeNgHidden();
      });

      it('span with title is not shown for 1st entity', function () {
        expect(element.find('.linked-entities__info span').eq(0)).toBeNgHidden();
      });

      it('span with title is not shown for 2nd entity', function () {
        expect(element.find('.linked-entities__info span').eq(1)).toBeNgHidden();
      });

      it('span with title is shown for 3rd entity', function () {
        expect(element.find('.linked-entities__info span').eq(2)).not.toBeNgHidden();
      });

      it('span with title for 3rd entity has supplied title', function () {
        var html = element.find('.linked-entities__info span').eq(2).html();
        expect(html.indexOf('Entity is missing')).toBe(0);
        expect(html.indexOf('inaccessible') > -1).toBe(true);
      });

      it('linkTitle is called for 1st entity', function() {
        sinon.assert.calledWith(linkTitleSpy, scope.linkedEntities[0]);
      });

      it('linkTitle is called for 2nd entity', function() {
        sinon.assert.calledWith(linkTitleSpy, scope.linkedEntities[1]);
      });

      it('linkTitle is called for 3rd entity', function() {
        sinon.assert.calledWith(linkTitleSpy, scope.linkedEntities[2]);
      });

    });

  });

});
