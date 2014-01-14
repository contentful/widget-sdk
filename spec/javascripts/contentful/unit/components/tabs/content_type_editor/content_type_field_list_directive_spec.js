'use strict';

describe('The ContentTypeFieldList directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('cfFieldSettings');
    });

    function ControllerMock(){}

    inject(function ($rootScope, $compile, contentTypeFieldListDirective) {
      contentTypeFieldListDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();
      scope.preferences = {};

      scope.isFieldOpen = sinon.stub();
      scope.isFieldOpen.withArgs({uiid: 'foo'}).returns(true);
      scope.isFieldOpen.withArgs({uiid: 'bar', disabled: true}).returns(false);


      compileElement = function () {
        container = $('<div class="content-type-field-list"></div>');
        scope.fieldList = [
          {uiid: 'foo'},
          {uiid: 'bar', disabled: true}
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
    expect(container.find('.cf-field-settings').length).toBe(2);
  });

  it('first field is active', function () {
    compileElement();
    expect(container.find('.cf-field-settings').eq(0).hasClass('active')).toBeTruthy();
  });

  it('second field is inactive', function () {
    compileElement();
    expect(container.find('.cf-field-settings').eq(1).hasClass('active')).toBeFalsy();
  });

  it('first field is open', function () {
    compileElement();
    expect(container.find('.cf-field-settings').eq(0).hasClass('open')).toBeTruthy();
  });

  it('second field is closed', function () {
    compileElement();
    expect(container.find('.cf-field-settings').eq(1).hasClass('open')).toBeFalsy();
  });

  it('first field is not hidden', function () {
    compileElement();
    expect(container.find('.cf-field-settings').eq(0)).not.toBeNgHidden();
  });

  it('second field is hidden', function () {
    compileElement();
    expect(container.find('.cf-field-settings').eq(1)).toBeNgHidden();
  });

  it('if preference setting is active second field is not hidden', function () {
    scope.preferences.showDisabledFields = true;
    compileElement();
    expect(container.find('.cf-field-settings').eq(1)).not.toBeNgHidden();
  });

});
