import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import spaceContext from 'spaceContext';
import AdminOnly from '../AdminOnly.es6';
import $state from '$state';

describe('AdminOnly', () => {
  beforeEach(() => {
    $state.go.resetHistory();
    spaceContext.getData.reset();
  });

  const setAdmin = isAdmin => {
    spaceContext.getData = sinon
      .stub()
      .withArgs('spaceMembership.admin', false)
      .returns(isAdmin);
  };

  describe('if isAdmin is true', () => {
    it('should render children', () => {
      expect.assertions(1);
      setAdmin(true);
      const wrapper = Enzyme.mount(
        <AdminOnly>
          <div data-test-id="visible-only-for-admin">This is visible only for admins</div>
        </AdminOnly>
      );
      expect(wrapper).toHaveText('This is visible only for admins');
    });
  });

  describe('if isAdmin is false', () => {
    it('should render StateRedirect', () => {
      expect.assertions(2);
      setAdmin(false);
      const wrapper = Enzyme.mount(
        <AdminOnly>
          <div>This is visible only for admins</div>
        </AdminOnly>
      );
      expect(wrapper).not.toHaveText('This is visible only for admins');
      expect($state.go.calledWith('spaces.detail.entries.list')).toBeTruthy();
    });

    it('should render StateRedirect with custom "to" if "redirect" is passed', () => {
      expect.assertions(2);
      setAdmin(false);
      const wrapper = Enzyme.mount(
        <AdminOnly redirect="^.home">
          <div>This is visible only for admins</div>
        </AdminOnly>
      );
      expect(wrapper).not.toHaveText('This is visible only for admins');
      expect($state.go.calledWith('^.home')).toBeTruthy();
    });

    it('can use conditional rendering for more complex scenarios', () => {
      expect.assertions(3);
      setAdmin(false);
      const wrapper = Enzyme.mount(
        <AdminOnly render={() => <div>You have no access to see this page</div>}>
          <div>This is visible only for admins</div>
        </AdminOnly>
      );
      expect(wrapper).not.toHaveText('This is visible only for admins');
      expect(wrapper).toHaveText('You have no access to see this page');
      expect($state.go.called).toBeFalsy();
    });
  });
});
