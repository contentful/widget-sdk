import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  pricingInfo: css({
    marginBottom: tokens.spacingL,
    position: 'relative', // position relative is used to ensure that z-index is applied
    zIndex: 3,
  }),
  workbench: css({
    backgroundColor: tokens.colorElementLightest,
  }),
  appListCard: css({
    position: 'relative',
    marginBottom: tokens.spacingM,
  }),
  overlay: css({
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colorWhite,
    opacity: 0.8,
  }),
  headingWrapper: css({
    display: 'flex',
    alignItems: 'baseline',
  }),
  heading: css({
    marginBottom: tokens.spacingM,
    flexGrow: 1,
  }),
  counter: css({
    color: tokens.colorTextLight,
  }),
  feedbackNote: css({
    marginBottom: tokens.spacingXl,
  }),
  externalLink: css({
    '& svg': css({
      verticalAlign: 'sub',
      marginLeft: tokens.spacing2Xs,
    }),
    '&:hover svg': css({
      fill: tokens.colorContrastMid,
      transition: `fill ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
    }),
  }),
  splitter: css({
    //is there an easier way with f36 to fight the default padding?
    margin: `${tokens.spacingXl} 0`,
    border: 0,
    height: '1px',
    backgroundColor: tokens.colorElementMid,
  }),
  contentfulAppCard: css({
    display: 'flex',
  }),
  contentfulAppIcon: css({
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    margin: `auto ${tokens.spacingM}`,
    '& img': css({
      maxHeight: '120px',
    }),
    '& svg': css({
      maxHeight: '120px',
    }),
  }),
  contentfulAppTextWrapper: css({
    flex: 4,
    display: 'flex',
    alignItems: 'center',
  }),
  contentfulAppText: css({}),
  button: css({
    marginTop: tokens.spacingS,
    marginRight: tokens.spacingM,
    '& > span': css({
      flexDirection: 'row-reverse',
    }),
  }),
  footer: css({
    marginBottom: tokens.spacing2Xl,
  }),
};
