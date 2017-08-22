import * as KefirMock from 'helpers/mocks/kefir';

describe('cfBreadcrumbsDirective spec', function () {
  const contextHistoryMock = {
    add: sinon.spy(),
    isEmpty: sinon.spy(),
    pop: sinon.spy(),
    purge: sinon.spy(),
    getLast: sinon.spy(),
    crumbs$: null
  };
  const $stateMock = {
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

    contextHistoryMock.crumbs$ = KefirMock.createMockProperty([]);

    this.compileElement = function (backHint, ancestorHint) {
      return this.$compile('<cf-breadcrumbs />', {
        backHint: backHint,
        ancestorHint: ancestorHint
      });
    };

    this.assertPropAfterStubAndCompile = function (entityCount, prop, val) {
      contextHistoryMock.crumbs$.set(makeEntities(entityCount));
      const $el = this.compileElement();
      const scope = $el.find(':first-child').scope();
      expect(_.get(scope, prop)).toEqual(val);
    };

    this.makeEntitesAndCompileEl = function (count) {
      contextHistoryMock.crumbs$.set(makeEntities(count));
      return this.compileElement();
    };
  });

  describe('Controller', function () {
    describe('crumbs property', function () {
      it('should contain as many elements as in contextHistory.crumbs$', function () {
        this.assertPropAfterStubAndCompile(0, 'crumbs.length', 0);
        this.assertPropAfterStubAndCompile(4, 'crumbs.length', 4);
      });

      it('each crumb should have a getTitle fn, link object and type property', function () {
        contextHistoryMock.crumbs$.set([makeEntity('title1', 'type1', 1, 'state1', { a: 10 })]);
        const crumb = this.compileElement().find(':first-child').scope().crumbs[0];

        expect(_.isFunction(crumb.getTitle)).toEqual(true);
        expect(crumb.getTitle()).toEqual('title1');
        expect(crumb.link).toEqual({ state: 'state1', params: { a: 10 } });
        expect(crumb.type).toEqual('type1');
      });
    });

    it('should be hidden if there are less than 2 crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'shouldHide', true);
      this.assertPropAfterStubAndCompile(1, 'shouldHide', true);
      this.assertPropAfterStubAndCompile(2, 'shouldHide', false);
      this.assertPropAfterStubAndCompile(3, 'shouldHide', false);
    });

    it('should show back button if there are 2 or more crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'shouldShowBack', false);
      this.assertPropAfterStubAndCompile(1, 'shouldShowBack', false);
      this.assertPropAfterStubAndCompile(2, 'shouldShowBack', true);
      this.assertPropAfterStubAndCompile(3, 'shouldShowBack', true);
    });

    it('should show hierarchy if there are at least 3 crumbs', function () {
      this.assertPropAfterStubAndCompile(0, 'shouldShowHierarchy', false);
      this.assertPropAfterStubAndCompile(1, 'shouldShowHierarchy', false);
      this.assertPropAfterStubAndCompile(2, 'shouldShowHierarchy', false);
      this.assertPropAfterStubAndCompile(3, 'shouldShowHierarchy', true);
    });

    it('should update the document title when the title of the latest crumb changes', function () {
      const $el = this.makeEntitesAndCompileEl(1);
      const $scope = $el.find(':first-child').scope();
      const document = $el.prop('ownerDocument');

      expect(document.title).toEqual('title0');
      $scope.crumbs[0].getTitle = _.constant('new title');
      this.$apply();
      expect(document.title).toEqual('new title');
    });
  });

  describe('link method', function () {
    const backBtnSelector = '[aria-label="breadcrumbs-back-btn"]';
    const ancestorBtnSelector = '[aria-label="breadcrumbs-ancestor-btn"]';
    const ancestorMenuSelector = '[aria-label="breadcrumbs-ancestor-menu"]';

    beforeEach(function () {
      this.getAssertionFnForElem = function (selector) {
        const self = this;

        return function (entityCount, prop, value) {
          const $el = self.makeEntitesAndCompileEl(entityCount).find(selector);

          expect(_.get($el, prop)).toEqual(value);
        };
      };
    });

    describe('Back button', function () {
      it('should call $state.go', function () {
        const $backBtn = this.makeEntitesAndCompileEl(2).find(backBtnSelector);

        $backBtn.click();
        sinon.assert.calledOnce($stateMock.go);
        sinon.assert.calledWith($stateMock.go, 'state0', { id: 0 });
      });

      it('should appear on the ui only if there are atleast 2 crumbs', function () {
        const assert = this.getAssertionFnForElem(backBtnSelector);

        assert(0, 'length', 0);
        assert(1, 'length', 0);
        assert(2, '0.dataset.testId', 'breadcrumbs-back-btn');
      });
    });

    describe('Ancestor list button', function () {
      it('should toggle aria-hidden attribute of ancestor list dropdown menu', function () {
        const $el = this.makeEntitesAndCompileEl(3);
        const $ancestorBtn = $el.find(ancestorBtnSelector);
        const $ancestorMenu = $el.find(ancestorMenuSelector);

        expect($ancestorMenu.attr('aria-hidden')).toEqual('true');
        $ancestorBtn.click();
        expect($ancestorMenu.attr('aria-hidden')).toEqual('false');
        $ancestorBtn.click();
        expect($ancestorMenu.attr('aria-hidden')).toEqual('true');
      });

      it('should appear on the ui iff there are more than 2 crumbs', function () {
        const assert = this.getAssertionFnForElem(ancestorBtnSelector);

        assert(0, 'length', 0);
        assert(1, 'length', 0);
        assert(2, 'length', 0);
        assert(3, '0.dataset.testId', 'breadcrumbs-ancestor-btn');
      });
    });
  });


  function makeEntities (count) {
    const result = [];

    for (let i = 0; i < count; i++) {
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
      type: type,
      id: id,
      icon: 'settings'
    };
  }
});
