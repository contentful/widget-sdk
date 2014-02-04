'use strict';

describe('The ContentType editor directive', function () {

  var container, scope;
  var compileElement;
  var canStub, reasonsStub;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();

    module('contentful/test', function ($provide, cfCanStubsProvider) {
      $provide.value('ShareJS', {
        connection: {},
        peek: sinon.stub(),
        mkpath: sinon.stub()
      });
      $provide.removeDirectives('otDocFor', 'otDocPresence', 'otSubdoc', 'otBindText', 'otPath', 'saveStatus', 'contentTypeFieldList');
      cfCanStubsProvider.setup(reasonsStub);
    });

    function ControllerMock(){}
    ControllerMock.prototype.canPublish = sinon.stub();

    inject(function ($rootScope, $compile, contentTypeEditorDirective) {
      contentTypeEditorDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();

      scope.can = canStub;
      scope.otEditable = true;

      compileElement = function () {
        container = $('<div class="content-type-editor"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  describe('when otEditable is false', function () {
    beforeEach(function () {
      canStub.withArgs('create', 'ContentType').returns(true);
      scope.otEditable = false;
      compileElement();
    });

    it('Create Field button should be disabled', function () {
      expect(container.find('.advice button').is(':disabled')).toBe(true);
    });

    it('Add Field button should be disabled', function () {
      expect(container.find('.advice button').is(':disabled')).toBe(true);
    });
  });

  it('create button is disabled', function () {
    canStub.withArgs('create', 'ContentType').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.add-field-button').attr('disabled')).toBe('disabled');
  });

  it('create button is enabled', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    compileElement();
    expect(container.find('.add-field-button').attr('disabled')).toBeUndefined();
  });

  it('textarea is enabled', function () {
    scope.otEditable = true;
    compileElement();
    expect(container.find('.form-field').eq(1).find('textarea').attr('disabled')).toBeFalsy();
  });

  it('textarea is enabled', function () {
    scope.otEditable = false;
    compileElement();
    expect(container.find('.form-field').eq(1).find('textarea').attr('disabled')).toBeTruthy();
  });

  describe('if fields exist', function () {
    beforeEach(function () {
      scope.hasFields = true;
      compileElement();
    });

    it('field list is shown', function () {
      expect(container.find('.content-type-field-list')).not.toBeNgHidden();
    });

    it('advice is not shown', function () {
      expect(container.find('.advice')).toBeNgHidden();
    });

    it('fields dropdown is shown', function () {
      expect(container.find('.form-controls > .dropdown-btn')).not.toBeNgHidden();
    });
  });

  describe('if no fields exist', function () {
    beforeEach(function () {
      scope.hasFields = false;
      compileElement();
    });

    it('field list is not shown', function () {
      expect(container.find('.content-type-field-list')).toBeNgHidden();
    });

    it('advice is shown', function () {
      expect(container.find('.advice')).not.toBeNgHidden();
    });

    it('fields dropdown is not shown', function () {
      expect(container.find('.form-controls > .dropdown-btn')).toBeNgHidden();
    });
  });


});
