import { h } from 'utils/legacy-html-hyperscript/index.es6';

/**
 * This module exports templates common to `EntityLinkTemplate` and
 * `AssetCardTemplate`.
 */

/**
 * The filled circle that indicates the entity status.
 *
 * Uses the following scope properties
 * - entityState
 * - statusDotStyle
 */
export function status(style) {
  return h('div', {
    ngIf: 'entityState',
    dataEntityState: '{{entityState}}',
    // This sets the background color
    ngStyle: 'statusDotStyle',
    style: {
      width: '13px',
      height: '13px',
      borderRadius: '50%',
      flexShrink: 0,
      ...style
    }
  });
}

/**
 * Display the title text for the entry
 *
 * There are special styles and placeholders when the title cannot be
 * determined or the entity is missing.
 */
export function titleText() {
  return [
    h(
      'span',
      {
        ngIf: '!missing && title',
        title: '{{title}}'
      },
      ['{{title}}']
    ),
    h(
      'span',
      {
        ngIf: '!missing && !title',
        style: { fontStyle: 'italic' }
      },
      ['Untitled']
    ),
    h(
      'span',
      {
        ngIf: 'missing',
        style: { fontStyle: 'italic' }
      },
      ['Entity missing or inaccessible']
    )
  ].join('');
}
