import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const aliasStyles = {
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${tokens.spacingXs} 0.875rem ${tokens.spacingXs}`,
  }),
  card: css({
    margin: `${tokens.spacingM} 0`,
    backgroundColor: tokens.colorElementLightest,
    zIndex: 10,
    position: 'relative',
  }),
  body: css({
    backgroundColor: tokens.colorWhite,
  }),
  row: css({
    '&:hover': {
      backgroundColor: 'unset',
    },
  }),
  createdAt: css({
    marginLeft: 'auto',
  }),
  wrapper: css({
    display: 'flex',
    alignItems: 'center',
    '& > span': {
      marginRight: tokens.spacingXs,
    },
  }),
  dropdownList: css({
    padding: 0,
    '& li': {
      padding: 0,
    },
  }),
  icon: css({
    display: 'block',
    marginRight: tokens.spacingS,
    fill: tokens.colorGreenLight,
  }),
};
