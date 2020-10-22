import React from 'react';
import { render, wait, fireEvent, act } from '@testing-library/react';
import { upperFirst } from 'lodash';
import { BulkActionsRow } from './BulkActionsRow';
import * as batchPerformer from 'core/hooks/useBulkActions/batchPerformer';
import * as accessChecker from 'access_control/AccessChecker';
import { useFeatureFlagAddToRelease } from 'app/Releases/ReleasesFeatureFlag';

jest.mock('access_control/AccessChecker', () => {
  // Importing the default module here in order to not overwrite the whole
  // thing when mocking `getSectionVisibility`. Because SectionAccess relies on
  // other functions in this file.
  const AccessChecker = require.requireActual('access_control/AccessChecker');

  return {
    ...AccessChecker,
    canPerformActionOnEntity: jest.fn().mockReturnValue(true),
    shouldHide: jest.fn().mockReturnValue(false),
    shouldDisable: jest.fn().mockReturnValue(false),
    canUserReadEntities: jest.fn().mockReturnValue(true),
  };
});

jest.mock('core/hooks/useBulkActions/batchPerformer', () => ({
  createBatchPerformer: jest.fn(),
}));
jest.mock('core/NgRegistry', () => ({
  getModule: () => ({
    space: {
      data: {
        sys: {
          id: 'space-id',
        },
      },
      environment: {
        sys: {
          id: 'environment-id',
        },
      },
    },
    getData: () => {},
    getId: () => {},
    getEnvironmentId: () => {},
  }),
}));

jest.mock('app/Releases/releasesService', () => ({
  getReleases: jest.fn().mockResolvedValue({ items: [] }),
}));

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));

