import React from 'react';
import Enzyme from 'enzyme';
import Welcome from './Welcome.es6';
import Icon from 'ui/Components/Icon.es6';
import moment from 'moment';

jest.mock('moment');

describe('Space home Welcome react component', () => {
  const mount = (props = {}) => Enzyme.shallow(<Welcome {...props} />);

  moment.mockReturnValue({
    hour: jest.fn().mockReturnValue(11)
  });

  describe('when no user', () => {
    it('should match snapshot', () => {
      const wrapper = mount();
      expect(wrapper).toMatchSnapshot();
    });

    it('should render a greeting, a link to SDK docs and an image', () => {
      const wrapper = mount();
      expect(wrapper.find('[data-test-id="greeting"]')).toHaveLength(1);
      expect(wrapper.find('[data-test-id="link-to-sdk-and-tools-section"]')).toHaveLength(1);
      expect(wrapper.find(Icon)).toHaveLength(1);
      expect(wrapper.find('[data-test-id="new-user-msg"]')).toHaveLength(0);
      expect(wrapper.find('[data-test-id="old-user-msg"]')).toHaveLength(0);
    });
  });

  describe('when old user', () => {
    it('should match snapshot', () => {
      const wrapper = mount({ user: { firstName: 'Test', signInCount: 2 } });
      expect(wrapper).toMatchSnapshot();
    });

    it('should render a greeting, a message for old user, link to SDK docs and an image', () => {
      const wrapper = mount({ user: { firstName: 'Test', signInCount: 2 } });
      expect(wrapper.find('[data-test-id="greeting"]')).toHaveLength(1);
      expect(wrapper.find('[data-test-id="link-to-sdk-and-tools-section"]')).toHaveLength(1);
      expect(wrapper.find('[data-test-id="old-user-msg"]')).toHaveLength(1);
      expect(wrapper.find(Icon)).toHaveLength(1);
      expect(wrapper.find('[data-test-id="new-user-msg"]')).toHaveLength(0);
    });
  });

  describe('when new user', () => {
    it('should match snapshot', () => {
      const wrapper = mount({ user: { firstName: 'Test', signInCount: 1 } });
      expect(wrapper).toMatchSnapshot();
    });

    it('should render a greeting, a message for new user, link to SDK docs and an image', () => {
      const wrapper = mount({ user: { firstName: 'Test', signInCount: 1 } });
      expect(wrapper.find('[data-test-id="greeting"]')).toHaveLength(1);
      expect(wrapper.find('[data-test-id="link-to-sdk-and-tools-section"]')).toHaveLength(1);
      expect(wrapper.find('[data-test-id="new-user-msg"]')).toHaveLength(1);
      expect(wrapper.find(Icon)).toHaveLength(1);
      expect(wrapper.find('[data-test-id="old-user-msg"]')).toHaveLength(0);
    });
  });
});
