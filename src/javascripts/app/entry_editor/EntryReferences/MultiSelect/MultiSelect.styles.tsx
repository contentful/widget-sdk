import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

export const styles = {
  root: css({
    border: `1px solid ${tokens.colorElementDark}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: tokens.colorElementLightest,
    overflow: 'hidden',
  }),
  selectLabel: css({
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: tokens.borderRadiusMedium,
    transition: `background-color ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    '&:hover': {
      backgroundColor: tokens.colorElementLight,
    },
    '.multi-select__checkbox': {
      marginRight: tokens.spacingXs,
    },
  }),
  mainSelect: css({
    height: tokens.spacingXl,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: tokens.spacingXl,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }),
  mainSelectText: css({
    position: 'absolute',
    left: '-500px',
    visibility: 'hidden',
  }),
  dropdownButton: css({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    border: 'none',
  }),
  dropdownList: css({
    padding: `${tokens.spacingXs} ${tokens.spacing2Xs}`,
    li: {
      padding: 0,
    },
    'span, div': {
      display: 'block',
    },
  }),
};
