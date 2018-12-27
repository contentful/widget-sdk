import React from 'react';
import Enzyme from 'enzyme';
import ExtensionsListRoute from './ExtensionsListRoute.es6';
import spaceContextMocked from 'ng/spaceContext';
import $stateMocked from 'ng/$state';

describe('ExtensionsListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.widgets.refresh.mockClear();
    spaceContextMocked.getData.mockReset();
  });

  const setAdmin = isAdmin => {
    spaceContextMocked.getData.mockImplementation(name => {
      if (name === 'spaceMembership.admin') {
        return isAdmin;
      }
    });
  };

  const selectors = {
    forbiddenPage: '[data-test-id="extensions.forbidden"]'
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setAdmin(false);
    Enzyme.mount(<ExtensionsListRoute />);
    expect($stateMocked.go).toHaveBeenCalledTimes(1);
    expect($stateMocked.go).toHaveBeenCalledWith(
      'spaces.detail.entries.list',
      undefined,
      undefined
    );
    expect(spaceContextMocked.widgets.refresh).not.toHaveBeenCalled();
  });

  it('should show ExtensionsForbiddenPage if non-admin reaches page via deeplink extensionUrl', () => {
    expect.assertions(4);
    setAdmin(false);
    const wrapper = Enzyme.mount(
      <ExtensionsListRoute extensionUrl="https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json" />
    );
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(spaceContextMocked.widgets.refresh).not.toHaveBeenCalled();
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
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(spaceContextMocked.widgets.refresh).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
