import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  timezonePicker: css({
    display: 'block'
  }),
  selectedTimezone: css({
    background: tokens.colorElementLightest
  }),
  dropdown: css({
    width: '100%'
  }),
  inputWrapper: css({
    display: 'flex',
    marginBottom: tokens.spacingXs,
    'input::placeholder': {
      color: tokens.colorTextMid
    }
  })
};

export default styles;
