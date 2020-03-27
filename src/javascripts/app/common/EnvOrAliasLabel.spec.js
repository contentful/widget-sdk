import React from 'react';
import { render } from '@testing-library/react';
import EnvOrAliasLabel from './EnvOrAliasLabel';

import tokens from '@contentful/forma-36-tokens';

const getAttribute = (el, property) => window.getComputedStyle(el, null).getPropertyValue(property);

const getComponent = (props = {}) => {
  return (
    <EnvOrAliasLabel
      aliasId="master"
      environmentId="release-1"
      showAliasedTo
      isMaster
      isSelected
      {...props}
    />
  );
};

describe('EnvOrAliasLabel', () => {
  const build = (props) => render(getComponent(props));

  describe('colors', () => {
    it('displays the unselected icon', () => {
      const { getByTestId } = build({ isSelected: undefined });
      const aliasIcon = getByTestId('envoralias.aliasicon');
      expect(getAttribute(aliasIcon, 'fill')).toBe(tokens.colorTextLight);
    });

    it('displays the selected master icon', () => {
      const { getByTestId } = build();
      const aliasIcon = getByTestId('envoralias.aliasicon');
      expect(getAttribute(aliasIcon, 'fill')).toBe(tokens.colorGreenLight);
    });

    it('displays the selected not-master icon', () => {
      const { getByTestId } = build({ isMaster: false });
      const aliasIcon = getByTestId('envoralias.aliasicon');
      expect(getAttribute(aliasIcon, 'fill')).toBe(tokens.colorOrangeLight);
    });

    it('displays the selected master with colorized font', () => {
      const { getByTestId } = build({ colorizeFont: true });
      const wrapper = getByTestId('envoralias.wrapper-active');
      expect(getAttribute(wrapper, 'color')).toBe('rgb(20, 217, 151)');
    });

    it('displays the selected not-master with colorized font', () => {
      const { getByTestId } = build({ colorizeFont: true, isMaster: false });
      const wrapper = getByTestId('envoralias.wrapper-active');
      expect(getAttribute(wrapper, 'color')).toBe('rgb(255, 178, 57)');
    });

    it('displays the correct italic font', () => {
      const { getByTestId } = build();
      const wrapper = getByTestId('envoralias.wrapper-active');
      expect(getAttribute(wrapper, 'font-style')).toBe('italic');
    });

    it('displays the correct normal font', () => {
      const { getByTestId } = build({ isMaster: false });
      const wrapper = getByTestId('envoralias.wrapper-active');
      expect(getAttribute(wrapper, 'font-style')).toBe('normal');
    });
  });

  describe('alias', () => {
    it('displays the alias icon', () => {
      const { getByTestId } = build();
      const aliasIcon = getByTestId('envoralias.aliasicon');
      expect(aliasIcon).toBeInTheDocument();
    });

    it('displays aliasedTo', () => {
      const { getByTestId } = build();
      const { innerHTML } = getByTestId('envoralias.wrapper-active');
      expect(innerHTML).toContain('master');
      expect(innerHTML).toContain('release-1');
    });

    it('displays no aliasedTo', () => {
      const { getByTestId } = build({ showAliasedTo: false });
      const { innerHTML } = getByTestId('envoralias.wrapper-active');
      expect(innerHTML).not.toContain('master');
      expect(innerHTML).toContain('release-1');
    });
  });

  describe('environment', () => {
    it('displays the environment icon', () => {
      const { getByTestId } = build({ aliasId: undefined });
      const aliasIcon = getByTestId('envoralias.environmenticon');
      expect(aliasIcon).toBeInTheDocument();
    });

    it('displays no aliasedTo', () => {
      const { getByTestId } = build({ aliasId: undefined });
      const { innerHTML } = getByTestId('envoralias.wrapper-active');
      expect(innerHTML).not.toContain('master');
      expect(innerHTML).toContain('release-1');
    });
  });
});
