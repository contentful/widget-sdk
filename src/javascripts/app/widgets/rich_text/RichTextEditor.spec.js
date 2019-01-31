import React from 'react';
import Enzyme from 'enzyme';

import RichTextEditor from './RichTextEditor.es6';
import Toolbar from './Toolbar/index.es6';

jest.mock('ng/EntityHelpers', () => ({}), { virtual: true });
jest.mock('ng/data/CMA/EntityState.es6', () => ({}), { virtual: true });
jest.mock('ng/ui/cf/thumbnailHelpers.es6', () => ({}), { virtual: true });
jest.mock('app/widgets/rich_text/helpers/browser.es6', () => ({}), { virtual: true });
jest.mock(
  'ng/debounce',
  () => {
    return jest.fn();
  },
  { virtual: true }
);

const fakeProps = props => ({
  widgetAPI: {
    permissions: {
      canAccessAssets: true
    }
  },
  value: undefined,
  onChange: jest.fn(),
  onAction: jest.fn(),
  isDisabled: false,
  showToolbar: false,
  ...props
});

describe('RichTextEditor', () => {
  it('renders the editor', function() {
    const wrapper = Enzyme.shallow(<RichTextEditor {...fakeProps()} />);

    expect(wrapper.find('[data-test-id="editor"]').props().readOnly).toBe(false);
  });

  it('renders toolbar', function() {
    const wrapper = Enzyme.shallow(<RichTextEditor {...fakeProps()} />);

    expect(wrapper.find(Toolbar)).toHaveLength(1);
  });

  it('renders readonly editor and toolbar', function() {
    const wrapper = Enzyme.shallow(<RichTextEditor {...fakeProps({ isDisabled: true })} />);

    expect(wrapper.find('[data-test-id="editor"]').props().readOnly).toBe(true);
    expect(wrapper.find(Toolbar).props().isDisabled).toBe(true);
  });
});
