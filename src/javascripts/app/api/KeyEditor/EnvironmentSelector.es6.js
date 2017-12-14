import {h} from 'ui/Framework';
import {badge, stateLink} from 'ui/Content';
import {byName as Colors} from 'Styles/Colors';
import {find} from 'lodash';
import {filter, concat} from 'utils/Collections';
import infoIcon from 'svg/info';

export function makeLink (env) {
  return {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: env.sys.id
    }
  };
}

export default function (props) {
  return h('div', [
    renderList(props),
    props.spaceEnvironments.length < 2 && renderHint()
  ]);
}

function renderHint () {
  return h('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      background: Colors.iceMid,
      border: '1px solid ' + Colors.elementLight,
      padding: '15px',
      margin: '1.5em 0'
    }
  }, [
    infoIcon,
    h('p', {
      style: {
        color: Colors.textLight,
        margin: '0',
        marginLeft: '10px'
      }
    }, [
      `You haven't set up any additional environments for this space. Head to the `,
      stateLink('environment settings', 'spaces.detail.settings.environments'),
      ' to learn more.'
    ])
  ]);
}

function renderList ({canEdit, spaceEnvironments, envs, updateEnvs}) {
  const isSelected = env => !!find(envs, {sys: {id: env.sys.id}});

  const onChange = env => {
    if (isSelected(env)) {
      updateEnvs(filter(envs, cur => cur.sys.id !== env.sys.id));
    } else {
      updateEnvs(concat(envs, [makeLink(env)]));
    }
  };

  return h('div', spaceEnvironments.map(env => h('label', {
    style: {
      display: 'flex',
      alignItems: 'center',
      marginTop: '10px'
    }
  }, [
    h('input', {
      type: 'checkbox',
      style: {marginRight: '10px'},
      checked: isSelected(env),
      disabled: !canEdit || spaceEnvironments.length < 2,
      onChange: () => onChange(env)
    }),
    h('div', {style: {width: '60%'}}, [
      h('strong', {
        style: {
          display: 'inline-block',
          marginRight: '20px'
        }
      }, [
        env.name
      ]),
      env.sys.id === 'master' && badge({}, ['Default environment'])
    ]),
    h('span', {
      style: {
        display: 'inline-block',
        padding: '3px 5px',
        background: Colors.elementLightest,
        border: '1px solid ' + Colors.elementDark,
        fontFamily: 'monospace'
      }
    }, [
      env.sys.id
    ])
  ])));
}
