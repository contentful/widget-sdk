import React from 'react';
import sinon from 'npm:sinon';
import CreateEntryButton from 'components/CreateEntryButton';

import { mount } from 'enzyme';

const CONTENT_TYPE_1 = { name: 'name-1', sys: { id: 'ID_1' } };
const CONTENT_TYPE_2 = { name: 'name-2', sys: { id: 'ID_2' } };
const CONTENT_TYPE_3 = { name: 'name-3', sys: { id: 'ID_3' } };

describe('CreateEntryButton', () => {
  beforeEach(function () {
    const findByTestId = (id) => this.wrapper.find(`[data-test-id="${id}"]`);
    this.findCta = () => findByTestId('cta');
    this.findMenu = () => findByTestId('add-entry-menu');
    this.findMenuItems = () => findByTestId('contentType');
    this.findDropdownIcon = () => findByTestId('dropdown-icon');
    this.setup = () => {
      this.wrapper = mount(<CreateEntryButton {...this.props} />);
      return {
        cta: this.findCta(),
        menu: this.findMenu(),
        dropdownIcon: this.findDropdownIcon()
      };
    };
  });

  describe('with multiple content types', function () {
    beforeEach(function () {
      this.onSelect = sinon.spy();
      this.props = {
        contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
        onSelect: this.onSelect
      };
    });

    itRendersTriggerButtonWithLabel('Add entry');

    itRendersDropdownIs(true);

    describe('menu', function () {
      it('opens after click on btn', function ({ cta }) {
        cta.simulate('click');
        expect(this.findMenu().length).toEqual(1);
      });

      it('hides after second click on btn', function ({ cta }) {
        cta.simulate('click');
        cta.simulate('click');
        expect(this.findMenu().length).toEqual(0);
      });

      it('has one item for each content type', function ({ cta }) {
        cta.simulate('click');
        expect(this.findMenuItems().length).toBe(3);
      });

      it('emits onSelect after click on menu item', function ({ cta }) {
        cta.simulate('click');
        this.findMenuItems().at(1).simulate('click');
        sinon.assert.calledWith(this.onSelect, 'ID_2');
      });
    });
  });

  describe('with single content type', function () {
    beforeEach(function () {
      this.onSelect = sinon.spy();
      this.props = {
        contentTypes: [CONTENT_TYPE_1],
        onSelect: this.onSelect
      };
    });

    itRendersTriggerButtonWithLabel(`Add ${CONTENT_TYPE_1.name}`);

    itRendersDropdownIs(false);

    it('emits onSelect after clicking on cta', function ({ cta }) {
      cta.simulate('click');
      sinon.assert.calledWith(this.onSelect, 'ID_1');
    });
  });

  describe('with custom label', function () {
    const CUSTOM_LABEL = 'Some custom label';

    beforeEach(function () {
      this.props = {
        contentTypes: [CONTENT_TYPE_1],
        onSelect: sinon.spy(),
        text: CUSTOM_LABEL
      };
    });

    itRendersTriggerButtonWithLabel(CUSTOM_LABEL);
  });
});

function itRendersTriggerButtonWithLabel (label) {
  it(`renders the trigger button with label “${label}”`, ({ cta, menu }) => {
    expect(cta.length).toEqual(1);
    expect(cta.text()).toEqual(label);
    expect(menu.length).toEqual(0);
  });
}

function itRendersDropdownIs (isTrue = true) {
  it(`${isTrue ? 'renders' : 'does not render'} button as dropdown`,
    ({ dropdownIcon }) => {
      const toBeFn = isTrue ? 'toBeGreaterThan' : 'toBe';
      expect(dropdownIcon.length)[toBeFn](0);
    }
  );
}
