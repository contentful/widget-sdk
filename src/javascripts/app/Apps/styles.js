import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const icon = css({
  borderRadius: '5px',
  marginRight: tokens.spacingS,
});

const styles = {
  item: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `${tokens.spacingM} 0`,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '&:last-child': {
      borderBottom: 'none',
      paddingBottom: '0',
    },
  }),
  title: css({
    flexGrow: 1,
    display: 'block',
  }),
  tagLine: css({
    fontSize: tokens.fontSizeS,
    color: tokens.colorElementDarkest,
  }),
  titleText: css({
    fontSize: tokens.fontSizeL,
    fontWeight: '500',
  }),
  actions: css({
    display: 'block',
    button: {
      marginLeft: tokens.spacingM,
    },
  }),
  icon: cx(
    icon,
    css({
      backgroundColor: '#fff',
      boxShadow: tokens.boxShadowDefault,
      padding: '2px',
      width: '35px',
      height: '35px',
    })
  ),
  navbarIcon: cx(
    icon,
    css({
      width: '21px',
      height: '21px',
    })
  ),
  navbarItem: css({
    display: 'flex',
    alignItems: 'center',
  }),
  appLink: css({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  }),
  tag: css({
    marginTop: '3px',
    marginLeft: tokens.spacingXs,
  }),
  splitter: css({
    //is there an easier way with f36 to fight the default padding?
    margin: `-${tokens.spacingXs} -1.25rem`,
    border: 0,
    height: '1px',
    backgroundColor: tokens.colorElementMid,
  }),
  promotion: css({
    marginTop: `-${tokens.spacingM}`,
    lineHeight: tokens.lineHeightDefault,
  }),
  promotionTag: css({
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightMedium,
    borderRadius: '3px',
    backgroundColor: tokens.colorBlueDark,
    marginRight: tokens.spacingXs,
    color: `${tokens.colorWhite} !important`,
    textTransform: 'uppercase',
  }),
};

export default styles;
