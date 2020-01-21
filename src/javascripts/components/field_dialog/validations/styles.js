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
  errorMessage: css({
    marginTop: tokens.spacingS
  }),
  inlineListItems: css({
    display: 'inline',
    marginRight: tokens.spacingXs
  })
};

export default styles;
