import React from 'react';
import Enzyme from 'enzyme';
import spaceContext from 'spaceContext';
import ExtensionsListRoute from './ExtensionsListRoute.es6';
import sinon from 'sinon';
import $state from '$state';

describe('ExtensionsListRoute', () => {
  beforeEach(() => {
    $state.go.resetHistory();
    spaceContext.widgets.refresh.resetHistory();
    spaceContext.getData.reset();
  });

  const setAdmin = isAdmin => {
    spaceContext.getData = sinon
      .stub()
      .withArgs(['spaceMembership.admin'])
      .returns(isAdmin);
  };

  const selectors = {
    forbiddenPage: '[data-test-id="extensions.forbidden"]'
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setAdmin(false);
    Enzyme.mount(<ExtensionsListRoute />);
    expect($state.go.calledOnce).toBeTruthy();
    expect($state.go.calledWith('spaces.detail.entries.list')).toBeTruthy();
    expect(spaceContext.widgets.refresh.called).toBeFalsy();
  });

  it('should show ExtensionsForbiddenPage if non-admin reaches page via deeplink extensionUrl', () => {
    expect.assertions(4);
    setAdmin(false);
    const wrapper = Enzyme.mount(
      <ExtensionsListRoute extensionUrl="https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json" />
    );
    expect($state.go.called).toBeFalsy();
    expect(spaceContext.widgets.refresh.called).toBeFalsy();
    expect(wrapper.find(selectors.forbiddenPage)).toExist();

    expect(
      wrapper
        .find('.workbench-forbidden__message')
        .last()
        .text()
    ).toEqual(
      'Share this URL with your admin so they can install it for you.https://app.contentful.com/deeplink?link=install-extension&url=https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json'
    );
  });

  it('should fetch extensions if admin reaches that page', () => {
    expect.assertions(3);
    setAdmin(true);
    const wrapper = Enzyme.mount(<ExtensionsListRoute />);
    expect($state.go.called).toBeFalsy();
    expect(spaceContext.widgets.refresh.called).toBeTruthy();
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
