import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import WebhookListRoute from './WebhookListRoute.es6';
import * as $stateMocked from 'ng/$state';
import * as AccessCheckerMocked from 'access_control/AccessChecker/index.es6';

const mockWebhookRepo = {
  getAll: jest.fn().mockResolvedValue([])
};

jest.mock(
  'app/settings/webhooks/services/WebhookRepoInstance',
  () => ({
    getWebhookRepo: () => mockWebhookRepo
  }),
  { virtual: true }
);

jest.mock(
  'access_control/AccessChecker/index.es6',
  () => ({
    getSectionVisibility: jest.fn(() => {})
  }),
  { virtual: true }
);

jest.mock(
  'app/common/ReloadNotification.es6',
  () => ({
    basicErrorHandler: () => {}
  }),
  { virtual: true }
);

jest.mock('data/CMA/ProductCatalog.es6', () => ({ getOrgFeature: () => Promise.resolve(false) }));

describe('WebhookListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    mockWebhookRepo.getAll.mockClear();
    AccessCheckerMocked.getSectionVisibility.mockReset();
  });

  afterEach(cleanup);

  const setSectionVisibility = isVisible => {
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