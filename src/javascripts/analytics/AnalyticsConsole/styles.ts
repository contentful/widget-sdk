import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  card: css({
    position: 'fixed',
    width: '600px',
    right: tokens.spacingM,
    bottom: tokens.spacingM,
  }),
  toolbar: css({
    justifyContent: 'space-between',
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      '& > div+div': {
        padding: `0 ${tokens.spacingS}`,
      },
    },
  }),
  content: css({
    height: '450px',
    overflowY: 'scroll',
    padding: '0 15px',
    margin: '5px 0',
  }),
  info: css({
    borderTop: '1px dotted gray',
    marginTop: '-1px',
    padding: '15px 5px',
    fontStyle: 'italic',
    textAlign: 'center',
    '& > button': {
      fontStyle: 'normal',
    },
  }),
  filter: css({
    display: 'flex',
    alignItems: 'baseline',
    padding: '5px',
    borderTop: '1px solid black',
  }),
  event: css({
    borderTop: '1px dotted gray',
    marginTop: '-1px',
    padding: '15px 5px',
    '& span': {
      color: 'red',
    },
  }),
  data: css({
    fontSize: '0.9em',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  }),
  search: css({
    '& button': {
      pointerEvents: 'none',
    },
  }),
};
