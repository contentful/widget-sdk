import React from 'react';
import _ from 'lodash';
import sinon from 'npm:sinon';
import CreateEntryButton from 'components/CreateEntryButton';

import { mount } from 'enzyme';

const sel = id => `[data-test-id="${id}"]`;

const findCta = wrapper => wrapper.find(sel('cta'));
const findMenu = wrapper => wrapper.find(sel('add-entry-menu'));
const findDropdownIcon = wrapper => wrapper.find(sel('dropdown-icon'));

describe('CreateEntryButton', () => {
  describe('with multiple content types', () => {
    let wrapper;

    beforeEach(() => {
      const props = {
        contentTypes: [
          { name: 'name-1', sys: { id: '1' } },
          { name: 'name-2', sys: { id: '2' } }
        ],
        onSelect: _.noop,
        text: 'Add entry'
      };
      wrapper = mount(<CreateEntryButton {...props} />);
    });

    afterEach(() => {
      wrapper = null;
    });

    it('renders the trigger button', () => {
      expect(findCta(wrapper).length).toEqual(1);
      expect(findMenu(wrapper).length).toEqual(0);
    });

    it('opens menu after click on btn', () => {
      findCta(wrapper).simulate('click');
      expect(findMenu(wrapper).length).toEqual(1);
    });

    it('hides menu after second click on btn', () => {
      findCta(wrapper).simulate('click');
      expect(findMenu(wrapper).length).toEqual(1);
      findCta(wrapper).simulate('click');
      expect(findMenu(wrapper).length).toEqual(0);
    });
  });

  describe('with single content type', () => {
    let wrapper, onSelect;

    beforeEach(() => {
      onSelect = sinon.spy();
      const props = {
        contentTypes: [{ name: 'name-1', sys: { id: '1' } }],
        onSelect,
        text: 'Add entry'
      };
      wrapper = mount(<CreateEntryButton {...props} />);
    });

    afterEach(() => {
      wrapper = null;
      onSelect = null;
    });

    it('renders the trigger button', () => {
      expect(findCta(wrapper).length).toEqual(1);
      expect(findDropdownIcon(wrapper).length).toEqual(0);
      expect(findCta(wrapper).text()).toEqual('Add entry');
      expect(findMenu(wrapper).length).toEqual(0);
    });

    it('emits onSelect after clicking on cta', () => {
      findCta(wrapper).simulate('click');
      sinon.assert.calledWith(onSelect, '1');
    });
  });
});
