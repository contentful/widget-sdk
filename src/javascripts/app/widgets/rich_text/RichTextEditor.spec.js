import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';

import RichTextEditor from './RichTextEditor';
import Toolbar from './Toolbar';

jest.mock('ng/data/CMA/EntityState', () => ({}), { virtual: true });
jest.mock('directives/thumbnailHelpers', () => ({}));
jest.mock('access_control/AccessChecker', () => ({}));
jest.mock('utils/browser', () => ({}));
jest.mock('redux/store', () => ({}));
jest.mock('ng/entityCreator', () => ({}), { virtual: true });
jest.mock(
  'ng/debounce',
  () => {
    return jest.fn();
  },
  { virtual: true }
);

const fakeProps = (props) => ({
  widgetAPI: {
    permissions: {
      canAccessAssets: true,
    },
    field: {
      id: 'FIELD_ID,',
      locale: 'FIELD_LOCALE',
    },
  },
  value: undefined,
  onChange: jest.fn(),
  onAction: jest.fn(),
  isDisabled: false,
  showToolbar: false,
  ...props,
});

describe('RichTextEditor', () => {
  it('renders the editor', function () {
    const wrapper = Enzyme.shallow(<RichTextEditor {...fakeProps()} />);

    expect(wrapper.find('[data-test-id="editor"]').props().readOnly).toBe(false);
  });

  it('renders toolbar', function () {
    const wrapper = Enzyme.shallow(<RichTextEditor {...fakeProps()} />);

    expect(wrapper.find(Toolbar)).toHaveLength(1);
  });

  it('renders readonly editor and toolbar', function () {
    const wrapper = Enzyme.shallow(<RichTextEditor {...fakeProps({ isDisabled: true })} />);

    expect(wrapper.find('[data-test-id="editor"]').props().readOnly).toBe(true);
    expect(wrapper.find(Toolbar).props().isDisabled).toBe(true);
  });
});
