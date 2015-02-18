'use strict';

describe('cfKnowledgeBaseIcon Directve', function () {
  var element, scope;
  var analyticsStub;
  beforeEach(module('contentful/test', function ($provide) {
    analyticsStub = sinon.stub();
    $provide.value('analytics', {
      knowledgeBase: analyticsStub
    });
  }));

  beforeEach(inject(function ($compile, $rootScope) {
    scope = $rootScope;
    element = $compile(
      '<div cf-knowledge-base-icon '+
      'tooltip="tooltip text" analytics-event="eventname" '+
      'href="http://contentful.com"></div>'
    )(scope);
    scope.$digest();
  }));

  it('has tooltip text', function () {
    expect(element.attr('tooltip')).toBe('tooltip text');
  });

  it('has tooltip placement', function () {
    expect(element.attr('tooltip-placement')).toBe('right');
  });

  it('has tooltip container', function () {
    expect(element.attr('tooltip-container')).toBe('[cf-knowledge-base-icon]');
  });

  it('has href', function () {
    expect(element.attr('href')).toBe('http://contentful.com');
  });

  it('opens in a new page', function () {
    expect(element.attr('target')).toBe('_blank');
  });

  it('opens in a new page', function () {
    element.click();
    expect(analyticsStub.args[0][0]).toBe('eventname');
  });

});
