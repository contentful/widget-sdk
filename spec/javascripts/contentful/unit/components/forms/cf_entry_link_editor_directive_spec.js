'use strict';

describe('cfEntryLinkEditor Directive', function () {
  var element, scope;
  var compileElement;
  var searchField;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can',
        'localizedField',
        'publishedEntryName',
        'publishedType',
        'entryTitle'
      ]);

      $provide.value('fileTypeFilter', function () {return '';});
      $provide.value('fileExtensionFilter', function () {return '';});

      $provide.removeDirectives('cfLinkEditorSearch');
    });

    inject(function ($compile, $rootScope, cfEntryLinkEditorDirective) {
      cfEntryLinkEditorDirective[0].controller = angular.noop;
      scope = $rootScope.$new();
      scope.can = stubs.can;
      scope.fieldData = { value: {
        sys: {id: 123}
      }};

      scope.field = {
        items: {}
      };

      scope.locale = {
        code: 'en-US'
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
        searchField = element.find('.search-with-results');
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


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
      scope.otEditable = true;
      scope.linkedEntities = [];
      scope.entities = [];
      compileElement();
    });

    it('does not show links list', function () {
      expect(element.find('.links')).toBeNgHidden();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.cf-link-editor-search .controls')).not.toBeNgHidden();
    });

    describe('has multiple links with no array field', function () {
      var descriptionStub;
      beforeEach(function () {
        scope.field.type = 'Link';
        var publishStub = sinon.stub();
        publishStub.returns(true);
        scope.linkedEntities = [
          {data: '1'},
          {data: '2', canPublish: publishStub},
          {}
        ];
        descriptionStub = sinon.stub();
        scope.linkDescription = descriptionStub;
        scope.$digest();
      });

      it('shows links list', function () {
        expect(element.find('.links')).not.toBeNgHidden();
      });

      it('drag-file is shown because there is multiple links', function () {
        expect(element.find('.drag-handle')).not.toBeNgHidden();
      });

      it('cf-file-info is not shown', function () {
        expect(element.find('.cf-file-info').get(0)).toBeUndefined();
      });

      it('entry-info is shown', function () {
        expect(element.find('.entry-info').get(0)).toBeDefined();
      });

      it('link with description is shown for 1st entity', function () {
        expect(element.find('.entry-info a').eq(0)).not.toBeNgHidden();
      });

      it('link with description is shown for 2nd entity', function () {
        expect(element.find('.entry-info a').eq(1)).not.toBeNgHidden();
      });

      it('link with description is not shown for 3rd entity', function () {
        expect(element.find('.entry-info a').eq(2)).toBeNgHidden();
      });

      it('span with description is not shown for 1st entity', function () {
        expect(element.find('.entry-info span').eq(0)).toBeNgHidden();
      });

      it('span with description is not shown for 2nd entity', function () {
        expect(element.find('.entry-info span').eq(1)).toBeNgHidden();
      });

      it('span with description is shown for 3rd entity', function () {
        expect(element.find('.entry-info span').eq(2)).not.toBeNgHidden();
      });

      it('description method is called for first entity', function () {
        expect(descriptionStub).toBeCalledWith(scope.linkedEntities[0]);
      });

      it('description method is called for second entity', function () {
        expect(descriptionStub).toBeCalledWith(scope.linkedEntities[1]);
      });

      it('description method is called for third entity', function () {
        expect(descriptionStub).toBeCalledWith(scope.linkedEntities[2]);
      });

      it('first entity has no unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(0)).toBeNgHidden();
      });

      it('second entity has unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(1)).not.toBeNgHidden();
      });

      it('third entity has no unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(2)).toBeNgHidden();
      });

    });

  });

});
