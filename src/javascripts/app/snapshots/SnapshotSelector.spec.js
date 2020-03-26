import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import SnapshotSelector from './SnapshotSelector';
import moment from 'moment';
import { getModule } from 'NgRegistry';

jest.mock('NgRegistry', () => ({ getModule: jest.fn() }));

const makeFakeSnapshot = (_, i) => {
  return {
    sys: {
      createdAt: moment()
        .subtract(i, 'days')
        .format(),
      createdBy: {
        authorName: '',
        sys: {
          id: `xyz${i}`,
          linkType: 'User',
          type: 'Link'
        }
      },
      id: `some-id-${i}`,
      snapshotType: i % 2 ? 'published' : 'draft',
      type: 'Snapshot'
    },
    snapshot: {
      fields: []
    }
  };
};

const PER_PAGE = 20;

const fakedSnapshots = Array.from({ length: PER_PAGE * 2 }).map(makeFakeSnapshot);

const getEntrySnapshots = jest.fn().mockImplementation((_, query) => {
  const items = fakedSnapshots.slice(query.skip, query.skip + query.limit);
  return Promise.resolve({ items });
});

getModule.mockImplementation(() => ({
  cma: { getEntrySnapshots },
  users: { get: jest.fn().mockResolvedValue() }
}));

const goToSnapshot = jest.fn();
const getProps = (args = {}) => {
  const props = {
    goToSnapshot,
    editorData: {
      entity: { data: makeFakeSnapshot(undefined, -1) },
      entityInfo: { id: 'entityId' }
    },
    snapshot: {
      sys: {
        id: 'snapshotId',
        createdAt: moment().format()
      }
    },
    ...args
  };
  return props;
};

const getSnapshotId = idx => {
  return fakedSnapshots[idx].sys.id;
};

const renderComponent = () => {
  const component = render(<SnapshotSelector {...getProps()} />);
  const { getByTestId, queryByTestId } = component;

  const scrollTable = () => {
    const tableBody = getByTestId('snapshot-selector-tablebody');
    fireEvent.scroll(tableBody, { target: { scrollTop: tableBody.scrollHeight + 10 } });
  };

  const initFirstLoad = async () => {
    const button = getByTestId('snapshot-selector-button');
    expect(button).toBeInTheDocument();
    expect(queryByTestId('snapshot-selector-table')).not.toBeInTheDocument();
    expect(getEntrySnapshots).not.toHaveBeenCalled();
    button.click();
    await waitForElement(() => getByTestId('snapshot-selector-table'));
    expect(getEntrySnapshots).toHaveBeenCalled();
  };

  const compareNthChild = (resultIdx, expectedIdx) => {
    const child = getByTestId('snapshot-selector-tablebody').children[resultIdx];
    expect(child).toHaveAttribute(
      'data-test-id',
      `snapshot-selector-table-row-${getSnapshotId(expectedIdx)}`
    );
  };

  return { ...component, scrollTable, initFirstLoad, compareNthChild };
};

describe('SnapshotSelector', () => {
  afterEach(() => {
    getEntrySnapshots.mockClear();
    jest.clearAllMocks();
  });

  describe('lazy init', () => {
    it('should load initial list of snapshots lazily', async () => {
      const { initFirstLoad } = renderComponent();
      await initFirstLoad();
    });
  });

  describe('open snapshot', () => {
    it('should be able to open a specific snapshot', async () => {
      const { initFirstLoad, getByTestId } = renderComponent();
      await initFirstLoad();
      fireEvent.click(getByTestId('snapshot-selector-tablebody').firstChild);
      expect(goToSnapshot).toHaveBeenCalledWith(fakedSnapshots[0]);
    });
  });

  describe('pagination', () => {
    it('should load on scroll to bottom of list (if more snapshots are available)', async () => {
      let skip = 0;
      const { scrollTable, initFirstLoad, getByTestId, queryByTestId } = renderComponent();
      await initFirstLoad();
      expect(getByTestId(`snapshot-selector-table-row-${getSnapshotId(skip)}`)).toBeInTheDocument();
      expect(
        getByTestId(`snapshot-selector-table-row-${getSnapshotId(PER_PAGE + skip - 1)}`)
      ).toBeInTheDocument();
      expect(
        queryByTestId(`snapshot-selector-table-row-${getSnapshotId(PER_PAGE + skip)}`)
      ).not.toBeInTheDocument();
      expect(getEntrySnapshots).toHaveBeenCalledWith('entityId', { limit: PER_PAGE + 1, skip });
      scrollTable();
      skip += PER_PAGE;
      await waitForElement(() => getByTestId(`snapshot-selector-table-row-${getSnapshotId(skip)}`));
      expect(
        getByTestId(`snapshot-selector-table-row-${getSnapshotId(PER_PAGE + skip - 1)}`)
      ).toBeInTheDocument();
      expect(getEntrySnapshots).toHaveBeenCalledWith('entityId', { limit: PER_PAGE + 1, skip });
      expect(getEntrySnapshots).toHaveBeenCalledTimes(2);

      scrollTable();
      expect(getEntrySnapshots).toHaveBeenCalledTimes(2);
    });
  });
  describe('sorting', () => {
    it('sorts by last edited', async () => {
      const { initFirstLoad, getByTestId, compareNthChild } = renderComponent();
      await initFirstLoad();
      const button = getByTestId('snapshot-selector-table-sort-lastedited');
      compareNthChild(0, 0);
      button.click();
      compareNthChild(0, 19);
      button.click();
      compareNthChild(0, 0);
    });
    it('sorts by editor', async () => {
      const { initFirstLoad, getByTestId, compareNthChild } = renderComponent();
      await initFirstLoad();
      const button = getByTestId('snapshot-selector-table-sort-editor');
      compareNthChild(1, 1);
      button.click();
      button.click();
      compareNthChild(1, 18);
    });
    it('sorts by status', async () => {
      const { initFirstLoad, getByTestId, compareNthChild } = renderComponent();
      await initFirstLoad();
      const button = getByTestId('snapshot-selector-table-sort-status');
      compareNthChild(2, 2);
      button.click();
      button.click();
      compareNthChild(2, 17);
    });
  });
});
