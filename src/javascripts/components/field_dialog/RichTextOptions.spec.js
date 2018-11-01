import React from 'react';
import { mount } from 'enzyme';

import RichTextOptions from './RichTextOptions.es6';

describe('RichTextOptions', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      onChange: jest.fn()
    };
    wrapper = mount(<RichTextOptions {...props} />);
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
    wrapper = mount(<RichTextOptions {...props} />);

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

    const args = props.onChange.mock.calls[0][0];

    expect(args.enabledNodeTypes).toBeUndefined();
    expect(args.enabledMarks).not.toContain('code');
  });

  it('deselects node types from the default selection', () => {
    wrapper
      .find(`[data-test-id="toggle-button-entry-hyperlink"]`)
      .find('button')
      .simulate('click');
    const args = props.onChange.mock.calls[0][0];

    expect(args.enabledNodeTypes).not.toContain('entry-hyperlink');
    expect(args.enabledMarks).toBeUndefined();
  });

  it('toggles all formatting options when `enable all` is clicked', () => {
    wrapper.find(`[data-test-id="toggle-all-link"]`).simulate('click');

    expect(props.onChange).toHaveBeenCalledWith({ enabledNodeTypes: [], enabledMarks: [] });

    wrapper.find(`[data-test-id="toggle-all-link"]`).simulate('click');
    expect(props.onChange).toHaveBeenCalledWith({
      enabledNodeTypes: undefined,
      enabledMarks: undefined
    });
  });
});