jest.mock('services/PubSubService', () => ({
  createPubSubClientForSpace: jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

jest.mock('app/Releases/ReleasesFeatureFlag', () => ({
  useFeatureFlagAddToRelease: jest.fn().mockReturnValue({ addToReleaseEnabled: true }),
}));

const performer = {
  archive: jest.fn().mockResolvedValue('success'),
  unarchive: jest.fn().mockResolvedValue('success'),
  delete: jest.fn().mockResolvedValue('success'),
  publish: jest.fn().mockResolvedValue('success'),
  unpublish: jest.fn().mockResolvedValue('success'),
  duplicate: jest.fn().mockResolvedValue('success'),
};
batchPerformer.createBatchPerformer.mockReturnValue(performer);

const simpleActions = ['duplicate', 'publish', 'unpublish', 'archive', 'unarchive'];

const generateEntities = (count, isPublished = true) => {
  const returnTrue = jest.fn().mockReturnValue(true);
  return Array.from(new Array(count), () => ({
    isPublished: jest.fn().mockReturnValue(isPublished),
    ...simpleActions.reduce(
      (acc, action) => ({
        ...acc,
        [`can${upperFirst(action)}`]: returnTrue,
      }),
      { canDelete: returnTrue }
    ),
  }));
};

const renderComponent = (props = {}) => {
  const onActionComplete = jest.fn();
  const entityType = props.entityType || 'entry';
  const selectedEntities = props.selectedEntities || [];
  const updateEntities = jest.fn().mockResolvedValue('updated');
  const result = render(
    <BulkActionsRow
      colSpan={1}
      entityType={entityType}
      onActionComplete={onActionComplete}
      updateEntities={updateEntities}
      selectedEntities={selectedEntities}
    />
  );

  return { updateEntities, onActionComplete, ...result };
};

describe('BulkActionsRow', () => {
  beforeEach(() => {
    accessChecker.canPerformActionOnEntity.mockReturnValue(true);
    accessChecker.shouldDisable.mockReturnValue(false);
    accessChecker.shouldHide.mockReturnValue(false);
    accessChecker.canUserReadEntities.mockReturnValue(true);
    useFeatureFlagAddToRelease.mockReturnValue({ addToReleaseEnabled: true });
  });

  it('should hide the component when nothing is selected', () => {
    const { container } = renderComponent();
    expect(container).toBeEmpty();
  });

  describe('Render selected message', () => {
    it('should show a message for selected entries in singular', () => {
      const { getByTestId } = renderComponent({ selectedEntities: generateEntities(1) });
      expect(getByTestId('label').innerHTML).toBe('1 entry selected:');
    });
    it('should show a message for selected entries in plural', () => {
      const count = 20;
      const { getByTestId } = renderComponent({ selectedEntities: generateEntities(count) });
      expect(getByTestId('label').innerHTML).toBe(`${count} entries selected:`);
    });
    it('should show a message for selected assets in singular', () => {
      const { getByTestId } = renderComponent({
        entityType: 'asset',
        selectedEntities: generateEntities(1),
      });
      expect(getByTestId('label').innerHTML).toBe('1 asset selected:');
    });
    it('should show a message for selected assets in plural', () => {
      const count = 5;
      const { getByTestId } = renderComponent({
        entityType: 'asset',
        selectedEntities: generateEntities(count),
      });
      expect(getByTestId('label').innerHTML).toBe(`${count} assets selected:`);
    });
  });

  describe('render action links', () => {
    it('should show all action links', async () => {
      const { getByTestId } = renderComponent({ selectedEntities: generateEntities(1, false) });
      expect(getByTestId('duplicate')).toBeInTheDocument();
      expect(getByTestId('archive')).toBeInTheDocument();
      expect(getByTestId('unarchive')).toBeInTheDocument();
      expect(getByTestId('publish')).toBeInTheDocument();
      expect(getByTestId('unpublish')).toBeInTheDocument();
      expect(getByTestId('delete')).toBeInTheDocument();
      expect(getByTestId('add to release')).toBeInTheDocument();
    });

    it('should show some action links', async () => {
      accessChecker.canPerformActionOnEntity.mockImplementation((action) => {
        return !['duplicate', 'unarchive', 'delete'].includes(action);
      });
      accessChecker.shouldHide.mockReturnValue(true);
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      await wait(); // for feature flag
      expect(queryByTestId('duplicate')).not.toBeInTheDocument();
      expect(getByTestId('archive')).toBeInTheDocument();
      expect(queryByTestId('unarchive')).not.toBeInTheDocument();
      expect(getByTestId('publish')).toBeInTheDocument();
      expect(getByTestId('unpublish')).toBeInTheDocument();
      expect(queryByTestId('delete')).not.toBeInTheDocument();
      expect(queryByTestId('add to release')).toBeInTheDocument();
    });

    it('should show add to release action when no other actions can be performed', async () => {
      accessChecker.canPerformActionOnEntity.mockReturnValue(false);
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
        entityType: 'asset',
      });
      expect(queryByTestId('duplicate')).not.toBeInTheDocument();
      expect(queryByTestId('archive')).not.toBeInTheDocument();
      expect(queryByTestId('unarchive')).not.toBeInTheDocument();
      expect(queryByTestId('publish')).not.toBeInTheDocument();
      expect(queryByTestId('unpublish')).not.toBeInTheDocument();
      expect(queryByTestId('delete')).not.toBeInTheDocument();
      expect(getByTestId('add to release')).toBeInTheDocument();
      expect(queryByTestId('no-actions-message')).not.toBeInTheDocument();
    });

    it('should hide all action links and show info message', async () => {
      accessChecker.canPerformActionOnEntity.mockReturnValue(false);
      accessChecker.canUserReadEntities.mockReturnValue(false);
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
        entityType: 'asset',
      });
      await wait(); // for feature flag
      expect(queryByTestId('duplicate')).not.toBeInTheDocument();
      expect(queryByTestId('archive')).not.toBeInTheDocument();
      expect(queryByTestId('unarchive')).not.toBeInTheDocument();
      expect(queryByTestId('publish')).not.toBeInTheDocument();
      expect(queryByTestId('unpublish')).not.toBeInTheDocument();
      expect(queryByTestId('delete')).not.toBeInTheDocument();
      expect(queryByTestId('add to release')).not.toBeInTheDocument();
      expect(getByTestId('no-actions-message')).toBeInTheDocument();
    });

    it('should not display the Add to release action when feature flag is disabled', async () => {
      useFeatureFlagAddToRelease.mockReturnValue({ addToReleaseEnabled: false });
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      expect(getByTestId('duplicate')).toBeInTheDocument();
      expect(getByTestId('archive')).toBeInTheDocument();
      expect(getByTestId('unarchive')).toBeInTheDocument();
      expect(getByTestId('publish')).toBeInTheDocument();
      expect(getByTestId('unpublish')).toBeInTheDocument();
      expect(getByTestId('delete')).toBeInTheDocument();
      expect(queryByTestId('add to release')).not.toBeInTheDocument();
    });

    it('should show the publish label', () => {
      const { getByTestId } = renderComponent({ selectedEntities: generateEntities(1, false) });
      const link = getByTestId('publish');
      expect(link).toBeInTheDocument();
      expect(link.firstChild.innerHTML).toBe('Publish');
    });

    it('should show the republish label', () => {
      const { getByTestId } = renderComponent({ selectedEntities: generateEntities(1) });
      const link = getByTestId('republish');
      expect(link).toBeInTheDocument();
      expect(link.firstChild.innerHTML).toBe('Republish');
    });

    it('should show the (re)publish label', () => {
      const selectedEntities = generateEntities(2);
      selectedEntities[1].isPublished = jest.fn().mockReturnValue(false);
      const { getByTestId } = renderComponent({ selectedEntities });
      const link = getByTestId('(re)publish');
      expect(link).toBeInTheDocument();
      expect(link.firstChild.innerHTML).toBe('(Re)publish');
    });
  });

  describe('use action links', () => {
    simpleActions.forEach((action) => {
      it(`should be able to click on ${action}`, async () => {
        const { getByTestId, onActionComplete } = renderComponent({
          selectedEntities: generateEntities(1, false),
        });
        const link = getByTestId(action);
        await act(() => {
          link.click();
        });
        await wait();
        expect(performer[action]).toHaveBeenCalledTimes(1);
        expect(onActionComplete).toHaveBeenCalledWith(action, 'success');
      });
    });

    it(`should be able to click delete after delete confirmation`, async () => {
      const { updateEntities, getByTestId, onActionComplete } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      const link = getByTestId('delete');
      await act(() => {
        link.click();
      });
      expect(performer.delete).not.toHaveBeenCalled();
      getByTestId('delete-entry-confirm').click();
      await wait();
      expect(performer.delete).toHaveBeenCalledTimes(1);
      expect(updateEntities).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith('delete', 'success');
    });

    it(`should be able to click archive after delete confirmation`, async () => {
      const { updateEntities, getByTestId, onActionComplete } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      const link = getByTestId('delete');
      await act(() => {
        link.click();
      });
      expect(performer.delete).not.toHaveBeenCalled();
      getByTestId('delete-entry-secondary').click();
      await wait();
      expect(performer.delete).not.toHaveBeenCalled();
      expect(performer.archive).toHaveBeenCalledTimes(1);
      expect(updateEntities).not.toHaveBeenCalled();
      expect(onActionComplete).toHaveBeenCalledWith('archive', 'success');
    });

    it(`should be able to cancel on delete confirmation`, async () => {
      const { updateEntities, getByTestId, onActionComplete } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      const link = getByTestId('delete');
      await act(() => {
        link.click();
      });
      expect(performer.delete).not.toHaveBeenCalled();
      getByTestId('delete-entry-cancel').click();
      expect(performer.delete).not.toHaveBeenCalled();
      expect(performer.archive).not.toHaveBeenCalled();
      expect(updateEntities).not.toHaveBeenCalled();
      expect(onActionComplete).not.toHaveBeenCalled();
    });

    it('should display the release modal when clicked on "Add to release" action', async () => {
      useFeatureFlagAddToRelease.mockReturnValue({ addToReleaseEnabled: true });

      const { getByTestId } = renderComponent({
        selectedEntities: generateEntities(5, false),
      });

      const link = getByTestId('add to release');

      await act(() => {
        fireEvent.click(link);
      });
      expect(getByTestId('content-release-modal')).toBeInTheDocument();
    });
  });
});
