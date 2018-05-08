'use strict';
import {create as createDocument} from 'helpers/mocks/entity_editor_document';

describe('cfSnapshotSidebarList', function () {
  const PER_PAGE = 7;
  const CURRENT_VERSION = 666;

  beforeEach(function () {
    module('contentful/test');

    const moment = this.$inject('moment');
    const spaceContext = this.$inject('mocks/spaceContext').init();
    const doc = createDocument(createEntry());

    spaceContext.cma = {
      getEntrySnapshots: sinon.stub().resolves(createSnapshots(PER_PAGE))
    };
    spaceContext.users = {
      get: sinon.stub().resolves(null)
    };

    const $compile = this.$compile.bind(this);
    const $apply = this.$apply.bind(this);

    this.getEntrySnapshots = spaceContext.cma.getEntrySnapshots;
    this.createSnapshots = createSnapshots;
    this.updatePublishedVersion = updatePublishedVersion;
    this.selectSnapshot = selectSnapshot;
    this.$el = compile();
    this.scope = this.$el.scope();

    function compile () {
      const $scope = {
        entityInfo: { id: 1 },
        otDoc: doc
      };
      return $compile('<cf-snapshot-sidebar-list />', $scope);
    }

    function updatePublishedVersion () {
      const publishedVersion = doc.getValueAt(['sys', 'publishedVersion']);
      doc.setValueAt(['sys', 'publishedVersion'], publishedVersion + 1);
      $apply();
    }

    function selectSnapshot (snapshot) {
      const $radio = this.$el.find(`input[type="radio"][value="${snapshot.sys.id}"]`);
      if ($radio.length) {
        $radio[0].checked = true;
        $radio.triggerHandler('click');
      }
    }

    function createSnapshots (count, hasCurrent) {
      return {
        items: _.times(count).map(function (i) {
          return createSnapshot(i, hasCurrent && i === 0);
        })
      };
    }
    function createSnapshot (id, isCurrent) {
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
            version: isCurrent ? CURRENT_VERSION : CURRENT_VERSION - 1
          }
        }
      };
    }
    function createEntry () {
      return {
        sys: {
          id: 1,
          type: 'Entry',
          version: CURRENT_VERSION,
          publishedVersion: 1
        }
      };
    }
  });

  describe('general', function () {
    it('should load snapshots', function () {
      sinon.assert.calledOnce(this.getEntrySnapshots);
      expect(this.scope.snapshots).toBeDefined();
      expect(this.scope.snapshots.length).toEqual(PER_PAGE);
    });

    it('should select snapshot for comparison', function () {
      this.selectSnapshot(this.scope.snapshots[1]);
      expect(this.scope.selectedId).toEqual(this.scope.snapshots[1].sys.id);
    });

    it('should have compare button enabled only when snapshot is selected', function () {
      const compareBtn = this.$el.find('button');

      expect(compareBtn.attr('disabled')).toBeTruthy();
      this.selectSnapshot(this.scope.snapshots[1]);
      expect(compareBtn.attr('disabled')).toBeFalsy();
    });

    it('should update when published version changes', function () {
      this.getEntrySnapshots.resolves(this.createSnapshots(PER_PAGE - 1));
      this.updatePublishedVersion();

      sinon.assert.calledTwice(this.getEntrySnapshots);
      expect(this.scope.snapshots.length).toEqual(PER_PAGE - 1);
    });

    it('should mark first snapshot as current when it is published', function () {
      this.getEntrySnapshots.resolves(this.createSnapshots(PER_PAGE, false));
      this.updatePublishedVersion();
      expect(this.scope.snapshots[0].sys.isCurrent).toBeFalsy();

      this.getEntrySnapshots.resolves(this.createSnapshots(PER_PAGE, true));
      this.updatePublishedVersion();

      expect(this.scope.snapshots[0].sys.isCurrent).toBeTruthy();
      expect(this.scope.snapshots[1].sys.isCurrent).toBeFalsy();
    });

    it('should hide snapshots list and compare button if there are no previous versions', function () {
      this.getEntrySnapshots.resolves(this.createSnapshots(0));
      this.updatePublishedVersion();
      expect(this.scope.snapshots).toBeNull();

      this.getEntrySnapshots.resolves(this.createSnapshots(1, false));
      this.updatePublishedVersion();
      expect(this.scope.snapshots.length).toEqual(1);

      this.getEntrySnapshots.resolves(this.createSnapshots(1, true));
      this.updatePublishedVersion();
      expect(this.scope.snapshots).toBeNull();

      this.getEntrySnapshots.resolves(this.createSnapshots(2, true));
      this.updatePublishedVersion();
      expect(this.scope.snapshots.length).toEqual(2);
    });
  });
});
