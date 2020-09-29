import React from 'react';
import { render, wait, fireEvent } from '@testing-library/react';

import { SortableTree as Tree } from './Tree';
import {
  deflattenFolders,
  flattenFolders,
  initReorder,
  reorderArray,
  sanitizeFolders,
} from './helpers';

const listViewContext = {
  getView: jest.fn().mockReturnValue({ id: 'id' }),
  setView: jest.fn(),
  assignView: jest.fn(),
};

const onSelectSavedView = jest.fn();
const folders = [
  { id: 'default', views: [{ id: 'view1', title: 'View 1' }], title: 'Views' },
  { id: '0', views: [], title: 'Directory' },
  {
    id: '1',
    views: [
      { id: 'view2', title: 'View 2' },
      { id: 'view3', title: 'View 3' },
    ],
    title: 'Directory',
  },
];

const flattenedFolders = [
  {
    id: 'default',
    title: 'Views',
    folderId: 'default',
    isFolder: true,
    views: [{ id: 'view1', title: 'View 1' }],
  },
  { id: 'view1', title: 'View 1', folderId: 'default' },
  { id: '0', title: 'Directory', folderId: '0', isFolder: true, views: [] },
  {
    id: '1',
    title: 'Directory',
    folderId: '1',
    isFolder: true,
    views: [
      { id: 'view2', title: 'View 2' },
      { id: 'view3', title: 'View 3' },
    ],
  },
  { id: 'view2', title: 'View 2', folderId: '1' },
  { id: 'view3', title: 'View 3', folderId: '1' },
];

const savedViewsActions = {
  canEditScopedFolders: jest.fn(),
  deleteScopedFolder: jest.fn(),
  deleteScopedFolderView: jest.fn(),
  getPreparedScopedFolders: jest.fn(),
  getRoleAssignment: jest.fn(),
  saveScopedFolders: jest.fn(),
  trackingForScopedViews: {},
  updateScopedFolder: jest.fn(),
  updateScopedFolderView: jest.fn(),
  resetScopedFolders: jest.fn(),
  createScopedFolder: jest.fn(),
  getDefaultScopedFolder: jest.fn(),
  createScopedFolderView: jest.fn(),
  fetchFolders: jest.fn(),
  setFolders: jest.fn(),
};

const defaultProps = {
  listViewContext,
  onSelectSavedView,
  entityType: 'entry',
  folders,
  savedViewsActions,
};

const build = (props = {}) => {
  return render(<Tree {...defaultProps} {...props} />);
};

describe('Tree.js', () => {
  describe('rendering', () => {
    it('should render for views sorting', async () => {
      const { queryByTestId } = build();
      fireEvent.mouseOver(queryByTestId('draggable-view-view1'));
      await wait();
      const sortableContainer = queryByTestId('sortable-container');
      expect(sortableContainer).toBeInTheDocument();
      expect(sortableContainer.childNodes).toHaveLength(flattenedFolders.length - 1); // the default folder is not shown
    });

    it('should render for folders sorting', async () => {
      const { queryByTestId } = build();
      fireEvent.mouseOver(queryByTestId('draggable-folder-1'));
      await wait();
      const sortableContainer = queryByTestId('sortable-container');
      expect(sortableContainer).toBeInTheDocument();
      expect(queryByTestId('nested-view-view1')).toBeInTheDocument();
      expect(sortableContainer.childNodes).toHaveLength(folders.length);
    });

    it('should be able to select a view', async () => {
      const { queryByTestId } = build();
      fireEvent.click(queryByTestId('draggable-view-view1'));
      await wait();
      expect(onSelectSavedView).toHaveBeenLastCalledWith(flattenedFolders[1]);
      expect(listViewContext.setView).toHaveBeenLastCalledWith(flattenedFolders[1]);
    });
  });
  describe('reordering', () => {
    it('should flatten folders', () => {
      const result = flattenFolders(folders);
      expect(result).toEqual(flattenedFolders);
    });

    it('should deflatten and sanitize folders', () => {
      const result = deflattenFolders(flattenedFolders);
      const sanitized = sanitizeFolders(result);
      expect(sanitized).toEqual(folders);
    });

    it('should reorder folders', async () => {
      savedViewsActions.getPreparedScopedFolders.mockResolvedValue(folders);
      const { reorderFolders } = initReorder(savedViewsActions);
      await reorderFolders(1, 2);
      expect(savedViewsActions.saveScopedFolders).toHaveBeenLastCalledWith([
        folders[0],
        folders[2],
        folders[1],
      ]);
    });

    it('should reorder views', async () => {
      const { reorderViews } = initReorder(savedViewsActions);
      await reorderViews(flattenedFolders, 4, 5);
      expect(savedViewsActions.saveScopedFolders).toHaveBeenLastCalledWith([
        folders[0],
        folders[1],
        { ...folders[2], views: [folders[2].views[1], folders[2].views[0]] },
      ]);
    });
  });
  describe('reorderArray', () => {
    const results = [
      [{ from: 0, to: 1 }, [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
      [{ from: 5, to: 3 }, [0, 1, 2, 5, 3, 4, 6, 7, 8, 9, 10, 11]],
      [{ from: 10, to: 4 }, [0, 1, 2, 3, 10, 4, 5, 6, 7, 8, 9, 11]],
    ];

    const initialArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    results.forEach(([args, expected], i) => {
      it(`should reorder array from ${args.from} to ${args.to} [${i}]`, () => {
        const result = reorderArray(initialArray, args.from, args.to);
        expect(result).toEqual(expected);
      });
    });
  });
});
