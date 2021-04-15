import React from 'react';
import { render } from '@testing-library/react';

import { WebhookListRoute } from './WebhookListRoute';
import * as $stateMocked from 'ng/$state';
import * as AccessCheckerMocked from 'access_control/AccessChecker';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { MemoryRouter } from 'react-router';

const mockWebhookRepo = {
  getAll: jest.fn().mockResolvedValue([]),
};

jest.mock('../services/WebhookRepoInstance', () => ({
  getWebhookRepo: () => mockWebhookRepo,
}));

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: jest.fn(() => {}),
}));

jest.mock('app/common/ReloadNotification', () => ({
  basicErrorHandler: () => {},
}));

jest.mock('data/CMA/ProductCatalog', () => ({ getOrgFeature: () => Promise.resolve(false) }));

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn().mockReturnValue({
    email: 'test@contentful.com',
  }),
}));

const build = (props = {}) => {
  return render(
    <SpaceEnvContext.Provider
      value={{
        currentSpace: {},
        currentSpaceId: 'space-id',
        currentOrganizationId: 'organization-id',
      }}>
      <MemoryRouter initialEntries={[{ pathname: '/', state: props }]}>
        <WebhookListRoute {...props} />
      </MemoryRouter>
    </SpaceEnvContext.Provider>
  );
};

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
    build();
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

    const { getByTestId } = build({ templateId: 'algolia-index-entries' });

    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(mockWebhookRepo.getAll).not.toHaveBeenCalled();
    expect(getByTestId('webhooks.forbidden')).toBeInTheDocument();
  });

  it('should fetch webhooks if admin reaches that page', () => {
    expect.assertions(3);
    setSectionVisibility(true);
    const { queryByTestId } = build();
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(mockWebhookRepo.getAll).toHaveBeenCalledTimes(1);
    expect(queryByTestId('webhooks.forbidden')).toBeNull();
  });
});
