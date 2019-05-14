import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const scheduleStyles = {
  scheduledTo: css({
    whiteSpace: 'nowrap'
  }),
  schedule: css({
    display: 'flex',
    paddingLeft: '20px',
    position: 'relative',
    '&::before': {
      top: '1px',
      left: '0px',
      content: `''`,
      width: '10px',
      height: '10px',
      position: 'absolute',
      borderRadius: '10px',
      backgroundColor: 'transparent',
      border: `2px solid ${tokens.colorElementDarkest}`
    },
    '&:first-of-type::before': {
      backgroundColor: tokens.colorElementMid
    },
    '&:not(:first-of-type)::after': {
      top: '-9px',
      left: '5px',
      position: 'absolute',
      content: `''`,
      width: '4px',
      height: '10px',
      background: tokens.colorElementDarkest
    }
  }),
  info: css({
    marginLeft: 'auto',
    display: 'flex',
    justifyContent: 'right',
    flexWrap: 'wrap',
    textAlign: 'right'
  }),
  actionType: css({
    display: 'block',
    width: '100%'
  }),
  date: css({
    marginLeft: 'auto'
  })
};
