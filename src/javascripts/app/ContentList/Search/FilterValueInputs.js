import { makeCtor } from 'utils/TaggedValues';

/**
 * Input types for filter values.
 *
 * We render each value input differently. See './View' for details.
 */

export default {
  // Select box. Call the constructor with a list of [value, label] pairs
  Select: makeCtor(),
  // A simple text input
  Text: makeCtor(),
  Reference: makeCtor(),
  Date: makeCtor(),
  AssetDetailsSize: makeCtor()
};
