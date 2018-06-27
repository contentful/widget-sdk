import React from 'react';
import _ from 'lodash';
import sinon from 'npm:sinon';
import CreateEntryButton from 'components/CreateEntryButton';

import { mount } from 'enzyme';

const CONTENT_TYPE_1 = { name: 'name-1', sys: { id: 'ID_1' } };
const CONTENT_TYPE_2 = { name: 'name-2', sys: { id: 'ID_2' } };

describe('CreateEntryButton', () => {
  beforeEach(function () {
    this.mount = (dom) => {
      this.wrapper = mount(dom);
    };
    const findByTestId = (id) => this.wrapper.find(`[data-test-id="${id}"]`);
    this.findCta = () => findByTestId('cta');
    this.findMenu = () => findByTestId('add-entry-menu');
    this.findDropdownIcon = () => findByTestId('dropdown-icon');
  });

  describe('with multiple content types', function () {
    beforeEach(function () {
      const props = {
        contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2],
        onSelect: _.noop
      };
      this.mount(<CreateEntryButton {...props} />);
    });

    itRendersTriggerButtonWithLabel('Add entry');

    itRendersDropdownIs(true);

    it('opens menu after click on btn', function () {
      this.findCta().simulate('click');
      expect(this.findMenu().length).toEqual(1);
    });

    it('hides menu after second click on btn', function () {
      this.findCta().simulate('click');
      this.findCta().simulate('click');
      expect(this.findMenu().length).toEqual(0);
    });
  });

  describe('with single content type', function () {
    beforeEach(function () {
      this.onSelect = sinon.spy();
      const props = {
        contentTypes: [CONTENT_TYPE_1],
        onSelect: this.onSelect
      };
      this.mount(<CreateEntryButton {...props} />);
    });

    itRendersTriggerButtonWithLabel(`Add ${CONTENT_TYPE_1.name}`);

    itRendersDropdownIs(false);

    it('emits onSelect after clicking on cta', function () {
      this.findCta().simulate('click');
      sinon.assert.calledWith(this.onSelect, 'ID_1');
    });
  });
});

function itRendersTriggerButtonWithLabel (label) {
  it(`renders the trigger button with label “${label}”`, function () {
    expect(this.findCta().length).toEqual(1);
    expect(this.findCta().text()).toEqual(label);
    expect(this.findMenu().length).toEqual(0);
  });
}

function itRendersDropdownIs (isTrue = true) {
  it(`${isTrue ? 'renders' : 'does not render'} button as dropdown`, function () {
    const toBeFn = isTrue ? 'toBeGreaterThan' : 'toBe';
    expect(this.findDropdownIcon().length)[toBeFn](0);
  });
}
