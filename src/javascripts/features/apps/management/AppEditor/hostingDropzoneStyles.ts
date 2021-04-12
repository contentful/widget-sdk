import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  dropzoneWrapper: css({
    position: 'relative',
    marginBottom: tokens.spacingXl,
  }),
  dropzonePlaceholder: css({
    height: '128px',
  }),
  dropzoneHelpText: css({
    fontSize: tokens.fontSizeS,
    marginTop: tokens.spacingXs,
  }),
  dropzoneContainer: (active: boolean) =>
    css({
      border: `2px dashed ${tokens.colorElementLight}`,
      borderRadius: tokens.borderRadiusMedium,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: tokens.spacing2Xl,
      zIndex: tokens.zIndexModalContent,
      top: '0',
      position: active ? 'absolute' : 'initial',
      width: active ? '820px' : 'auto',
      background: tokens.colorElementLightest,
      [':focus']: {
        outline: `${tokens.colorElementMid} auto 2px`,
      },
    }),
  activeOverlay: css({
    height: '100vh',
    width: '100vw',
    background: tokens.colorTextDark,
    opacity: 0.7,
    top: 0,
    left: 0,
    zIndex: tokens.zIndexModal,
    position: 'fixed',
  }),
  innerText: css({
    fontWeight: tokens.fontWeightMedium,
    userSelect: 'none',
  }),
};
