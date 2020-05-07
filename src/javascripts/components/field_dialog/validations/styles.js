import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  validationRow: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '> div': {
      marginRight: tokens.spacingS,
    },
  }),
  flexAlignStart: css({
    alignItems: 'start',
  }),
  textInputNumber: css({
    'input[type=number]': {
      width: '120px',
    },
  }),
  marginTopS: css({
    marginTop: tokens.spacingS,
  }),
  union: css({
    lineHeight: '1.5',
    marginBottom: tokens.spacingXs,
  }),
  pxLabel: css({
    position: 'absolute',
    right: '0',
    marginRight: tokens.spacingS,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorTextLightest,
  }),
  label: css({
    marginRight: tokens.spacingXs,
    marginLeft: tokens.spacingM,
    alignSelf: 'center',
  }),
  flexContainer: css({
    display: 'inline-flex',
    alignItems: 'center',
  }),
  positionRelative: css({
    position: 'relative',
  }),
  inlineListItems: css({
    display: 'inline-box',
    marginRight: tokens.spacingXs,
    marginBottom: tokens.spacingS,
  }),
  checkbox: css({
    minWidth: tokens.spacing4Xl,
    alignSelf: 'center',
  }),
  minWidth6rem: css({
    minWidth: '6rem',
  }),
  timeZonePicker: css({
    flexGrow: '1',
  }),
};

export default styles;