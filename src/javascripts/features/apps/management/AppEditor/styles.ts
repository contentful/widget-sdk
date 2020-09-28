import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

export const styles = {
  helpParagraph: css({
    color: tokens.colorTextLight,
  }),
  input: (margin = true) =>
    css({
      marginBottom: margin ? tokens.spacingL : 0,
    }),
  toggleContainer: css({
    marginBottom: tokens.spacingXs,
  }),
  locationP: css({
    marginBottom: tokens.spacingM,
  }),
  locationToggle: css({
    width: '100%',
    padding: `${tokens.spacing2Xs} 0`,
    '& label ~ p': css({
      display: 'inline',
      marginLeft: tokens.spacingXs,
      color: tokens.colorElementDarkest,
      fontFamily: tokens.fontStackMonospace,
    }),
  }),
  checkboxInfo: css({
    position: 'absolute',
    right: tokens.spacingS,
  }),
  checkboxInfoIcon: css({
    position: 'absolute',
    right: tokens.spacingS,
    top: 'calc(50% - 9px)',
  }),
  fieldTypes: css({
    opacity: '0',
    height: 'min-content',
    maxHeight: '0',
    borderRadius: '2px',
    padding: '0',
    backgroundColor: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementLight}`,
    transitionDuration: tokens.transitionDurationDefault,
    transitionTimingFunction: tokens.transitionEasingDefault,
    transitionProperty: 'max-height, padding-top, padding-bottom, opacity',
    overflow: 'hidden',
  }),
  fieldTypesOpen: css({
    opacity: '1',
    // do not specify height as it breaks transition
    maxHeight: '500px', // value not relevant, must be greater than maximum min-content height
    overflow: 'hidden',
  }),
  fieldTypesPadding: (open = false) =>
    css({
      padding: `${open ? tokens.spacingS : 0} ${tokens.spacingS}`,
    }),
  fieldTypeChecks: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
  }),
  fieldTypesValidationMessage: css({
    marginTop: tokens.spacingXs,
  }),
  entryFieldCheck: css({
    marginTop: tokens.spacingS,
  }),
  publicSwitch: css({
    marginTop: tokens.spacingL,
  }),
  checkbox: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    '& input': css({
      verticalAlign: 'text-top',
      marginRight: tokens.spacingXs,
      cursor: 'pointer',
    }),
    '& label': css({
      fontWeight: tokens.fontWeightMedium,
      marginRight: tokens.spacingXs,
      cursor: 'pointer',
      color: tokens.colorTextDark,
    }),
    '& span': css({
      color: tokens.colorElementDarkest,
      fontFamily: tokens.fontStackMonospace,
    }),
  }),
  pageSwitch: css({
    padding: tokens.spacingM,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& label': css({
      margin: 0,
    }),
    p: css({
      marginBottom: tokens.spacingS,
    }),
  }),
  pageLocation: (enabled = false) =>
    css({
      display: 'flex',
      flexDirection: 'row',
      '& > div': css({
        padding: tokens.spacingM,
        borderRight: `1px solid ${tokens.colorElementLight}`,
        flex: '50%',
        '&:last-child': css({
          border: 'none',
          padding: tokens.spacingXl,
        }),
      }),

      opacity: enabled ? 1 : '0.3',
      pointerEvents: enabled ? undefined : 'none',
    }),
  pageLocationNav: css({
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '100%',
    cursor: 'default',
  }),
  nav: css({
    color: tokens.colorWhite,
    backgroundColor: tokens.colorContrastLight,
    padding: tokens.spacingS,
    borderRadius: '4px 4px 0 0',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    '& span': css({
      marginLeft: tokens.spacingXs,
    }),
    '& > svg': css({
      margin: `2px 0 0 12px`,
    }),
  }),
  navItem: css({
    display: 'flex',
    alignItems: 'center',
    borderRadius: '0 0 2px 2px',
    color: tokens.colorTextMid,
    '& svg': css({
      marginRight: tokens.spacingXs,
    }),
    '& span': css({}),
  }),
  navItemIcon: css({
    marginRight: tokens.spacingS,
  }),
  tag: css({
    marginBottom: tokens.spacingXs,
  }),
};
