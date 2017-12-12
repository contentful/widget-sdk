import {assign} from 'lodash';
import {h} from 'ui/Framework';
import {container} from 'ui/Layout';
import * as Workbench from 'app/Workbench';
import * as Colors from 'Styles/Colors';
import {docsLink} from 'ui/Content';
import pageApiIcon from 'svg/page-apis';

export default function () {
  const title = [
    '{{ context.title | truncate:50 }}{{ context.dirty ? "*" : "" }}',
    h('cf-knowledge-base.workbench-header__kb-link', {target: 'api_key'})
  ];

  const actions = [
    h('button.btn-secondary-action', {
      ngIf: 'apiKeyEditor.data.canEdit',
      cfContextMenuTrigger: true,
      dataTestId: 'apiKey.delete'
    }, ['Delete']),
    h('.delete-confirm.context-menu.x--arrow-right', {cfContextMenu: 'bottom-left'}, [
      h('p', [
        'You are about to delete {{context.title}}'
      ]),
      h('button.btn-caution', {
        uiCommand: 'apiKeyEditor.remove',
        dataTestId: 'apiKey.deleteConfirm'
      }, ['Delete']),
      h('button.btn-secondary-action', ['Don’t delete'])
    ]),
    h('button.btn-primary-action', {
      uiCommand: 'apiKeyEditor.save',
      dataTestId: 'apiKey.save',
      cfWhenDisabled: 'createApiKey'
    }, ['Save'])
  ];
  return h('.workbench', [
    Workbench.header({ title, actions, icon: pageApiIcon }),
    h('cf-loader', {watchStateChange: 'true'}),
    main()
  ]);
}

function main () {
  return h('.workbench-main.x--content', [
    h('.entity-editor__notification', {ngIf: '!apiKeyEditor.data.canEdit', role: 'alert'}, [
      h('p', [
        'You have read-only access to this API key. ',
        'If you need to edit it please contact your administrator.'
      ])
    ]),
    h('.api-key-editor__form', {
      ngForm: 'apiKeyForm',
      style: {
        display: 'flex',
        lineHeight: '1.5',
        margin: '1.5rem auto 0',
        padding: '0 5em',
        maxWidth: '90em',
        color: Colors.byName.textMid
      }
    }, [
      h('div', keyEditor()),
      container({
        marginLeft: '4em',
        width: '30em',
        flexShrink: 0
      }, [
        boilerplateInfo(),
        h('cf-contact-us-boilerplate')
      ])
    ])
  ]);
}

function keyEditor () {
  return [
    h('h3.section-title', ['Access tokens']),
    container({
      marginBottom: '1.5em'
    }, [
      'To query and get content using the APIs, client applications ',
      'need to authenticate with both the Space ID and an access token.'
    ]),

    section(
      ['Name'],
      ['Can be platform or device specific names (i.e. marketing website, tablet, VR app)'],
      h('input.cfnext-form__input--full-size', {
        type: 'text',
        name: 'name',
        ngModel: 'apiKeyEditor.model.name',
        required: true,
        ngDisabled: '!apiKeyEditor.data.canEdit'
      })
    ),

    section(
      ['Space ID'],
      null,
      [ inputWithCopy('apiKeyEditor.data.spaceId', 'space-id', 'space') ]
    ),

    section(
      ['Content Delivery API - access token'],
      null,
      [
        readonlyInput(
          'The key will be automatically generated upon saving.',
          {ngHide: 'apiKeyEditor.data.deliveryToken'}
        ),
        inputWithCopy(
          'apiKeyEditor.data.deliveryToken',
          'delivery-token', 'cda',
          {ngShow: 'apiKeyEditor.data.deliveryToken'}
        )
      ]
    ),

    separator(),

    section(
      ['Content Preview API - access token'],
      [
        'Preview unpublished content using this API (i.e. content with “Draft” status). ',
        docsLink('Read more.', 'content_preview')
      ],
      [
        readonlyInput(
          'The key will be automatically generated upon saving.',
          {ngHide: 'apiKeyEditor.data.previewToken'}
        ),
        inputWithCopy(
          'apiKeyEditor.data.previewToken',
          'preview-token', 'cpa',
          {ngShow: 'apiKeyEditor.data.previewToken'}
        )
      ]
    )
  ];
}

function boilerplateInfo () {
  return h('div', {
    ngShow: 'boilerplate',
    style: {
      color: Colors.byName.textMid,
      backgroundColor: Colors.byName.iceMid,
      border: `1px solid ${Colors.byName.iceDark}`,
      padding: '0.75em 2em',
      marginBottom: '4em'
    }
  }, [
    h4(['Getting started']),
    h('p', [
      'Prototype faster with boilerplate code as a base.'
    ]),
    h('label', {
      style: {
        display: 'block',
        marginBottom: '0.375em'
      }
    }, ['Select your language']),
    h('select.cfnext-select-box', {
      style: {display: 'block', width: '100%'},
      ngModel: 'boilerplate.selectedId',
      ngChange: 'track.boilerplate.select(boilerplate.platform)',
      ngOptions: 'bp.id as bp.name for bp in boilerplate.available'
    }),
    h('a.btn-action.x--block', {
      href: '{{boilerplate.sourceUrl}}',
      ngClick: 'track.boilerplate.download(boilerplate.platform)',
      style: {margin: '0.75em 0'}
    }, [ 'Download boilerplate .zip' ]),
    h4(['Run locally'], {marginTop: '1.5em'}),
    h('div.api-key-boilerplate-instructions', {
      ngBindHtml: 'boilerplate.instructions',
      style: {overflowWrap: 'break-word'}
    })
  ]);
}

function readonlyInput (value, props) {
  return h('input.cfnext-form__input--full-size', assign({
    type: 'text',
    readonly: true,
    value: value
  }, props));
}

function separator () {
  return container({
    height: '1px',
    width: '100%',
    backgroundColor: Colors.byName.elementMid,
    margin: '2.5em 0'
  });
}


function inputWithCopy (valueRef, name, trackingKey, props) {
  return h('.cfnext-form__input-group--full-size', props, [
    h('input.cfnext-form__input--full-size', {
      type: 'text',
      name: name,
      cfSelectAllInput: true,
      value: `{{${valueRef}}}`,
      readonly: true
    }),
    h('cf-copy-to-clipboard', {
      ngClick: `track.copy('${trackingKey}')`,
      text: `{{${valueRef}}}`
    })
  ]);
}


function section (title, description, content) {
  return container({
    marginBottom: '2rem'
  }, [
    h4(title),
    description && h('div', description),
    container({height: '0.375em'})
  ].concat(content));
}


function h4 (contents, style = {}) {
  return h('h4.h-reset', {
    style: style
  }, contents);
}
