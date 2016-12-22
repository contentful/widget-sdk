'use strict';

describe('cfSnapshotSidebarList', function () {
  const PER_PAGE = 7;
  const PUBLISHED_VERSION = 666;
  let spaceContext;

  beforeEach(function () {
    spaceContext = {};

    this.compile = compile;

    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', spaceContext);
    });

    const moment = this.$inject('moment');
    const otDoc = this.$inject('mocks/entityEditor/Document');
    const $compile = this.$compile.bind(this);

    spaceContext.cma = {
      getEntrySnapshots: sinon.stub().resolves(getSnapshots(PER_PAGE + 1)),
      getEntry: sinon.stub().resolves(getEntry(false))
    };
    spaceContext.users = { get: sinon.stub().resolves(null) };

    this.getSnapshots = getSnapshots;
    this.selectSnapshot = selectSnapshot;

    function compile () {
      const $scope = {
        entityInfo: { id: 1 },
        otDoc: otDoc.create()
      };
      this.$el = $compile('<cf-snapshot-sidebar-list />', $scope);

      return this.$el;
    }

    function selectSnapshot (snapshot) {
      const $radio = this.$el.find(`input[type="radio"][value="${snapshot.sys.id}"]`);
      if ($radio.length) {
        $radio[0].checked = true;
        $radio.triggerHandler('click');
      }
    }

    function getSnapshots (count, hasCurrent) {
      return {
        items: _.times(count).map(function (i) {
          return getSnapshot(i, hasCurrent && i === 0);
        })
      };
    }

    function getSnapshot (id, isCurrent) {
      return {
        sys: {
          createdAt: moment().subtract(id, 'days').format(),
          createdBy: {
            sys: {
              id: 'xyz' + id,
              linkType: 'User',
              type: 'Link'
            }
          },
          id: 'some-id-' + id,
          snapshotType: 'publication',
          type: 'Snapshot'
        },
        snapshot: {
          fields: [],
          sys: {
            publishedVersion: isCurrent ? PUBLISHED_VERSION : PUBLISHED_VERSION - 1
          }
        }
      };
    }

    function getEntry () {
      return { sys: { publishedVersion: PUBLISHED_VERSION } };
    }

  });

  describe('general', function () {
    it('should load snapshots', function () {
      const scope = this.compile().scope();

      sinon.assert.calledOnce(spaceContext.cma.getEntrySnapshots);
      expect(scope.snapshots).toBeDefined();
      expect(scope.snapshots.length).toEqual(PER_PAGE);
    });

    it('should select snapshot for comparison', function () {
      this.compile();
      const scope = this.$el.scope();

      this.selectSnapshot(scope.snapshots[1]);
      expect(scope.selectedId).toEqual(scope.snapshots[1].sys.id);
    });

    it('should have compare button enabled only when snapshot is selected', function () {
      this.compile();
      const scope = this.$el.scope();
      const compareBtn = this.$el.find('button.snapshot-sidebar__compare-btn');

      expect(compareBtn.attr('disabled')).toBeTruthy();
      this.selectSnapshot(scope.snapshots[1]);
      expect(compareBtn.attr('disabled')).toBeFalsy();
    });

    it('should mark first snapshot as current when it is published', function () {
      let scope;

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(PER_PAGE, false));
      scope = this.compile().scope();
      expect(scope.snapshots[0].sys.isCurrent).toBeFalsy();

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(PER_PAGE, true));
      scope = this.compile().scope();
      expect(scope.snapshots[0].sys.isCurrent).toBeTruthy();
      expect(scope.snapshots[1].sys.isCurrent).toBeFalsy();
    });

    it('should hide list and button if there are no previous versions', function () {
      let scope;
      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(1, true));
      scope = this.compile().scope();
      expect(scope.hasSnapshots).toBeFalsy();

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(1, false));
      scope = this.compile().scope();
      expect(scope.hasSnapshots).toBeTruthy();

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(2, true));
      scope = this.compile().scope();
      expect(scope.hasSnapshots).toBeTruthy();
    });
  });

  describe('pagination', function () {
    it('should guess if pagination is possible and show/hide \'load more\' button', function () {
      let scope;

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(PER_PAGE + 1));
      scope = this.compile().scope();
      expect(scope.hasMore).toEqual(true);

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(1));
      scope = this.compile().scope();
      expect(scope.hasMore).toEqual(false);
    });

    it('should load more snapshots, and hide \'load more\' button when nothing is left to load', function () {
      const scope = this.compile().scope();

      spaceContext.cma.getEntrySnapshots = sinon.stub().resolves(this.getSnapshots(1));
      scope.loadMore();
      this.$apply();
      expect(scope.snapshots.length).toEqual(PER_PAGE + 1);
      expect(scope.hasMore).toEqual(false);
    });
  });

});
