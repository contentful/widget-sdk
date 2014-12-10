'use strict';

describe('The ContentTypeFieldList directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('cfFieldSettingsEditor');
      $provide.removeControllers('ContentTypeFieldListController');
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.preferences = {};

      scope.isAccordionItemOpen = sinon.stub();
      scope.isAccordionItemOpen.withArgs({id: 'foo'}).returns(true);
      scope.isAccordionItemOpen.withArgs({id: 'bar', disabled: true}).returns(false);


      compileElement = function () {
        container = $('<div class="content-type-field-list"></div>');
        scope.fieldList = [
          {id: 'foo'},
          {id: 'bar', disabled: true}
        ];
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  it('has two fields', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').length).toBe(2);
  });

  it('first field is active', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(0)).toHaveClass('active');
  });

  it('second field is inactive', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(1)).not.toHaveClass('active');
  });

  it('first field is open', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(0)).toHaveClass('open');
  });

  it('second field is closed', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(1)).not.toHaveClass('open');
  });

  it('first field is not hidden', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(0)).not.toBeNgHidden();
  });

  it('second field is hidden', function () {
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(1)).toBeNgHidden();
  });

  it('if preference setting is active second field is not hidden', function () {
    scope.preferences.showDisabledFields = true;
    compileElement();
    expect(container.find('.cf-field-settings-editor').eq(1)).not.toBeNgHidden();
  });

});
