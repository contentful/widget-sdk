'use strict';

describe('Accordion Controller', function () {
  var controller, scope;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, $controller){
      scope = $rootScope.$new();
      controller = $controller('AccordionController', {$scope: scope});
    });
  });

  describe('toggle an item', function () {
    var item;
    beforeEach(function () {
      item = {id: 123};
      scope.toggleAccordionItem(item);
    });

    it('item is open', function () {
      expect(scope.isAccordionItemOpen(item)).toBeTruthy();
    });

    it('item is closed', function () {
      scope.toggleAccordionItem(item);
      expect(scope.isAccordionItemOpen(item)).toBeFalsy();
    });
  });

  describe('open a item', function () {
    var item;
    beforeEach(function () {
      item = {id: 123};
    });

    it('item is closed', function () {
      expect(scope.isAccordionItemOpen(item)).toBeFalsy();
    });

    it('item is open', function () {
      scope.openAccordionItem(item);
      expect(scope.isAccordionItemOpen(item)).toBeTruthy();
    });
  });

  describe('click a item', function () {
    var item;
    beforeEach(function () {
      item = {id: 123};
      scope.openAccordionItem = sinon.stub();
      scope.accordionItemClicked(item);
    });

    it('item is opened', function () {
      sinon.assert.calledWith(scope.openAccordionItem, item);
    });
  });

});
