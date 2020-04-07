import React from 'react';
import { render, wait } from '@testing-library/react';
import { upperFirst } from 'lodash';
import BulkActionsRow from './BulkActionsRow';
import * as batchPerformer from 'services/batchPerformer';
import * as accessChecker from 'access_control/AccessChecker';

jest.mock('access_control/AccessChecker', () => ({
  canPerformActionOnEntity: jest.fn().mockReturnValue(true),
  shouldHide: jest.fn().mockReturnValue(false),
  shouldDisable: jest.fn().mockReturnValue(false),
}));
jest.mock('services/batchPerformer', () => ({
  createBatchPerformer: jest.fn(),
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
      accessChecker.canPerformActionOnEntity.mockImplementation((action) => {
        return !['duplicate', 'unarchive', 'delete'].includes(action);
      });
      accessChecker.shouldHide.mockReturnValue(true);
      const { getByTestId, queryByTestId } = renderComponent({
        selectedEntities: generateEntities(1, false),
      });
      expect(queryByTestId('duplicate')).not.toBeInTheDocument();
      expect(getByTestId('archive')).toBeInTheDocument();
      expect(queryByTestId('unarchive')).not.toBeInTheDocument();
      expect(getByTestId('publish')).toBeInTheDocument();
      expect(getByTestId('unpublish')).toBeInTheDocument();
      expect(queryByTestId('delete')).not.toBeInTheDocument();
    });

    it('should hide all action links and show info message', () => {
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
    simpleActions.forEach((action) => {
      it(`should be able to click on ${action}`, async () => {
        const { getByTestId, onActionComplete } = renderComponent({
          selectedEntities: generateEntities(1, false),
        });
        const link = getByTestId(action);
        link.click();
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
      link.click();
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
      link.click();
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
      link.click();
      expect(performer.delete).not.toHaveBeenCalled();
      getByTestId('delete-entry-cancel').click();
      expect(performer.delete).not.toHaveBeenCalled();
      expect(performer.archive).not.toHaveBeenCalled();
      expect(updateEntities).not.toHaveBeenCalled();
      expect(onActionComplete).not.toHaveBeenCalled();
    });
  });
});
