import { h } from 'utils/hyperscript';
import * as Colors from 'Styles/Colors.es6';
import { dragHandle, status, titleText, actions } from './TemplateCommons.es6';

/**
 * Creates the template for entity links used by the `cfEntityLink`
 * directives.
 *
 * Consists of
 * - drag handler (configurable)
 * - thumbnail (configurable)
 * - status
 * - title
 * - description (configurable)
 * - actions
 *   - edit
 *   - download
 *   - remove
 */
export default function() {
  return h('div.entity-link', [
    dragHandle({
      position: 'absolute',
      paddingLeft: '11px',
      paddingRight: '9px',
      marginTop: '-1px'
    }),

    h(
      'a.entity-link__content',
      {
        dataTestId: 'entity-link-content',
        ngIf: '(stateRef || actions.slideinEdit) && !actions.edit',
        cfSref: 'stateRef',
        ngClick: 'onClick($event)'
      },
      [content()]
    ),
    h(
      'a.entity-link__content',
      {
        dataTestId: 'entity-link-content',
        ngIf: 'actions.edit',
        ngClick: 'actions.edit($event)',
        cfSref: 'stateRef'
      },
      [content()]
    ),
    h(
      '.entity-link__content',
      {
        dataTestId: 'entity-link-content',
        ngIf: '!stateRef && !actions.edit'
      },
      [content()]
    ),

    actions('entity-link__action')
  ]);
}

function content() {
  return [
    image(),
    status({
      marginTop: '2px',
      marginRight: '0.5em'
    }),
    h(
      'div',
      {
        style: {
          flex: '1 1 auto',
          overflow: 'hidden'
        }
      },
      text()
    ),

    // Content type information
    h(
      'div',
      {
        dataTooltip: 'Content type',
        style: {
          flexShrink: '0',
          margin: '1px 10px -1px 10px',
          color: Colors.byName.textLight,
          maxWidth: '30%',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }
      },
      ['{{ contentTypeName }}']
    )
  ].join('');
}

/**
 * A thumbnail image for the entity when it is available
 */
function image() {
  return h(
    '.entity-link__image',
    {
      ngIf: 'config.showDetails',
      ngClass: '{"entity-link__image--missing": !image}'
    },
    [h('cf-thumbnail', { file: 'image', size: '56', fit: 'thumb' })]
  );
}

/**
 * Display the entity title and description.
 *
 * There are special styles and placeholders when the title or
 * description cannot be determined or the entity is missing.
 */
function text() {
  return [
    h(
      'div',
      {
        dataTestId: 'entity-link-title',
        style: {
          fontSize: '16px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }
      },
      [titleText()]
    ),
    h(
      'div',
      {
        ngIf: 'config.showDetails',
        style: {
          // TODO should be imported from styles
          color: '#8091A5',
          // TODO should be imported from style helper
          marginTop: '0.64em'
        }
      },
      [
        h(
          'span',
          {
            ngIf: '!missing && description'
          },
          ['{{ description | truncate:150 }}']
        ),
        h(
          'span',
          {
            ngIf: 'missing || !description',
            style: { fontStyle: 'italic' }
          },
          ['No description available']
        )
      ]
    )
  ];
}
