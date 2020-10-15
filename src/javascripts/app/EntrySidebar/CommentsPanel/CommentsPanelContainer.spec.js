import React from 'react';

import CommentsPanelContainer from './CommentsPanelContainer';
import { waitFor, render } from '@testing-library/react';

// TODO: find a better way to avoid the ng dependencies
jest.mock('services/TokenStore', () => ({ getUserSync: jest.fn() }));
jest.mock('access_control/OrganizationMembershipRepository', () => {});
jest.mock('data/CMA/CommentsRepo', () => ({
  getAllForEntry: jest.fn().mockResolvedValue({ items: [1, 2] }),
}));

describe('CommentsPanelContainer', () => {
  let component;
  let onCommentsCountUpdate;
  const entryId = 'entry-id';
  const renderComponent = () => {
    onCommentsCountUpdate = jest.fn();
    return render(
      <CommentsPanelContainer
        onCommentsCountUpdate={onCommentsCountUpdate}
        entryId={entryId}
        isVisible={false}
      />
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
    component = renderComponent();
  });

  it('initializes the comments count', async () => {
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(onCommentsCountUpdate).toHaveBeenLastCalledWith(2);
      expect(onCommentsCountUpdate).toHaveBeenCalledTimes(1);
    });
    expect(component.queryByTestId('comments')).not.toBeInTheDocument();
  });

  it('initializes the visible component', async () => {
    component.rerender(
      <CommentsPanelContainer
        onCommentsCountUpdate={onCommentsCountUpdate}
        entryId={entryId}
        isVisible
      />
    );
    await waitFor(() => {
      expect(component.queryByTestId('comments')).toBeInTheDocument();
    });
  });
});
