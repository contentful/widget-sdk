import {State as EntityState} from 'data/CMA/EntityState';
import {caseof as caseofEq} from 'sum-types/caseof-eq';
import {constant} from 'lodash';
export {default as Color} from 'color';

/**
 * This module exports CSS color values.
 *
 * We export colors by their generic color name as well as using
 * semantic names.
 *
 * For now this module needs to be kept in sync with the stylus files.
 */


export const byName = {
  textDark: '#2A3039',
  textMid: '#536171',
  textLight: '#8091A5',
  textLightest: '#A9B9C0',

  elementDarkest: '#B4C3CA',
  elementDark: '#C3CFD5',
  elementMid: '#D3DCE0',
  elementLight: '#E5EBED',
  elementLightest: '#F7F9FA',

  contrastDark: '#0C141C',
  contrastMid: '#192532',
  contrastLight: '#263545',

  blueDarkest: '#3072BE',
  blueDark: '#3C80CF',
  blueMid: '#4A90E2',
  blueLight: '#5B9FEF',

  greenDarkest: '#0BAA75',
  greenDark: '#0EB87F',
  greenMid: '#19CD91',
  greenLight: '#14D997',
  greenLighter: '#B7DED0',
  greenLightest: '#F4FFFB',

  redDarkest: '#CD3F39',
  redDark: '#D9453F',
  redMid: '#E34E48',
  redLight: '#F05751',

  orangeDark: '#db8500',
  orangeMid: '#ea9005',
  orangeLight: '#fba012',

  coralDark: '#D0A2A0',
  coralMid: '#FBE3E2',

  mintDark: '#B7DED0',
  mintMid: '#F4FFFB',

  iceDark: '#C5D2D8',
  iceMid: '#E8F7FF',

  yellowLight: '#FFFDE3',
  yellowDark: '#F8E71C',

  bgLight: '#E2E7EA'
};


/**
 * Given an entity state we return
 */
export function entityStateColor (state) {
  return caseofEq(state, [
    [EntityState.Archived(), constant(byName.redLight)],
    [EntityState.Draft(), constant(byName.orangeLight)],
    [EntityState.Published(), constant(byName.greenLight)],
    [EntityState.Changed(), constant(byName.blueLight)]
  ]);
}
