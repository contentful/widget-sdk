import { createElement as h } from 'libs/react';
import CreateEntryButton, { Button as TriggerButton } from 'components/tabs/entry_list/CreateEntryButton';
import Menu from 'components/tabs/entry_list/CreateEntryButton/Menu';
import { mount } from 'libs/enzyme';

describe('CreateEntryButton', () => {
  let wrapper;

  beforeEach(() => {
    const props = {
      contentTypes: [],
      text: 'Add entry'
    };
    wrapper = mount(h(CreateEntryButton, props));
  });

  afterEach(() => {
    wrapper = null;
  });

  it('renders the trigger button', () => {
    expect(wrapper.find(TriggerButton).length).toEqual(1);
    expect(wrapper.find(Menu).length).toEqual(0);
  });

  it('opens menu after click on btn', () => {
    wrapper.find(TriggerButton).simulate('click');
    expect(wrapper.find(Menu).length).toEqual(1);
  });

  it('hides menu after second click on btn', () => {
    wrapper.find(TriggerButton).simulate('click');
    expect(wrapper.find(Menu).length).toEqual(1);
    wrapper.find(TriggerButton).simulate('click');
    expect(wrapper.find(Menu).length).toEqual(0);
  });
});
