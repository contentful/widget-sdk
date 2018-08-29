import { h } from 'utils/hyperscript';
import { dragHandle, status, titleText, actions } from './TemplateCommons';

export default function() {
  return h(
    '.asset-card',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        alignItems: 'center'
      }
    },
    [
      h('cf-thumbnail', {
        ngClass: '{"entity-link__image--missing": !file}',
        file: 'file',
        size: '{{config.imageSize}}',
        fit: 'thumb',
        role: '{{hasTooltip && "button"}}',
        cfContextMenuTrigger: true
      }),
      dragHandle({
        position: 'absolute',
        top: '0',
        left: '0',
        padding: '1px',
        margin: '4px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      }),
      status({
        position: 'absolute',
        width: '13px',
        top: '8px',
        right: '8px'
      }),
      h(
        '.asset-card__title',
        {
          ngClick: 'actions.edit()',
          role: '{{actions.edit && "button"}}'
        },
        [titleText()]
      ),
      contextMenu()
    ]
  );
}

function contextMenu() {
  return h(
    '.asset-card__tooltip.context-menu',
    {
      ngIf: 'hasTooltip',
      role: 'menu',
      cfContextMenu: true
    },
    [
      details(),
      h(
        'div',
        {
          style: { display: 'flex' }
        },
        [actions('asset-card__action')]
      )
    ]
  );
}

/**
 * File details consisting of the name, MIME type, size, and
 * resolution.
 */
function details() {
  return h('ul.asset-card__details', { ngIf: 'file' }, [
    h('li.asset-card__file-name', ['{{ file.fileName | truncateMiddle:22:7 }}']),
    h('li.asset-card__type', ['{{ file | mimeGroup }}']),
    h('li.asset-card__file-size', { ngIf: 'file.details.size' }, [
      '{{ file.details.size | fileSize }}'
    ]),
    h('li.asset-card__image-resolution', { ngIf: 'file.details.image' }, [
      '{{ file.details.image.width }}&times;{{ file.details.image.height }}'
    ])
  ]);
}
