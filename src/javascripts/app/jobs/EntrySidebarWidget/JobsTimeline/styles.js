import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const scheduleStyles = {
  scheduledTo: css({
    whiteSpace: 'nowrap',
    width: '50%'
  }),
  schedule: css({
    marginBottom: tokens.spacingS
  }),
  scheduleSmall: css({
    display: 'flex',
    alignItems: 'center'
  }),
  scheduleHeader: css({
    display: 'flex',
    alignContent: 'center',
    marginBottom: tokens.spacingS
  }),
  scheduleHeaderSmall: css({
    marginBottom: '0px',
    marginTop: '2px'
  }),
  scheduleIcon: css({
    marginRight: tokens.spacingXs
  }),
  scheduleDropdownToggle: css({
    height: '1rem',
    span: {
      padding: '0px'
    }
  }),
  actionType: css({
    display: 'block',
    width: '100%'
  }),
  date: css({
    color: tokens.colorTextLight
  }),
  dateSmall: css({
    marginLeft: 'auto'
  })
};
