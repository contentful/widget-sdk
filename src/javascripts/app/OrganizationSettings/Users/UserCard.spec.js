import React from 'react';
import { mount } from 'enzyme';
import UserCard from './UserCard';
import { Tag, Heading } from '@contentful/forma-36-react-components';

const renderComponent = (user, hasPendingOrgMembershipsEnabled, status) => {
  const wrapper = mount(
    <UserCard
      user={user}
      status={status}
      hasPendingOrgMembershipsEnabled={hasPendingOrgMembershipsEnabled}
    />
  );
  return { wrapper };
};

const user = {
  firstName: 'User',
  lastName: 'Test',
  email: 'user.test@contentful.com',
  avatarUrl: '/testAvatar'
};

describe('UserCard', () => {
  describe('organization has pending memberships enabled', () => {
    it('status is undefined, no INVITED tag present', () => {
      const { wrapper } = renderComponent(user, true);

      const userNameAndStatus = wrapper.find(Heading).filter({ testId: 'user-name-status' });
      expect(userNameAndStatus).toHaveLength(1);
      expect(userNameAndStatus.find(Tag).filter({ testId: 'invited-status' })).toHaveLength(0);
    });

    it('status is active, no INVITED tag present', () => {
      const { wrapper } = renderComponent(user, true, 'active');

      const userNameAndStatus = wrapper.find(Heading).filter({ testId: 'user-name-status' });
      expect(userNameAndStatus).toHaveLength(1);
      expect(userNameAndStatus.find(Tag).filter({ testId: 'invited-status' })).toHaveLength(0);
    });

    it('status is pending, first and last name with INVITED tag', () => {
      const { wrapper } = renderComponent(user, true, 'pending');

      const userNameAndStatus = wrapper.find(Heading).filter({ testId: 'user-name-status' });
      expect(userNameAndStatus).toHaveLength(1);
      expect(userNameAndStatus.find(Tag).filter({ testId: 'invited-status' })).toHaveLength(1);
    });
  });

  describe('organization does not have pending memberships enabled', () => {
    it('status is undefined, no INVITED tag present', () => {
      const { wrapper } = renderComponent(user, false);

      const userNameAndStatus = wrapper.find(Heading).filter({ testId: 'user-name-status' });
      expect(userNameAndStatus).toHaveLength(1);
      expect(userNameAndStatus.find(Tag).filter({ testId: 'invited-status' })).toHaveLength(0);
    });

    it('first name not defined, INVITED tag present', () => {
      const user = {
        email: 'user.test@contentful.com',
        avatarUrl: '/testAvatar'
      };

      const { wrapper } = renderComponent(user, false);

      const userNameAndStatus = wrapper.find(Heading).filter({ testId: 'user-name-status' });
      expect(userNameAndStatus).toHaveLength(1);
      expect(userNameAndStatus.find(Tag).filter({ testId: 'invited-status' })).toHaveLength(1);
    });
  });
});
