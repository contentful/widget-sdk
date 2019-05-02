import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  timePicker: css({
    display: 'block'
  }),
  inputWrapper: css({
    display: 'flex',
    marginBottom: tokens.spacingXs,
    'div:not(:last-child)': {
      marginRight: tokens.spacingXs
    }
  }),
  daytimeSelect: css({
    flexBasis: '100%',
    '> select': {
      paddingRight: '2rem'
    }
  }),
  timeField: css({
    flexBasis: '100%',
    justifyContent: 'center',
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${tokens.colorElementMid}`,
    paddingLeft: tokens.spacingXs,
    paddingRight: tokens.spacingXs,
    height: '40px'
  }),
  timeInput: css({
    height: '100%',
    maxWidth: tokens.spacingL,
    color: tokens.colorTextMid,
    textAlign: 'center',
    fontSize: tokens.fontSizeM,
    fontFamily: 'Avenir Next',
    border: 'none',
    margin: 0,
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    },
    '&:focus': {
      outline: 'none',
      border: `1px solid ${tokens.colorPrimary}`,
      boxShadow: tokens.glowPrimary
    }
  })
};

export default styles;
