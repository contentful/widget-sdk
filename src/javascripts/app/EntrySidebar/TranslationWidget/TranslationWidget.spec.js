import React from 'react';
import TranslationWidget from './TranslationWidget.es6';
import Enzyme from 'enzyme';
import TheLocaleStoreMocked from 'ng/TheLocaleStore';

jest.mock(
  'ng/TheLocaleStore',
  () => ({
    isSingleLocaleModeOn: jest.fn().mockReturnValue(false)
  }),
  { virtual: true }
);

describe('EntrySidebar/TranslationWidget', () => {
  const render = (props = {}, renderFn = Enzyme.mount) => {
    const stubs = {
      onChange: jest.fn(),
      onLocaleDeactivation: jest.fn(),
      emitter: {
        emit: jest.fn()
      }
    };
    const locales = [
      { code: 'en-US', default: true, name: 'English (United States)' },
      { code: 'ru', default: false, name: 'Russian' }
    ];
    const wrapper = renderFn(
      <TranslationWidget
        locales={locales}
        onChange={stubs.onChange}
        emitter={stubs.emitter}
        onLocaleDeactivation={stubs.onLocaleDeactivation}
        {...props}
      />
    );
    return { wrapper, stubs, locales };
  };

  beforeEach(() => {
    TheLocaleStoreMocked.isSingleLocaleModeOn.mockReset();
  });

  describe('when single locale mode is on', () => {
    beforeEach(() => {
      TheLocaleStoreMocked.isSingleLocaleModeOn.mockReturnValue(true);
    });

    it('should match snapshot', () => {
      const { wrapper } = render({}, Enzyme.shallow);
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('when single locale mode is off', () => {
    beforeEach(() => {
      TheLocaleStoreMocked.isSingleLocaleModeOn.mockReturnValue(false);
    });

    it('should match snapshot', () => {
      const { wrapper } = render({}, Enzyme.shallow);
      expect(wrapper).toMatchSnapshot();
    });
  });
});
