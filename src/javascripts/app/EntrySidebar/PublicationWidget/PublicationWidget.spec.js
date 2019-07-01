import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import PublicationWidget from './PublicationWidget.es6';
import 'jest-dom/extend-expect';

const createCommand = props => ({
  isDisabled: () => false,
  isAvailable: () => true,
  inProgress: () => false,
  execute: () => {},
  ...props
});

const selectors = {
  statusState: renderResult => renderResult.getByTestId('entity-state'),
  stateText: renderResult => renderResult.container.querySelector('.entity-sidebar__state'),
  dateText: renderResult => renderResult.container.querySelector('.entity-sidebar__last-saved'),
  publishBtn: renderResult => renderResult.getByTestId('change-state-published'),
  secondaryArchiveBtn: renderResult => renderResult.getByTestId('change-state-archived'),
  secondaryDropdownTrigger: renderResult => renderResult.getByTestId('change-state-menu-trigger'),
  revertButton: renderResult => renderResult.getByTestId('discard-changed-button'),
  secondaryUnpublishBtn: renderResult => renderResult.getByTestId('change-state-draft'),
  actionRestrictionNote: renderResult => renderResult.getByTestId('action-restriction-note')
};

describe('app/EntrySidebar/PublicationWidget', () => {
  const renderWidget = props => {
    const renderResult = render(<PublicationWidget isSaving={false} {...props} />);
    return { renderResult };
  };

  afterEach(cleanup);

  it('shows proper buttons for "Draft" status', () => {
    const stubs = {
      onPublishClick: jest.fn()
    };
    const { renderResult } = renderWidget({
      status: 'draft',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isRestricted: () => false,
        label: 'Publish',
        targetStateId: 'published',
        execute: stubs.onPublishClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        })
      ]
    });

    expect(selectors.stateText(renderResult).textContent).toBe('Status: Draft');
    expect(selectors.dateText(renderResult).textContent).toBe('Last saved 01/14/2018');

    expect(selectors.publishBtn(renderResult)).toBeInTheDocument();
    expect(selectors.publishBtn(renderResult)).not.toBeDisabled();
    expect(selectors.publishBtn(renderResult).textContent).toBe('Publish');
    fireEvent.click(selectors.publishBtn(renderResult));
    expect(stubs.onPublishClick).toHaveBeenCalled();

    expect(renderResult.queryByTestId('discard-changed-button')).toBeNull();
    expect(renderResult.queryByTestId('change-state-archived')).toBeNull();

    fireEvent.click(selectors.secondaryDropdownTrigger(renderResult));

    expect(selectors.secondaryArchiveBtn(renderResult)).toBeInTheDocument();
    expect(selectors.secondaryArchiveBtn(renderResult)).not.toBeDisabled();
    expect(selectors.secondaryArchiveBtn(renderResult).textContent).toBe('Archive');
  });

  it('shows proper buttons for "Pending" status', () => {
    const stubs = {
      onPublishClick: jest.fn()
    };
    const { renderResult } = renderWidget({
      status: 'changes',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isRestricted: () => false,
        label: 'Publish changes',
        targetStateId: 'published',
        execute: stubs.onPublishClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        }),
        createCommand({
          label: 'Unpublish',
          targetStateId: 'draft'
        })
      ]
    });

    expect(selectors.stateText(renderResult).textContent).toBe(
      'Status: Published (pending changes)'
    );
    expect(selectors.dateText(renderResult).textContent).toBe('Last saved 01/14/2018');

    expect(selectors.publishBtn(renderResult)).toBeInTheDocument();
    expect(selectors.publishBtn(renderResult)).not.toBeDisabled();
    expect(selectors.publishBtn(renderResult).textContent).toBe('Publish changes');
    fireEvent.click(selectors.publishBtn(renderResult));
    expect(stubs.onPublishClick).toHaveBeenCalled();

    expect(renderResult.queryByTestId('change-state-archived')).toBeNull();
    expect(renderResult.queryByTestId('change-state-draft')).toBeNull();

    fireEvent.click(selectors.secondaryDropdownTrigger(renderResult));

    expect(selectors.secondaryArchiveBtn(renderResult)).toBeInTheDocument();
    expect(selectors.secondaryArchiveBtn(renderResult)).not.toBeDisabled();
    expect(selectors.secondaryArchiveBtn(renderResult).textContent).toBe('Archive');

    expect(selectors.secondaryUnpublishBtn(renderResult)).toBeInTheDocument();
    expect(selectors.secondaryUnpublishBtn(renderResult)).not.toBeDisabled();
    expect(selectors.secondaryUnpublishBtn(renderResult).textContent).toBe('Unpublish');
  });

  it('shows proper buttons for "Published" status', () => {
    const stubs = {
      revertOnClick: jest.fn()
    };
    const { renderResult } = renderWidget({
      status: 'published',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isAvailable: () => false,
        isRestricted: () => false
      }),
      revert: createCommand({
        isAvailable: () => true,
        execute: stubs.revertOnClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        }),
        createCommand({
          label: 'Unpublish',
          targetStateId: 'draft'
        })
      ]
    });

    expect(selectors.stateText(renderResult).textContent).toBe('Status: Published');
    expect(selectors.dateText(renderResult).textContent).toBe('Last saved 01/14/2018');

    expect(renderResult.queryByTestId('change-state-published')).toBeNull();

    expect(renderResult.queryByTestId('change-state-archived')).toBeNull();
    expect(renderResult.queryByTestId('change-state-draft')).toBeNull();

    expect(selectors.revertButton(renderResult)).toBeInTheDocument();
    fireEvent.click(selectors.revertButton(renderResult));
    expect(stubs.revertOnClick).toHaveBeenCalled();

    expect(selectors.secondaryDropdownTrigger(renderResult).textContent).toBe('Change status');
    fireEvent.click(selectors.secondaryDropdownTrigger(renderResult));

    expect(selectors.secondaryArchiveBtn(renderResult)).toBeInTheDocument();
    expect(selectors.secondaryArchiveBtn(renderResult)).not.toBeDisabled();
    expect(selectors.secondaryArchiveBtn(renderResult).textContent).toBe('Archive');

    expect(selectors.secondaryUnpublishBtn(renderResult)).toBeInTheDocument();
    expect(selectors.secondaryUnpublishBtn(renderResult)).not.toBeDisabled();

    expect(renderResult.queryByTestId('action-restriction-note')).toBeNull();

    expect(selectors.secondaryUnpublishBtn(renderResult).textContent).toBe('Unpublish');
  });

  it('shows the action restrtiction note for publish action', () => {
    const stubs = {
      onPublishClick: jest.fn()
    };
    const { renderResult } = renderWidget({
      status: 'draft',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isRestricted: () => true,
        isDisabled: () => true,
        label: 'Publish',
        targetStateId: 'published',
        execute: stubs.onPublishClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        })
      ]
    });

    expect(selectors.publishBtn(renderResult)).toBeInTheDocument();
    expect(selectors.publishBtn(renderResult)).toBeDisabled();
    expect(selectors.actionRestrictionNote(renderResult)).toBeInTheDocument();
    expect(selectors.actionRestrictionNote(renderResult).textContent).toBe(
      'You do not have permission to publish.'
    );
  });
});
