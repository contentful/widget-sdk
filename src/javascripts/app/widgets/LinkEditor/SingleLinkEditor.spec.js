import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';

import { SingleLinkEditor, default as LinkEditor } from '.';

const link = {
  sys: {
    id: 'LINK_ID',
    type: 'Link',
    linkType: 'Entry',
  },
};

jest.mock('./withCfWebApp.js', () => ({}));
jest.mock('../shared/FetchedEntityCard', () => ({ WrappedEntityCard: {} }));

function mount(customProps) {
  const props = {
    type: 'Entry',
    actions: {},
    ...customProps,
  };
  return Enzyme.shallow(<SingleLinkEditor {...props} />);
}

describe('SingleLinkEditor', () => {
  it('renders LinkEditor as `isSingle` with given link as only element', () => {
    const wrapper = mount({ value: link });
    const linkEditor = wrapper.find(LinkEditor);
    expect(linkEditor).toExist();
    expect(linkEditor.props()).toEqual({
      ...wrapper.props(),
      isSingle: true,
      value: [link],
    });
  });

  it('fires `onChange` value with single link instead of an array', () => {
    const onChange = jest.fn();
    const linkEditor = mount({ value: undefined, onChange }).find(LinkEditor);
    linkEditor.props().onChange([link]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(link);
  });

  it('fires `onChange` value with undefined instead of an empty array', () => {
    const onChange = jest.fn();
    const linkEditor = mount({ value: link, onChange }).find(LinkEditor);
    linkEditor.props().onChange([]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
