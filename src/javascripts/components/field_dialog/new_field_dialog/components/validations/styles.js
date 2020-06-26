import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  validationRow: css({
    maxWidth: '50em',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: tokens.spacingL,
    '> div': {
      marginRight: tokens.spacingS,
    },
  }),
  marginLeftL: css({
    marginLeft: tokens.spacingL,
  }),
  validationValuesRow: css({
    marginLeft: tokens.spacingL,
    maxWidth: '50em',
  }),
  validationMessage: css({
    marginLeft: tokens.spacingL,
  }),
  helpTextInput: css({
    maxWidth: '50em',
    marginTop: tokens.spacingS,
    marginLeft: tokens.spacingL,
    marginBottom: tokens.spacingS,
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
  marginBottomS: css({
    marginBottom: tokens.spacingS,
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
  inlineList: css({
    marginLeft: tokens.spacingL,
  }),
  inlineListItems: css({
    display: 'inline-box',
    marginRight: tokens.spacingXs,
    marginBottom: tokens.spacingS,
  }),
  checkbox: css({
    minWidth: tokens.spacing4Xl,
    alignSelf: 'center',
    marginTop: tokens.spacingM,
    label: { whiteSpace: 'nowrap' },
  }),
  minWidth6rem: css({
    minWidth: '6rem',
  }),
  timeZonePicker: css({
    flexGrow: '1',
  }),
  hint: css({
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
    fontSize: tokens.fontSizeM,
  }),
  container: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
    whiteSpace: 'nowrap',
    display: 'flex',
    flexWrap: 'wrap',
  }),
  pill: css({
    cursor: 'grab',
    userSelect: 'none',
    maxWidth: 200,
    marginBottom: tokens.spacingS,
    marginRight: tokens.spacingS,
  }),
};

export default styles;
