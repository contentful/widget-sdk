import {h} from 'ui/Framework';
import {byName as Colors} from 'Styles/Colors';
import {assign} from 'utils/Collections';
import {container} from 'ui/Layout';
import {docsLink} from 'ui/Content';
import renderEnvironmentSelector from './EnvironmentSelector';
import copyIcon from 'svg/CopyIcon';
import copyToClipboard from 'utils/DomClipboardCopy';

export default function ({data, initialValue, connect, trackCopy}) {
  update(initialValue);

  function update (model) {
    const component = renderForm({data, model, update, trackCopy});
    connect(model, component);
  }
}

function renderForm ({data, model, update, trackCopy}) {
  return h('div', [
    h('h3.section-title', ['Access tokens']),

    container({
      marginBottom: '1.5em'
    }, [
      'To query and get content using the APIs, client applications ',
      'need to authenticate with both the Space ID and an access token.'
    ]),

    section(
      'Name',
      'Can be platform or device specific names (i.e. marketing website, tablet, VR app)',
      [input({canEdit: data.canEdit, model, key: 'name', update})]
    ),

    section(
      'Description',
      'You can provide an optional description for reference in the future',
      [input({canEdit: data.canEdit, model, key: 'description', update})]
    ),

    section(
      'Space ID',
      null,
      [inputWithCopy({value: data.spaceId, name: 'space-id', track: () => trackCopy('space')})]
    ),

    section(
      'Content Delivery API - access token',
      null,
      [inputWithCopy({value: data.deliveryToken, name: 'delivery-token', track: () => trackCopy('cda')})]
    ),

    separator(),

    section(
      'Content Preview API - access token',
      [
        'Preview unpublished content using this API (i.e. content with “Draft” status). ',
        docsLink('Read more.', 'content_preview')
      ],
      [inputWithCopy({value: data.previewToken, name: 'preview-token', track: () => trackCopy('cpa')})]
    ),

    data.environmentsEnabled && separator(),
    data.environmentsEnabled && section(
      'Environments',
      'Select environments that can be used with this API key. At least one environment has to be selected.',
      [
        renderEnvironmentSelector({
          canEdit: data.canEdit,
          spaceEnvironments: data.spaceEnvironments,
          envs: model.environments,
          updateEnvs: environments => update(assign(model, {environments}))
        })
      ]
    )
  ]);
}

function input ({canEdit, model, update, key}) {
  return h('input.cfnext-form__input--full-size', {
    type: 'text',
    name: key,
    value: model[key],
    onChange: e => update(assign(model, {[key]: e.target.value})),
    disabled: !canEdit
  });
}

function inputWithCopy ({value, name, track}) {
  return h('.cfnext-form__input-group--full-size', [
    h('input.cfnext-form__input--full-size', {
      style: {cursor: 'pointer'},
      type: 'text',
      name,
      readOnly: true,
      value,
      onClick: e => {
        e.target.focus();
        e.target.select();
      }
    }),
    h('.cfnext-form__icon-suffix.copy-to-clipboard.x--input-suffix', {
      onClick: () => {
        copyToClipboard(value);
        track();
      },
      style: {cursor: 'pointer', paddingTop: '3px'}
    }, [
      copyIcon()
    ])
  ]);
}

function section (title, description, content) {
  return h('div', {style: {marginBottom: '2rem'}}, [
    h('h4.h-reset', [title]),
    description && h('div', Array.isArray(description) ? description : [description]),
    h('div', {style: {height: '0.375em'}})
  ].concat(content));
}

function separator () {
  return h('div', {
    style: {
      height: '1px',
      width: '100%',
      backgroundColor: Colors.elementMid,
      margin: '2.5em 0'
    }
  });
}
