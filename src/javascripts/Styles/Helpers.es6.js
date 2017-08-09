import { byName as colors } from 'Styles/Colors';

/**
 * Hyperscript inline style helpers
 */

export function triangleDown (width = 4, color = colors.textDark) {
  return {
    border: `${width}px solid ${color}`,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent'
  };
}
