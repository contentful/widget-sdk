import React from 'react';
import Enzyme from 'enzyme';
import WebhookListRoute from './WebhookListRoute.es6';
import $stateMocked from '$state';
import spaceContextMocked from 'spaceContext';

jest.mock(
  'app/common/ReloadNotification.es6',
  () => ({
    basicErrorHandler: () => {}
  }),
  { virtual: true }
);

jest.mock(
  'data/OrganizationStatus.es6',
  () => ({
    __esModule: true, // needed for `default` export.
    default: () => Promise.resolve({ isEnterprise: false })
  }),
  { virtual: true }
);

describe('WebhookListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.getData.mockReset();
    spaceContextMocked.webhookRepo.getAll.mockClear();
    spaceContextMocked.publishedCTs.getAllBare.mockClear();
  });

  const setAdmin = isAdmin => {
    spaceContextMocked.getData.mockReturnValue(isAdmin);
  };

  const selectors = {
    forbiddenPage: '[data-test-id="webhooks.forbidden"]'
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setAdmin(false);
    Enzyme.mount(<WebhookListRoute />);
    expect($stateMocked.go).toHaveBeenCalledTimes(1);
    expect($stateMocked.go).toHaveBeenCalledWith(
      'spaces.detail.entries.list',
      undefined,
      undefined
    );
    expect(spaceContextMocked.webhookRepo.getAll).not.toHaveBeenCalled();
  });

  it('should show WebhookForbiddenPage if non-admin reaches page via deeplink templateId', () => {
    expect.assertions(3);
    setAdmin(false);

    const wrapper = Enzyme.mount(<WebhookListRoute templateId="algolia-index-entries" />);

    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(spaceContextMocked.webhookRepo.getAll).not.toHaveBeenCalled();
    expect(wrapper.find(selectors.forbiddenPage)).toExist();
  });

  it('should fetch webhooks if admin reaches that page', () => {
    expect.assertions(3);
    setAdmin(true);
    const wrapper = Enzyme.mount(<WebhookListRoute />);
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(spaceContextMocked.webhookRepo.getAll).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
