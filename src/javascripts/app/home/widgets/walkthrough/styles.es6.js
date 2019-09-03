import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  walkthroughTooltip: css({
    backgroundColor: tokens.colorWhite,
    borderRadius: '2px',
    overflow: 'hidden',
    width: '300px'
  }),
  tooltipHeader: css({
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorBlueDark,
    padding: '18px'
  }),
  tooltipHeading: css({
    color: tokens.colorWhite,
    margin: 0
  }),
  tooltipIllustration: css({
    margin: '22px 32px 0px 32px'
  }),
  tooltipCopy: css({ margin: '22px 32px' }),
  tooltipButtonContainer: css({ padding: '0 32px 32px' }),
  startWalkthroughButton: css({
    justifyContent: 'center',
    display: 'flex',
    marginTop: '17px',
    width: '100%'
  }),
  relaunchWalkthroughSection: css({
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(229, 235, 237, 0.3)',
    padding: '28px',
    width: '939px',
    margin: 'auto',
    marginTop: '40px'
  }),
  relaunchWalkthroughButton: css({ marginTop: '13px' }),
  spaceHomeSpinner: css({ display: 'flex', margin: 'auto', marginTop: '10px' })
};
