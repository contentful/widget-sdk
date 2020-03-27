import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  svgContainerAddUser: css({
    width: '110px',
    marginRight: '-10px',
    marginBottom: '-20px',
  }),
  svgContainerContact: css({
    width: '145px',
    marginRight: '-24px',
    marginBottom: '-29px',
  }),
  svgContainerExtension: css({ width: '171px', marginTop: '-20px' }),
  header: css({
    fontSize: tokens.fontSize3Xl,
    fontWeight: tokens.fontWeightNormal,
    textAlign: 'center',
  }),
  description: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightNormal,
    textAlign: 'center',
  }),
  demiBold: css({ fontWeight: tokens.fontWeightDemiBold }),
};
