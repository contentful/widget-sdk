import React from 'react';
import { noop } from 'lodash';
import sinon from 'npm:sinon';
import { default as CreateEntryButton, Style } from 'components/CreateEntryButton';

import { mount } from 'enzyme';

const CONTENT_TYPE_1 = { name: 'name-1', sys: { id: 'ID_1' } };
const CONTENT_TYPE_2 = { name: 'name-2', sys: { id: 'ID_2' } };
const CONTENT_TYPE_3 = { name: 'name-3', sys: { id: 'ID_3' } };

describe('CreateEntryButton', () => {
  beforeEach(function() {
    const findByTestId = id => this.wrapper.find(`[data-test-id="${id}"]`);
    // TODO: Remove `.at(0)` which is necessary because of odd component library DOM.
    this.findCta = () => findByTestId('cta').at(0);
    this.findMenu = () => findByTestId('add-entry-menu');
    this.findMenuItems = () => findByTestId('contentType');
    this.findDropdownIcon = () => findByTestId('dropdown-icon');
    this.findSpinner = () => findByTestId('spinner');
    this.setup = () => {
      this.wrapper = mount(<CreateEntryButton {...this.props} />);
      delete this.setup; // Allows us to run setup manually in `beforeEach`
      return {
        cta: this.findCta(),
        menu: this.findMenu(),
        dropdownIcon: this.findDropdownIcon()
      };
    };
  });

  describe('with multiple content types', function() {
    beforeEach(function() {
      this.props = {
        contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
        onSelect: noop
      };
    });

    itRendersTriggerButtonWithLabel('Add entry');

    itRendersDropdownIs(true);

    describe('menu', function() {
      beforeEach(function() {
        this.onSelect = sinon.spy();
        this.props.onSelect = this.onSelect;
      });

      it('opens after click on btn', function({ cta }) {
        cta.simulate('click');
        expect(this.findMenu().length).toEqual(1);
      });

      it('hides after second click on btn', function({ cta }) {
        cta.simulate('click');
        cta.simulate('click');
        expect(this.findMenu().length).toEqual(0);
      });

      it('has one item for each content type', function({ cta }) {
        cta.simulate('click');
        expect(this.findMenuItems().length).toBe(3);
      });

      it('emits onSelect after click on menu item', function({ cta }) {
        const TEST_ITEM_INDEX = 1;
        const testItemCt = this.props.contentTypes[TEST_ITEM_INDEX];
        cta.simulate('click');
        const testItem = this.findMenuItems().at(TEST_ITEM_INDEX);
        testItem.simulate('click');
        sinon.assert.calledWith(this.onSelect, testItemCt.sys.id);
      });
    });
  });

  describe('with single content type', function() {
    beforeEach(function() {
      this.onSelect = sinon.spy();
      this.props = {
        contentTypes: [CONTENT_TYPE_1],
        onSelect: this.onSelect
      };
    });

    itRendersTriggerButtonWithLabel(`Add ${CONTENT_TYPE_1.name}`);

    itRendersDropdownIs(false);

    it('emits onSelect after clicking on cta', function({ cta }) {
      cta.simulate('click');
      sinon.assert.calledWith(this.onSelect, CONTENT_TYPE_1.sys.id);
    });
  });

  describe('with custom label', function() {
    const CUSTOM_LABEL = 'Some custom label';

    beforeEach(function() {
      this.props = {
        contentTypes: [CONTENT_TYPE_1],
        onSelect: noop,
        text: CUSTOM_LABEL
      };
    });

    itRendersTriggerButtonWithLabel(CUSTOM_LABEL);
  });

  describe('as link', function() {
    beforeEach(function() {
      this.onSelect = sinon.stub();
      this.props = {
        contentTypes: [CONTENT_TYPE_3],
        onSelect: this.onSelect,
        style: Style.Link
      };
      this.assertEmittedOnSelect = () =>
        sinon.assert.calledOnceWith(this.onSelect, CONTENT_TYPE_3.sys.id);
    });

    itRendersTriggerButtonWithLabel(`Add ${CONTENT_TYPE_3.name}`);

    describe('before clicking on cta', function() {
      itDisablesLinkIs(false);
    });

    describe('clicking on cta', function() {
      describe('with `onSelect` not returning a promise', function() {
        beforeEach(function() {
          this.onSelect.returns(undefined);
          this.setup();
          this.findCta().simulate('click');
        });

        itDisablesLinkIs(false);

        it('emits onSelect', function() {
          this.assertEmittedOnSelect();
        });

        it('emits onSelect on subsequent click', function() {
          this.onSelect.reset();
          this.findCta().simulate('click');
          this.assertEmittedOnSelect();
        });
      });

      describe('on pending promise', function() {
        beforeEach(function() {
          this.onSelect.returns(new Promise(() => {}));
          this.setup();
          this.findCta().simulate('click');
        });
        it('does not emit onSelect on subsequent click', function() {
          this.findCta().simulate('click');
          this.findCta().simulate('click');

          sinon.assert.calledOnce(this.onSelect);
        });
      });

      describe('with `onSelect` returning a promise', function() {
        beforeEach(function() {
          this.onSelect.returns(Promise.resolve());
          this.setup();
          this.findCta().simulate('click');
        });

        itDisablesLinkIs(true);

        it('emits onSelect', function() {
          this.assertEmittedOnSelect();
        });

        describe('after resolving promise', function() {
          beforeEach(async function() {
            this.wrapper.update();
          });

          itDisablesLinkIs(false);

          it('emits onSelect on subsequent clicks', function() {
            this.onSelect.reset();
            this.findCta().simulate('click');
            this.assertEmittedOnSelect();
          });
        });
      });
    });
  });
});

function itDisablesLinkIs(isTrue) {
  it(`${isTrue ? 'shows' : 'shows no'} spinner`, function() {
    expect(this.findSpinner().length).toEqual(isTrue ? 1 : 0);
  });

  it(`${isTrue ? 'disables' : 'enables'} link`, function() {
    expect(this.findCta().prop('disabled')).toBe(isTrue);
  });
}

function itRendersTriggerButtonWithLabel(label) {
  it(`renders the trigger button with label “${label}”`, ({ cta, menu }) => {
    expect(cta.length).toEqual(1);
    expect(cta.text()).toEqual(label);
    expect(menu.length).toEqual(0);
  });
}

function itRendersDropdownIs(isTrue) {
  it(`${isTrue ? ' renders' : 'does not render'} button as dropdown`, ({ dropdownIcon }) => {
    const toBeFn = isTrue ? 'toBeGreaterThan' : 'toBe';
    expect(dropdownIcon.length)[toBeFn](0);
  });
}
