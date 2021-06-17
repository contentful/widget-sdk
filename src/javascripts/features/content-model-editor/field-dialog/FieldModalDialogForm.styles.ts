import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  modalControls: css({
    backgroundColor: tokens.colorWhite,
    borderTop: `1px solid ${tokens.colorElementMid}`,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingL,
    position: 'relative',
    width: '100%',
  }),
  modalHeader: css({
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorElementLightest,
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0 `,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: `${tokens.spacingXs} ${tokens.spacingM} 0 ${tokens.spacingL}`,
  }),
  leftPanel: css({
    display: 'flex',
  }),
  modalTitle: css({
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  }),
  ctFieldTitle: css({
    fontSize: tokens.fontSizeL,
    paddingRight: tokens.spacingXs,
    paddingLeft: tokens.spacingXs,
  }),
  ctFieldType: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorTextLightest,
  }),
  promotionTag: css({
    marginLeft: tokens.spacingXs,
  }),
};
