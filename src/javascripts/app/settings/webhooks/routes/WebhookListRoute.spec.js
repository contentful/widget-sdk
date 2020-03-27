import React from 'react';
import { render } from '@testing-library/react';

import WebhookListRoute from './WebhookListRoute';
import * as $stateMocked from 'ng/$state';
import * as AccessCheckerMocked from 'access_control/AccessChecker';

const mockWebhookRepo = {
  getAll: jest.fn().mockResolvedValue([]),
};

jest.mock('app/settings/webhooks/services/WebhookRepoInstance', () => ({
  getWebhookRepo: () => mockWebhookRepo,
}));

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: jest.fn(() => {}),
}));

jest.mock('app/common/ReloadNotification', () => ({
  basicErrorHandler: () => {},
}));

jest.mock('data/CMA/ProductCatalog', () => ({ getOrgFeature: () => Promise.resolve(false) }));

describe('WebhookListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    mockWebhookRepo.getAll.mockClear();
    AccessCheckerMocked.getSectionVisibility.mockReset();
  });

  const setSectionVisibility = (isVisible) => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ webhooks: isVisible }));
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setSectionVisibility(false);
    render(<WebhookListRoute />);
    expect($stateMocked.go).toHaveBeenCalledTimes(1);
    expect($stateMocked.go).toHaveBeenCalledWith(
      'spaces.detail.entries.list',
      undefined,
      undefined
    );
    expect(mockWebhookRepo.getAll).not.toHaveBeenCalled();
  });

  it('should show WebhookForbiddenPage if non-admin reaches page via deeplink templateId', () => {
    expect.assertions(3);
    setSectionVisibility(false);

    const { getByTestId } = render(<WebhookListRoute templateId="algolia-index-entries" />);

    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(mockWebhookRepo.getAll).not.toHaveBeenCalled();
    expect(getByTestId('webhooks.forbidden')).toBeInTheDocument();
  });

  it('should fetch webhooks if admin reaches that page', () => {
    expect.assertions(3);
    setSectionVisibility(true);
    const { queryByTestId } = render(<WebhookListRoute />);
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(mockWebhookRepo.getAll).toHaveBeenCalledTimes(1);
    expect(queryByTestId('webhooks.forbidden')).toBeNull();
  });
});
