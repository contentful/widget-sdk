import { css } from 'emotion';
import {
  spacingXs,
  spacingS,
  spacingM,
  colorElementLightest,
  colorWhite,
  colorGreenLight
} from '@contentful/forma-36-tokens';

export const aliasStyles = {
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${spacingXs} 0.875rem ${spacingXs}`
  }),
  card: css({
    marginBottom: spacingM,
    backgroundColor: colorElementLightest,
    zIndex: 10,
    position: 'relative'
  }),
  body: css({
    backgroundColor: colorWhite
  }),
  createdAt: css({
    marginLeft: 'auto'
  }),
  wrapper: css({
    display: 'flex',
    alignItems: 'center',
    '& > span': {
      marginRight: spacingXs
    }
  }),
  dropdownList: css({
    padding: 0,
    '& li': {
      padding: 0
    }
  }),
  icon: css({
    display: 'block',
    marginRight: spacingS,
    fill: colorGreenLight
  })
};
