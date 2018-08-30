import { assign } from 'lodash';
import { h } from 'ui/Framework';
import { Color } from 'Styles/Colors.es6';

/**
 * Creates a spinner element used to indicate a loading state.
 *
 * @param {string?} .diameter
 *   A CSS length value that determines the diameter of the spinner. Defaults to
 *   '20px'.
 * @param {string?} .color
 *   A CSS color value that determines the primary color of the spinner. A
 *   lightened version of this color is added later. Defaults to 'black'.
 * @param {object?} .style
 *   Addtional CSS styles applied to the spinner.
 * @return {VTree}
 */
export default function spinner({ diameter = '20px', color = 'black', style = {} } = {}) {
  const colorDark = Color(color || 'black');
  const colorLight = colorDark.lighten(0.6).fade(0.6);
  return h('span', {
    style: assign(
      {
        width: `calc(${diameter} - 4px)`,
        height: `calc(${diameter} - 4px)`,
        animation: 'fa-spin 2s infinite linear',
        borderRadius: '50%',
        borderBottom: `2px solid ${colorDark}`,
        borderLeft: `2px solid ${colorDark}`,
        borderTop: `2px solid ${colorLight}`,
        borderRight: `2px solid ${colorLight}`
      },
      style
    )
  });
}
