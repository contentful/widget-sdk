import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';

import StructuredTextOptions from '../StructuredTextOptions.es6';

describe('StructuredTextOptions', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      onChange: sinon.spy()
    };
    wrapper = mount(<StructuredTextOptions {...props} />);
  });

  it('renders', () => {
    expect(wrapper).toBeDefined();
  });

  it('selects all formatting options by default', () => {
    wrapper.find('[data-test-id="toggle-button-*"]').forEach(opt => {
      expect(opt.prop('isActive')).toBeTruthy();
    });
  });

  it('selects formatting options provided via props', () => {
    props = {
      ...props,
      enabledNodeTypes: ['ul-list'],
      enabledMarks: ['code']
    };
    wrapper = mount(<StructuredTextOptions {...props} />);

    wrapper.find('[data-test-id="toggle-button-*"]').forEach(opt => {
      if (opt.prop('title') === 'ul-list' || opt.prop('title') === 'code') {
        expect(opt.prop('isActive')).toBeTruthy();
      } else {
        expect(opt.prop('isActive')).toBeFalsy();
      }
    });
  });

  it('deselects marks from the default selection', () => {
    wrapper
      .find(`[data-test-id="toggle-button-code"]`)
      .find('button')
      .simulate('click');

    const args = props.onChange.getCall(0).args[0];

    expect(args.enabledNodeTypes).toBeUndefined();
    expect(args.enabledMarks).not.toContain('code');
  });

  it('deselects node types from the default selection', () => {
    wrapper
      .find(`[data-test-id="toggle-button-entry-hyperlink"]`)
      .find('button')
      .simulate('click');
    const args = props.onChange.getCall(0).args[0];

    expect(args.enabledNodeTypes).not.toContain('entry-hyperlink');
    expect(args.enabledMarks).toBeUndefined();
  });

  it('toggles all formatting options when `enable all` is clicked', () => {
    wrapper.find(`[data-test-id="toggle-all-link"]`).simulate('click');

    expect(props.onChange.calledWith({ enabledNodeTypes: [], enabledMarks: [] })).toBeTruthy();

    wrapper.find(`[data-test-id="toggle-all-link"]`).simulate('click');
    expect(
      props.onChange.calledWith({ enabledNodeTypes: undefined, enabledMarks: undefined })
    ).toBeTruthy();
  });
});
