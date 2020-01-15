import { h } from 'utils/legacy-html-hyperscript';
import { status, titleText } from './TemplateCommons';

export default function() {
  return h(
    '.asset-card',
    {
      dataTestId: 'entity-link-content',
      style: {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        alignItems: 'center'
      }
    },
    [
      h('.thumbnail-wrapper', [
        h('react-component', {
          name: 'components/Thumbnail/Thumbnail',
          props: '{ file: file, size: config.imageSize, fit: "thumb" }'
        })
      ]),
      status({
        position: 'absolute',
        width: '13px',
        top: '8px',
        right: '8px'
      }),
      h(
        '.asset-card__title',
        {
          dataTestId: 'entity-link-title',
          ngClick: 'actions.edit()',
          role: '{{actions.edit && "button"}}'
        },
        [titleText()]
      )
    ]
  );
}
