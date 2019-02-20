import React from 'react';
import Enzyme from 'enzyme';
import WalkthroughWidget from './WalkthroughWidget.es6.js';

const waitToUpdate = async wrapper => {
  await Promise.resolve();
  await wrapper.update();
};

jest.mock('utils/StatePersistenceApi.es6', () => ({
  fetchUserState: () =>
    Promise.resolve({ started: undefined, dismissed: undefined, sys: { version: 1 } }),
  updateUserState: (_, { version }) => Promise.resolve({ sys: version + 1 })
}));

jest.mock('NgRegistry.es6', () => ({
  getModule: () => ({ current: { name: 'name' } })
}));

describe('WalkthroughWidget', () => {
  const props = {
    spaceName: 'spaceName',
    setWalkthroughState: () => {}
  };

  const wrapper = Enzyme.mount(<WalkthroughWidget {...props} />);

  it('should render spinner while initial data is fetching', () => {
    expect(wrapper.find('.space-home-spinner')).toHaveLength(1);
  });

  it('should render "Start" button after initial fetch', async () => {
    await waitToUpdate(wrapper);
    expect(wrapper.find('[testId="start-walkthrough-button"]')).toHaveLength(1);
  });

  it('should start tour on "Start" button click', async () => {
    await waitToUpdate(wrapper);
    wrapper.find('[testId="start-walkthrough-button"]').simulate('click');
    // because ReactJoyride uses Portal, we simulate event that would be triggered by ReactJoyride
    // src/javascripts/app/home/widgets/walkthrough/WalkthroughComponent.es6.js:35
    expect(wrapper.state('isTourRunning')).toEqual(true);
    await wrapper.instance().updateWalkthroughState({ started: true, dismissed: false });
    await waitToUpdate(wrapper);
    expect(wrapper.find('[testId="relaunch-walkthrough-button"]')).toHaveLength(1);
    expect(wrapper.find('[testId="dismiss-walkthrough-button"]')).toHaveLength(1);
  });

  it('should render first step tooltip on "Relaunch tour" button click', () => {
    wrapper.find('[testId="relaunch-walkthrough-button"]').simulate('click');
    expect(wrapper.state('isTourRunning')).toEqual(true);
  });

  it('should hide "Relaunch tour" on "Dismiss tour " button click', async () => {
    wrapper.find('[testId="dismiss-walkthrough-button"]').simulate('click');
    await waitToUpdate(wrapper);
    expect(wrapper.find('[testId="relaunch-walkthrough-button"]')).toHaveLength(0);
    expect(wrapper.find('[testId="dismiss-walkthrough-button"]')).toHaveLength(0);
  });
});
