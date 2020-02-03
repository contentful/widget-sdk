import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  validationRow: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '> div': {
      marginRight: tokens.spacingS
    }
  }),
  textInputNumber: css({
    'input[type=number]': {
      width: '120px'
    }
  }),
  marginTopS: css({
    marginTop: tokens.spacingS
  }),
  union: css({
    lineHeight: '1.5',
    marginBottom: tokens.spacingXs
  }),
  pxLabel: css({
    position: 'absolute',
    right: '0',
    marginRight: tokens.spacingS,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorTextLightest
  }),
  flexContainer: css({
    display: 'inline-flex',
    alignItems: 'center'
  }),
  positionRelative: css({
    position: 'relative'
  }),
  inlineListItems: css({
    display: 'inline-box',
    marginRight: tokens.spacingXs,
    marginBottom: tokens.spacingS
  }),
  checkbox: css({
    minWidth: tokens.spacing4Xl
  })
};

export default styles;
