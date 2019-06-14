import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const scheduleStyles = {
  scheduledTo: css({
    whiteSpace: 'nowrap',
    width: '50%'
  }),
  schedule: css({}),
  scheduleHeader: css({
    display: 'flex',
    alignContent: 'center',
    marginBottom: tokens.spacingS
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
  })
};
