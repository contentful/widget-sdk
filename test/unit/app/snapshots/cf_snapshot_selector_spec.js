import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';

describe('cfSnapshotSelector', () => {
  const PER_PAGE = 20; // page size

  beforeEach(function() {
    module('contentful/test');

    const mockEntry = {
      sys: {
        id: 1,
        type: 'Entry',
        version: 1
      }
    };

    const moment = this.$inject('moment');
    const spaceContext = this.$inject('mocks/spaceContext').init();

    const createDocument = this.$inject('mocks/entityEditor/Document').create;
    const doc = createDocument(mockEntry);

    const $compile = this.$compile.bind(this);

    spaceContext.cma = {
      getEntrySnapshots: sinon.stub().resolves({
        items: Array.from({ length: 50 }).map(makeFakeSnapshots(50))
      })
    };

    spaceContext.users = {
      get: sinon.stub().resolves({
        getName: () => String.fromCharCode(65 + _.random(25))
      })
    };

    this.scope = compile().scope();
    this.spaceContext = spaceContext;
    this.makeFakeSnapshot = makeFakeSnapshot;
    this.makeFakeSnapshots = makeFakeSnapshots;

    this.toggleList = function(flag) {
      this.scope.showSnapshotSelector$.set(flag);
      this.$apply();
    };

    this.assertLoadCalledAndReset = () => {
      sinon.assert.calledOnce(spaceContext.cma.getEntrySnapshots);
      sinon.assert.calledWith(spaceContext.cma.getEntrySnapshots, 1);
      spaceContext.cma.getEntrySnapshots.reset();
    };

    this.assertSnapshotsLength = function(count) {
      expect(this.scope.snapshots.length).toEqual(count);
    };

    function compile(scope) {
      const $scope = _.extend(
        {
          showSnapshotSelector$: K.createMockProperty(false),
          entityInfo: { id: 1 },
          snapshot: makeFakeSnapshot(1),
          otDoc: doc
        },
        scope
      );

      return $compile('<cf-snapshot-selector />', $scope);
    }

    function makeFakeSnapshots(count) {
      let map;

      return () => {
        let rand = _.random(count * 2);

        map = map || {}; // broken it this way only to keep the linter happy

        while (rand in map) {
          rand = _.random(count * 2);
        }

        map[rand] = true;

        return makeFakeSnapshot(rand);
      };
    }

    function makeFakeSnapshot(rand) {
      return {
        sys: {
          createdAt: moment()
            .subtract(rand, 'days')
            .format(),
          createdBy: {
            sys: {
              id: 'xyz' + rand,
              linkType: 'User',
              type: 'Link'
            }
          },
          id: 'some-id-' + rand,
          snapshotType: 'publication',
          type: 'Snapshot'
        },
        snapshot: {
          fields: []
        }
      };
    }
  });

  describe('lazy init', () => {
    it('should load initial list of snapshots lazily', function() {
      this.assertSnapshotsLength(0);

      this.toggleList(true);

      this.assertLoadCalledAndReset();
      this.assertSnapshotsLength(PER_PAGE);
      this.scope.snapshots.forEach(snapshot =>
        expect(snapshot.sys.createdBy.authorName).toBeTruthy()
      );

      // hide and show snapshots list
      this.toggleList(false);
      this.toggleList(true);
      sinon.assert.notCalled(this.spaceContext.cma.getEntrySnapshots);
    });
  });

  describe('pagination', () => {
    beforeEach(function() {
      this.assertLoadMoreBehaviour = function(isLoading, isAtLast) {
        this.scope.isLoading = isLoading;
        this.scope.paginator.isAtLast = sinon.stub().returns(isAtLast);
        this.scope.paginator.next = sinon.spy();
        this.scope.loadMore();

        if (!isLoading && !isAtLast) {
          sinon.assert.calledOnce(this.scope.paginator.next);
          this.assertLoadCalledAndReset();
        } else {
          sinon.assert.notCalled(this.scope.paginator.next);
        }
      };
    });

    it('should be called only when nothing is loading and we still have pages to show', function() {
      this.assertLoadMoreBehaviour(false, false);
      this.assertLoadMoreBehaviour(true, false);
      this.assertLoadMoreBehaviour(false, true);
    });
  });

  describe('sorting', () => {
    beforeEach(function() {
      this.assertSort = function(sortMethod, sortedOnProp, transformFn) {
        const testSortingOrder = this.testSortingOrder(
          sortMethod,
          sortedOnProp,
          transformFn || _.identity
        );

        this.toggleList(true);
        testSortingOrder(true); // true => ascending
        testSortingOrder(false);
      };

      this.testSortingOrder = function(sortMethod, sortedOnProp, transformFn) {
        const scope = this.scope;

        return isAscending => {
          const noOfSnapshots = scope.snapshots.length;

          scope.isAscending = isAscending;
          sortMethod(scope.isAscending);

          expect(_.filter(scope.sortOrder, _.identity).length).toEqual(1);

          const pluckedPropArray = _.map(scope.snapshots, s => transformFn(_.get(s, sortedOnProp)));
          const assertOrdering = isAscending ? isSortedAscending : isSortedDescending;

          expect(assertOrdering(pluckedPropArray)).toEqual(true);
          expect(scope.isAscending).not.toEqual(isAscending);
          expect(scope.snapshots.length).toEqual(noOfSnapshots);
        };
      };

      function isSortedAscending(arr) {
        return _.isEqual(arr, _.sortBy(arr));
      }

      function isSortedDescending(arr) {
        return isSortedAscending(_.reverse(arr));
      }
    });

    describe('sort by last edited', () => {
      it('should sort by snapshot.sys.createdAt', function() {
        this.assertSort(this.scope.sortByLastEdited, 'sys.createdAt', dateString =>
          new Date(dateString).getTime()
        );
      });
    });

    describe('sort by editor', () => {
      it('should sort by sys.createdBy.authorName', function() {
        this.assertSort(this.scope.sortByEditor, 'sys.createdBy.authorName');
      });
    });

    describe('sort by status', () => {
      it('should sort by sys.snapshotType', function() {
        this.assertSort(this.scope.sortByStatus, 'sys.snapshotType');
      });
    });
  });

  describe('dont add duplicate snapshots', () => {
    it('should only add unique snapshots to the list', function() {
      const snapshotsArr = Array.from({ length: PER_PAGE }).map(this.makeFakeSnapshots(PER_PAGE));

      this.spaceContext.cma.getEntrySnapshots = sinon.stub().resolves({
        items: snapshotsArr
      });

      this.toggleList(true);
      this.assertSnapshotsLength(20);

      this.scope.loadMore(); // api mock will return same 20 snapshots
      this.assertSnapshotsLength(20);
    });
  });
});
