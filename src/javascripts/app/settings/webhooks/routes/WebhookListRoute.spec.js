import React from 'react';
import Enzyme from 'enzyme';
import WebhookListRoute from './WebhookListRoute.es6';
import sinon from 'sinon';
import $state from '$state';
import spaceContext from 'spaceContext';

jest.mock(
  'data/isEnterprise.es6',
  () => ({
    isEnterpriseV2: () => Promise.resolve(false)
  }),
  { virtual: true }
);

describe('WebhookListRoute', () => {
  beforeEach(() => {
    $state.go.resetHistory();
    spaceContext.getData.reset();
    spaceContext.webhookRepo.getAll.resetHistory();
    spaceContext.publishedCTs.getAllBare.resetHistory();
  });

  const setAdmin = isAdmin => {
    spaceContext.getData = sinon
      .stub()
      .withArgs(['spaceMembership.admin'])
      .returns(isAdmin);
  };

  const selectors = {
    forbiddenPage: '[data-test-id="webhooks.forbidden"]'
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setAdmin(false);
    Enzyme.mount(<WebhookListRoute />);
    expect($state.go.calledOnce).toBeTruthy();
    expect($state.go.calledWith('spaces.detail.entries.list')).toBeTruthy();
    expect(spaceContext.webhookRepo.getAll.called).toBeFalsy();
  });

  it('should show WebhookForbiddenPage if non-admin reaches page via deeplink templateId', () => {
    expect.assertions(3);
    setAdmin(false);

    const wrapper = Enzyme.mount(<WebhookListRoute templateId="algolia-index-entries" />);

    expect($state.go.called).toBeFalsy();
    expect(spaceContext.webhookRepo.getAll.called).toBeFalsy();
    expect(wrapper.find(selectors.forbiddenPage)).toExist();
  });

  it('should fetch webhooks if admin reaches that page', () => {
    expect.assertions(3);
    setAdmin(true);
    const wrapper = Enzyme.mount(<WebhookListRoute />);
    expect($state.go.called).toBeFalsy();
    expect(spaceContext.webhookRepo.getAll.calledOnce).toBeTruthy();
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
