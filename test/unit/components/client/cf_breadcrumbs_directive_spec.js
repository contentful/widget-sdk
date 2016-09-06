'use strict';

describe('cfBreadcrumbsDirective spec', function () {
  var contextHistoryMock = {
    addEntity: sinon.spy(),
    isEmpty: sinon.spy(),
    pop: sinon.spy(),
    purge: sinon.spy(),
    getAll: sinon.stub(),
    getLast: sinon.spy(),
    getAllButLast: sinon.spy()
  };
  var $stateMock = {
    go: sinon.spy(),
    current: {},
    href: sinon.stub().returns('somelink')
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('contextHistory', function () {
        return contextHistoryMock;
      });

      $provide.factory('$state', function () {
        return $stateMock;
      });
    });

    this.compileElement = function (backHint, ancestorHint) {
      return this.$compile('<cf-breadcrumbs />', {
        backHint: backHint,
        ancestorHint: ancestorHint
      });
    };

    this.assertPropAfterStubAndCompile = function (entityCount, prop, val) {
      contextHistoryMock.getAll.returns(makeEntities(entityCount));
      var $el = this.compileElement();
      var scope = $el.find(':first-child').scope();
      expect(dotty.get(scope, prop)).toEqual(val);
    };

    this.makeEntitesAndCompileEl = function (count) {
      contextHistoryMock.getAll.returns(makeEntities(count));
      return this.compileElement();
    };
  });

  describe('Controller', function () {
    describe('crumbs property', function () {
      it('should contain as many elements as returned by contextHistory.getAll', function () {
        this.assertPropAfterStubAndCompile(0, 'crumbs.length', 0);
        this.assertPropAfterStubAndCompile(4, 'crumbs.length', 4);
      });

      it('each crumb should have a getTitle fn, link object and type property', function () {
        contextHistoryMock.getAll.returns([makeEntity('title1', 'type1', 1, 'state1', { a: 10 })]);
        var crumb = this.compileElement().find(':first-child').scope().crumbs[0];

        expect(_.isFunction(crumb.getTitle)).toEqual(true);
        expect(crumb.getTitle()).toEqual('title1');
        expect(crumb.link).toEqual({ state: 'state1', params: { a: 10 } });
        expect(crumb.type).toEqual('type1');
      });
    });

    it('should have hide prop which is true iff there are less than 2 crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'crumbs.hide', true);
      this.assertPropAfterStubAndCompile(1, 'crumbs.hide', true);
      this.assertPropAfterStubAndCompile(2, 'crumbs.hide', false);
      this.assertPropAfterStubAndCompile(3, 'crumbs.hide', false);
    });

    it('should have isExactlyOneLevelDeep prop which is true iff there are 2 crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'crumbs.isExactlyOneLevelDeep', false);
      this.assertPropAfterStubAndCompile(1, 'crumbs.isExactlyOneLevelDeep', false);
      this.assertPropAfterStubAndCompile(2, 'crumbs.isExactlyOneLevelDeep', true);
      this.assertPropAfterStubAndCompile(3, 'crumbs.isExactlyOneLevelDeep', false);
    });

    it('should have isMoreThanALevelDeep prop which is true iff there are more than 2 crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'crumbs.isMoreThanALevelDeep', false);
      this.assertPropAfterStubAndCompile(1, 'crumbs.isMoreThanALevelDeep', false);
      this.assertPropAfterStubAndCompile(2, 'crumbs.isMoreThanALevelDeep', false);
      this.assertPropAfterStubAndCompile(3, 'crumbs.isMoreThanALevelDeep', true);
    });

    it('should have isAtLeastOneLevelDeep prop which is true iff there are atleast 2 crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'crumbs.isAtLeastOneLevelDeep', false);
      this.assertPropAfterStubAndCompile(1, 'crumbs.isAtLeastOneLevelDeep', false);
      this.assertPropAfterStubAndCompile(2, 'crumbs.isAtLeastOneLevelDeep', true);
      this.assertPropAfterStubAndCompile(3, 'crumbs.isAtLeastOneLevelDeep', true);
    });

    it('should update the document title when the title of the latest crumb changes', function () {
      var $el = this.makeEntitesAndCompileEl(1);
      var $scope = $el.find(':first-child').scope();
      var document = $el.prop('ownerDocument');

      expect(document.title).toEqual('title0');
      $scope.crumbs[0].getTitle = _.constant('new title');
      this.$apply();
      expect(document.title).toEqual('new title');
    });
  });

  describe('link method', function () {
    var backBtnSelector = '[aria-label="breadcrumbs-back-btn"]';
    var ancestorBtnSelector = '[aria-label="breadcrumbs-ancestor-btn"]';
    var ancestorMenuSelector = '[aria-label="breadcrumbs-ancestor-menu"]';

    beforeEach(function () {
      this.getAssertionFnForElem = function (selector) {
        var self = this;

        return function (entityCount, prop, value) {
          var $el = self.makeEntitesAndCompileEl(entityCount).find(selector);

          expect(dotty.get($el, prop)).toEqual(value);
        };
      };
    });

    describe('Back button', function () {
      it('should call $state.go', function () {
        var $backBtn = this.makeEntitesAndCompileEl(2).find(backBtnSelector);

        $backBtn.click();
        sinon.assert.calledOnce($stateMock.go);
        sinon.assert.calledWith($stateMock.go, 'state0', { id: 0 });
      });

      it('should appear on the ui only if there are atleast 2 crumbs', function () {
        var assert = this.getAssertionFnForElem(backBtnSelector);

        assert(0, 'length', 0);
        assert(1, 'length', 0);
        assert(2, '0.dataset.testId', 'breadcrumbs-back-btn');
      });
    });

    describe('Ancestor list button', function () {
      it('should toggle aria-hidden attribute of ancestor list dropdown menu', function () {
        var $el = this.makeEntitesAndCompileEl(3);
        var $ancestorBtn = $el.find(ancestorBtnSelector);
        var $ancestorMenu = $el.find(ancestorMenuSelector);

        expect($ancestorMenu.attr('aria-hidden')).toEqual('true');
        $ancestorBtn.click();
        expect($ancestorMenu.attr('aria-hidden')).toEqual('false');
        $ancestorBtn.click();
        expect($ancestorMenu.attr('aria-hidden')).toEqual('true');
      });

      it('should appear on the ui iff there are more than 2 crumbs', function () {
        var assert = this.getAssertionFnForElem(ancestorBtnSelector);

        assert(0, 'length', 0);
        assert(1, 'length', 0);
        assert(2, 'length', 0);
        assert(3, '0.dataset.testId', 'breadcrumbs-ancestor-btn');
      });
    });
  });


  function makeEntities (count) {
    var result = [];

    for (var i = 0; i < count; i++) {
      result.push(makeEntity(`title${i}`, `type${i}`, i, `state${i}`, { id: i }));
    }

    return result;
  }

  function makeEntity (title, type, id, state, params) {
    return {
      getTitle: _.constant(title),
      link: {
        state: state,
        params: params
      },
      getType: _.constant(type),
      getId: _.constant(id)
    };
  }
});
