import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  timePicker: css({
    display: 'block'
  }),
  selectedTime: css({
    background: tokens.colorElementLightest
  }),
  dropdown: css({
    width: '100%'
  }),
  dropdownContainer: css({
    zIndex: 1001,
    width: '165px',
    '& > div': {
      width: '100%',
      button: {
        width: '100%',
        textAlign: 'center'
      }
    }
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
  timeInput: css({
    width: '100%',
    flexBasis: '100%',
    justifyContent: 'center',
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${tokens.colorElementMid}`,
    paddingLeft: tokens.spacingXs,
    paddingRight: tokens.spacingXs,
    height: '40px',
    color: tokens.colorTextMid,
    textAlign: 'center',
    fontSize: tokens.fontSizeM,
    fontFamily: 'Avenir Next',
    margin: 0,
    MozAppearance: 'textfield',
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
