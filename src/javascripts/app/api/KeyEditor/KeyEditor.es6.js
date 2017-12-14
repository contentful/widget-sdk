import {h} from 'ui/Framework';
import {byName as Colors} from 'Styles/Colors';
import {assign} from 'utils/Collections';
import {container} from 'ui/Layout';
import {docsLink} from 'ui/Content';
import renderEnvironmentSelector from './EnvironmentSelector';

export default function ({data, initialValue, connect}) {
  update(initialValue);

  function update (model) {
    const component = renderForm({data, model, update});
    connect(model, component);
  }
}

function renderForm ({data, model, update}) {
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
      [inputWithCopy(data.spaceId, 'space-id', 'space')]
    ),

    section(
      'Content Delivery API - access token',
      null,
      [inputWithCopy(data.deliveryToken, 'delivery-token', 'cda')]
    ),

    separator(),

    section(
      'Content Preview API - access token',
      [
        'Preview unpublished content using this API (i.e. content with “Draft” status). ',
        docsLink('Read more.', 'content_preview')
      ],
      [inputWithCopy(data.previewToken, 'preview-token', 'cpa')]
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

function inputWithCopy (value, name, _trackingKey) {
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
    })
    // TODO copy to clipboard button
    // h('cf-copy-to-clipboard', {
    //   ngClick: `track.copy('${_trackingKey}')`,
    //   text: value
    // })
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
