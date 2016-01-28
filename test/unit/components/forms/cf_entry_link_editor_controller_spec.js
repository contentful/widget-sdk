'use strict';

describe('EntryLinkEditorController', function () {
  var linkEditorCtrl, createController;
  var scope, entry, $q, stubs, attrs;
  var shareJSMock, entityCacheMock;

  function validationParser(arg) {
    return arg;
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'getEntries',
        'save',
        'getAll',
        'entryTitle',
        'publishedTypeForEntry',
        'localizedField'
      ]);

      shareJSMock = {
        peek: sinon.stub(),
        mkpathAndSetValue: sinon.stub()
      };

      entityCacheMock = sinon.stub();
      entityCacheMock.returns({
        save: stubs.save,
        getAll: stubs.getAll
      });

      $provide.value('ShareJS', shareJSMock);
      $provide.value('EntityCache', entityCacheMock);
      $provide.constant('validation', {
        Validation: {
          parse: validationParser
        }
      });
    });

    inject(function ($rootScope, $controller, _$q_, cfStub) {
      $q = _$q_;
      scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('content_type1');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      entry = cfStub.entry(space, 'entry1', 'content_type1');
      scope.spaceContext.space.getEntries = stubs.getEntries;
      scope.spaceContext.entryTitle = stubs.entryTitle;
      scope.spaceContext.localizedField = stubs.localizedField;
      scope.spaceContext.publishedTypeForEntry = stubs.publishedTypeForEntry;

      scope.locale = {
        code: 'en-US',
        internal_code: 'en-US'
      };

      scope.field = {
        type: 'Link',
        validations: []
      };

      attrs = {
        ngModel: 'fieldData.value',
        linkMultiple: false
      };

      scope.isDisabled = sinon.stub().returns(false);

      createController = function () {
        linkEditorCtrl = $controller('EntryLinkEditorController', {
          $scope: scope,
          $attrs: attrs
        });
        scope.$digest();
      };

    });
  });

  describe('initial state', function () {
    beforeEach(function () {
      createController();
    });

    it('initializes link content types', function() {
      expect(scope.linkContentTypes).toBeFalsy();
    });
  });

  describe('with field validations', function () {
    beforeEach(function () {
      scope.field.validations = [
        {name: 'linkContentType', contentTypeId: ['content_type1']}
      ];
      createController();
    });

    it('sets linkContentType to type defined in validation', function () {
      expect(scope.linkContentTypes[0].getId()).toBe('content_type1');
    });
  });

  describe('link title', function() {
    var entity, title;
    beforeEach(function() {
      entity = {
        getId: sinon.stub()
      };
      createController();
    });

    describe('for existing entity', function() {
      beforeEach(function() {
        entity.getId.returns('123');
        stubs.entryTitle.returns('entry title');
        title = linkEditorCtrl.linkTitle(entity);
      });

      it('gets existing title', function() {
        sinon.assert.calledWith(stubs.entryTitle, entity, 'en-US');
      });

      it('returns existing title', function() {
        expect(title).toBe('entry title');
      });
    });

    describe('for non existing entity', function() {
      beforeEach(function() {
        entity.isMissing = true;
        title = linkEditorCtrl.linkTitle(entity);
      });

      it('does not get existing title', function() {
        sinon.assert.notCalled(stubs.entryTitle);
      });

      it('returns missing title', function() {
        expect(title.indexOf('Entity is missing')).toBe(0);
        expect(title.indexOf('inaccessible') > -1).toBe(true);
      });
    });
  });

  describe('link description', function() {
    var entity, description;
    beforeEach(function() {
      entity = {
        getId: sinon.stub()
      };
      createController();
    });

    describe('for existing entity', function() {
      beforeEach(function() {
        entity.getId.returns('123');
      });

      describe('if an eligible description field is found', function() {
        beforeEach(function() {
          stubs.publishedTypeForEntry.returns({
            data: {
              displayField: 'displayme',
              fields: [
                {id: 'displayme', type: 'Text'},
                {id: 'description', type: 'Text'},
              ]
            }
          });
          stubs.localizedField.returns('description text');
          description = linkEditorCtrl.linkDescription(entity);
        });

        it('gets existing description', function() {
          sinon.assert.calledWith(stubs.localizedField, entity, 'data.fields.description');
        });

        it('returns existing description', function() {
          expect(description).toBe('description text');
        });
      });

      describe('if no eligible description field is found', function() {
        beforeEach(function() {
          stubs.publishedTypeForEntry.returns({
            data: {
              displayField: 'displayme',
              fields: [
                {id: 'displayme', type: 'Text'},
              ]
            }
          });
          description = linkEditorCtrl.linkDescription(entity);
        });

        it('does not get existing description', function() {
          sinon.assert.notCalled(stubs.localizedField);
        });

        it('returns missing description', function() {
          expect(description).toBeUndefined();
        });
      });
    });

    describe('for non existing entity', function() {
      beforeEach(function() {
        entity.isMissing = true;
        description = linkEditorCtrl.linkDescription(entity);
      });

      it('does not get existing description', function() {
        sinon.assert.notCalled(stubs.localizedField);
      });

      it('returns missing description', function() {
        expect(description).toBeUndefined();
      });
    });
  });

});
