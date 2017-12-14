import { byName as colors } from 'Styles/Colors';

/**
 * This module exports shared CSS styles
 */


/**
 * FontFamily value for monospace fonts
 *
 * This is duplicated in `src/stylesheets/mixins/typography.styl`
 */
export const monospaceFontFamily = '"Menlo", "Andale mono", monospace';


/**
 * Return a common box shadow value
 * ~~~js
 * const style = {
 *   boxShadow: genBoxShadow()
 * }
 * ~~~
 */
export function genBoxShadow (x = 0, y = 2, blur = 3, spread = 0) {
  return `${x}px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, 0.08)`;
}


/**
 * Returns a style object that turns an element into a triangle using
 * border colors.
 */
export function triangleDown (width = 4, color = colors.textDark) {
  return {
    border: `${width}px solid ${color}`,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent'
  };
}
