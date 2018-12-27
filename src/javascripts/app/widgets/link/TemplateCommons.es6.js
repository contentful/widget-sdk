import { h } from 'utils/legacy-html-hyperscript/index.es6';
import { assign } from 'lodash';

/**
 * This module exports templates common to `EntityLinkTemplate` and
 * `AssetCardTemplate`.
 */

export function dragHandle(style) {
  return h('cf-icon', {
    ngIf: 'config.draggable',
    dataDragHandle: true,
    name: 'drag-handle-2',
    style
  });
}

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
    style: assign(
      {
        width: '13px',
        height: '13px',
        borderRadius: '50%',
        flexShrink: 0
      },
      style
    )
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

/**
 * Icon buttons for the 'entity-edit', 'asset-download', and
 * 'entity-remove' actions.
 *
 * @param {string} actionClass  Class to apply to each action button
 *
 */
export function actions(actionClass) {
  return [
    h(
      `a.${actionClass}`,
      {
        dataTestId: 'entity-edit',
        ngIf: 'actions.edit',
        cfSref: 'stateRef',
        ngClick: 'onClick($event); $event.stopPropagation();'
      },
      [h('cf-icon', { name: 'edit' })]
    ),
    h(
      `a.${actionClass}`,
      {
        dataTestId: 'entity-edit',
        ngIf: '(stateRef || actions.slideinEdit) && !actions.edit',
        cfSref: 'stateRef',
        ngClick: 'onClick($event); $event.stopPropagation();'
      },
      [h('cf-icon', { name: 'edit' })]
    ),
    h(
      `a.${actionClass}`,
      {
        dataTestId: 'asset-download',
        ngIf: '!missing && downloadUrl',
        ngHref: '{{downloadUrl}}',
        target: '_blank',
        rel: 'noopener noreferrer'
      },
      [h('cf-icon', { name: 'download' })]
    ),
    h(
      `button.${actionClass}`,
      {
        dataTestId: 'entity-remove',
        ngIf: 'actions.remove',
        ngClick: 'actions.remove()'
      },
      [h('cf-icon', { name: 'delete' })]
    )
  ].join('');
}
