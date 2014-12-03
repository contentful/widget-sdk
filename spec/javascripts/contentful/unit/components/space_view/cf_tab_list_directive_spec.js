'use strict';

describe('cfTabList directive', function () {

  var container, scope;
  var activeStub, inactiveStub, canCloseStub, cannotCloseStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = { tabList: {} };

      activeStub = sinon.stub();
      activeStub.returns(true);
      inactiveStub = sinon.stub();
      inactiveStub.returns(false);
      canCloseStub = sinon.stub();
      canCloseStub.returns(true);
      cannotCloseStub = sinon.stub();
      cannotCloseStub.returns(false);
      scope.spaceContext.tabList.items = [
        {active: activeStub, canClose: canCloseStub, dirty: true, hidden: false},
        {active: inactiveStub, canClose: canCloseStub, dirty: true, hidden: false},
        {active: inactiveStub, canClose: cannotCloseStub, dirty: false, hidden: true}
      ];

      container = $('<div cf-tab-list></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  it('has 3 tabs', function () {
    expect(container.find('li.tab').length).toBe(3);
  });

  it('first tab is active', function () {
    expect(container.find('li.tab').eq(0)).toHaveClass('active');
  });

  it('second tab is inactive', function () {
    expect(container.find('li.tab').eq(1)).not.toHaveClass('active');
  });

  it('third tab is inactive', function () {
    expect(container.find('li.tab').eq(2)).not.toHaveClass('active');
  });

  it('first tab is dirty', function () {
    expect(container.find('li.tab').eq(0)).toHaveClass('dirty');
  });

  it('second tab is dirty', function () {
    expect(container.find('li.tab').eq(1)).toHaveClass('dirty');
  });

  it('third tab is not dirty', function () {
    expect(container.find('li.tab').eq(2)).not.toHaveClass('dirty');
  });

  it('first tab is shown', function () {
    expect(container.find('li.tab').eq(0)).not.toBeNgHidden();
  });

  it('second tab is shown', function () {
    expect(container.find('li.tab').eq(1)).not.toBeNgHidden();
  });

  it('third tab is not shown', function () {
    expect(container.find('li.tab').eq(2)).toBeNgHidden();
  });

  it('first tab can be closed', function () {
    expect(container.find('li.tab .close').eq(0)).not.toBeNgHidden();
  });

  it('second tab can be closed', function () {
    expect(container.find('li.tab .close').eq(1)).not.toBeNgHidden();
  });

  it('third tab cannot be closed', function () {
    expect(container.find('li.tab .close').eq(2)).toBeNgHidden();
  });

});
