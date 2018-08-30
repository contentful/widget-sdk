import { h } from 'ui/Framework';
import { ihspace } from 'ui/Layout.es6';
import { badge, stateLink, codeFragment } from 'ui/Content.es6';
import { byName as Colors } from 'Styles/Colors.es6';
import { find } from 'lodash';
import { filter, concat } from 'utils/Collections.es6';
import infoIcon from 'svg/info.es6';
import copyButton from 'ui/Components/CopyIconButton.es6';

function makeLink(env) {
  return {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: env.sys.id
    }
  };
}

export default function(props) {
  return h('div', [
    renderList(props),
    props.isAdmin && props.spaceEnvironments.length < 2 && renderHint()
  ]);
}

function renderHint() {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        background: Colors.iceMid,
        border: '1px solid ' + Colors.elementLight,
        padding: '15px',
        margin: '1.5em 0'
      }
    },
    [
      infoIcon,
      h(
        'p',
        {
          style: {
            color: Colors.textLight,
            margin: '0',
            marginLeft: '10px'
          }
        },
        [
          `You haven't set up any additional environments for this space. Head to the `,
          stateLink(['environment settings'], { path: 'spaces.detail.settings.environments' }),
          ' to learn more.'
        ]
      )
    ]
  );
}

function renderList({ canEdit, spaceEnvironments, envs, updateEnvs }) {
  const isSelected = env => !!find(envs, { sys: { id: env.sys.id } });

  const toggleEnvironmentSelection = env => {
    if (isSelected(env)) {
      updateEnvs(filter(envs, cur => cur.sys.id !== env.sys.id));
    } else {
      updateEnvs(concat(envs, [makeLink(env)]));
    }
  };

  return h(
    'div',
    spaceEnvironments.map(env =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            marginTop: '10px'
          }
        },
        [
          h(
            'label',
            {
              style: {
                display: 'flex',
                alignItems: 'baseline'
              }
            },
            [
              h('input', {
                type: 'checkbox',
                style: { marginRight: '10px' },
                checked: isSelected(env),
                disabled: !canEdit || spaceEnvironments.length < 2,
                onChange: () => toggleEnvironmentSelection(env)
              }),
              codeFragment([env.sys.id])
            ]
          ),
          ihspace('6px'),
          h(copyButton, { value: env.sys.id }),
          ihspace('2em'),
          env.sys.id === 'master' && badge({}, ['Default environment'])
        ]
      )
    )
  );
}
