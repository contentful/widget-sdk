import React from 'react';
import { render, wait } from '@testing-library/react';
import BulkActionsRow from './BulkActionsRow';

const generateEntities = (count, isPublished = true) => {
  return Array.from(new Array(count), () => ({
    isPublished: jest.fn().mockReturnValue(isPublished),
  }));
};

const renderComponent = (props = {}) => {
  const actions = {
    showDuplicate: jest.fn().mockReturnValue(true),
    duplicateSelected: jest.fn().mockResolvedValue('success'),
    showArchive: jest.fn().mockReturnValue(true),
    archiveSelected: jest.fn().mockResolvedValue('success'),
    showUnarchive: jest.fn().mockReturnValue(true),
    unarchiveSelected: jest.fn().mockResolvedValue('success'),
    showDelete: jest.fn().mockReturnValue(true),
    deleteSelected: jest.fn().mockResolvedValue('success'),
    showPublish: jest.fn().mockReturnValue(true),
    publishSelected: jest.fn().mockResolvedValue('success'),
    showUnpublish: jest.fn().mockReturnValue(true),
    unpublishSelected: jest.fn().mockResolvedValue('success'),
    ...props.actions,
  };
  const onActionComplete = jest.fn();
  const entityType = props.entityType || 'entry';
  const selectedEntities = props.selectedEntities || [];
  const result = render(
    <BulkActionsRow
      colSpan={1}
      actions={actions}
      entityType={entityType}
      onActionComplete={onActionComplete}
      selectedEntities={selectedEntities}
    />
  );

  return { actions, onActionComplete, ...result };
};

describe('BulkActionsRow', () => {
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
    it('should show all action links', () => {
      const { getByTestId } = renderComponent({ selectedEntities: generateEntities(1, false) });
      expect(getByTestId('duplicate')).toBeInTheDocument();
      expect(getByTestId('archive')).toBeInTheDocument();
      expect(getByTestId('unarchive')).toBeInTheDocument();
      expect(getByTestId('publish')).toBeInTheDocument();
      expect(getByTestId('unpublish')).toBeInTheDocument();
      expect(getByTestId('delete')).toBeInTheDocument();
    });

    it('should show some action links', () => {
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
        actions: {
          showDuplicate: jest.fn().mockReturnValue(false),
          showUnarchive: jest.fn().mockReturnValue(false),
          showDelete: jest.fn().mockReturnValue(false),
        },
      });
      expect(queryByTestId('duplicate')).not.toBeInTheDocument();
      expect(getByTestId('archive')).toBeInTheDocument();
      expect(queryByTestId('unarchive')).not.toBeInTheDocument();
      expect(getByTestId('publish')).toBeInTheDocument();
      expect(getByTestId('unpublish')).toBeInTheDocument();
      expect(queryByTestId('delete')).not.toBeInTheDocument();
    });

    it('should hide all action links and show info message', () => {
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
        actions: {
          showDuplicate: jest.fn().mockReturnValue(false),
          showArchive: jest.fn().mockReturnValue(false),
          showUnarchive: jest.fn().mockReturnValue(false),
          showDelete: jest.fn().mockReturnValue(false),
          showPublish: jest.fn().mockReturnValue(false),
          showUnpublish: jest.fn().mockReturnValue(false),
        },
      });
      expect(queryByTestId('duplicate')).not.toBeInTheDocument();
      expect(queryByTestId('archive')).not.toBeInTheDocument();
      expect(queryByTestId('unarchive')).not.toBeInTheDocument();
      expect(queryByTestId('publish')).not.toBeInTheDocument();
      expect(queryByTestId('unpublish')).not.toBeInTheDocument();
      expect(queryByTestId('delete')).not.toBeInTheDocument();
      expect(getByTestId('no-actions-message')).toBeInTheDocument();
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
    const simpleActions = ['duplicate', 'publish', 'unpublish', 'archive', 'unarchive'];
    simpleActions.forEach((action) => {
      it(`should be able to click on ${action}`, async () => {
        const { getByTestId, actions, onActionComplete } = renderComponent({
          selectedEntities: generateEntities(1, false),
        });
        const link = getByTestId(action);
        link.click();
        await wait();
        expect(actions[`${action}Selected`]).toHaveBeenCalledTimes(1);
        expect(onActionComplete).toHaveBeenCalledWith(action, 'success');
      });
    });

    it(`should be able to click delete after delete confirmation`, async () => {
      const { getByTestId, actions, onActionComplete } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      const link = getByTestId('delete');
      link.click();
      expect(actions.deleteSelected).not.toHaveBeenCalled();
      getByTestId('delete-entry-confirm').click();
      await wait();
      expect(actions.deleteSelected).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith('delete', 'success');
    });

    it(`should be able to click archive after delete confirmation`, async () => {
      const { getByTestId, actions, onActionComplete } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      const link = getByTestId('delete');
      link.click();
      expect(actions.deleteSelected).not.toHaveBeenCalled();
      getByTestId('delete-entry-secondary').click();
      await wait();
      expect(actions.deleteSelected).not.toHaveBeenCalled();
      expect(actions.archiveSelected).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith('archive', 'success');
    });

    it(`should be able to cancel on delete confirmation`, async () => {
      const { getByTestId, actions, onActionComplete } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      const link = getByTestId('delete');
      link.click();
      expect(actions.deleteSelected).not.toHaveBeenCalled();
      getByTestId('delete-entry-cancel').click();
      expect(actions.deleteSelected).not.toHaveBeenCalled();
      expect(actions.archiveSelected).not.toHaveBeenCalled();
      expect(onActionComplete).not.toHaveBeenCalled();
    });
  });
});
