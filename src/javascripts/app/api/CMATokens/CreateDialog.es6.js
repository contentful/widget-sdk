import { h } from 'utils/legacy-html-hyperscript/index.es6';
import { vheight } from 'ui/Layout.es6';
import { track } from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const Command = getModule('command');
const { open: openDialog } = getModule('modalDialog');

/**
 * Opens a dialog that for creating a personal access token.
 *
 * The user is asked to input the token name. If the token is created
 * successfully we show the token with a “copy” control. Otherwise we
 * show an error message and allow the user to retry.
 *
 * The 'auth' parameter is provided by the 'Authentication' module to
 * authenticate API requests.
 *
 * The 'successHandler' parameter is provided by a module creating this
 * dialog window, and it will be called after successful token creation.
 */
export default function open(tokenResourceManager, successHandler) {
  return openDialog({
    template: dialogTemplate(),
    controller: $scope => initController(tokenResourceManager, $scope, successHandler),
    backgroundClose: false
  }).promise;
}

function initController(tokenResourceManager, $scope, successHandler) {
  $scope.input = {};
  $scope.state = { input: true };

  $scope.createToken = Command.create(() => {
    const tokenName = ($scope.input.tokenName || '').trim();
    const valid = validate(tokenName);
    if (valid) {
      return tokenResourceManager.create(tokenName).then(data => {
        track('personal_access_token:action', { action: 'create', patId: data.sys.id });
        showSuccess(tokenName, data.token);
        if (successHandler) {
          successHandler();
        }
      }, showFailure);
    }
  });

  $scope.buildTokenInputProps = () => ({
    value: $scope.state.token,
    name: 'tokenInput',
    'data-test-id': 'pat.create.tokenCopy',
    'cf-select-all-input': 'true',
    id: 'tokenInput',
    withCopyButton: true,
    disabled: true
  });

  function showSuccess(name, token) {
    $scope.state = {
      success: true,
      tokenName: name,
      token
    };
  }

  function showFailure() {
    $scope.state = {
      failure: true
    };
  }

  function validate(name) {
    $scope.hasError = !name;
    return !!name;
  }
}

/**
 * Template for the token generation dialog. Consists of three parts
 * - Input for token name and generate button (`inputTemplate()`)
 * - Success message with copyable token (`successTemplate()`)
 * - Error message on server error with retry button (`failureTemplate()`)
 *
 * Provides the following `data-test-id` hooks for UI acceptance tests
 * - 'pat.create.tokenName' Input for the token name
 * - 'pat.create.generate' Button to submit the token name
 * - 'pat.create.tokenCopy' Input to extract the generated token
 * - 'pat.create.tokenGenerationFailed' Alert shown on server error
 */
function dialogTemplate() {
  return h('.modal-background', [
    h(
      '.modal-dialog',
      {
        style: {
          minWidth: '0'
        }
      },
      [
        h('header.modal-dialog__header', [
          h('h1', ['Generate Personal Access Token']),
          h('button.modal-dialog__close', { ngClick: 'dialog.cancel()' })
        ]),
        h(
          '.modal-dialog__content',
          {
            // TODO should be set in stylesheet
            style: { paddingBottom: '30px' }
          },
          dialogContentTemplate()
        )
      ]
    )
  ]);
}

function dialogContentTemplate() {
  return [
    h(
      'div',
      {
        style: { width: '32em' }
      },
      [
        h('div', { ngIf: 'state.input' }, inputTemplate()),
        h('div', { ngIf: 'state.success' }, successTemplate()),
        h('div', { ngIf: 'state.failure' }, failureTemplate())
      ]
    )
  ];
}

function successTemplate() {
  return [
    h('.note-box--success', [
      h('h3', ['<em>{{state.tokenName}}</em> is ready!']),
      h('p', [
        `Make sure to <em class="x--underline">immediately</em> copy your
        new Personal Access Token. You won’t be able to see it again!`
      ])
    ]),
    h('div', { style: { marginTop: `${vheight(3)}px` } }),
    h('react-component', {
      name: '@contentful/forma-36-react-components/TextInput',
      props: 'buildTokenInputProps()'
    }),
    h('div', { style: { marginTop: `${vheight(3)}px` } }),
    h('button.btn-action', { ngClick: 'dialog.confirm()' }, ['Done'])
  ];
}

function failureTemplate() {
  return [
    h(
      '.note-box--warning',
      {
        role: 'alert',
        dataTestId: 'pat.create.tokenGenerationFailed'
      },
      [
        h('p', [
          `The token generation failed. We've been informed about this
        problem. Please retry shortly, or reach out to our support team
        if the problem persists.`
        ])
      ]
    ),
    h('div', { style: { marginTop: `${vheight(3)}px` } }),
    h('div', { style: { display: 'flex' } }, [
      h('button.btn-action', { uiCommand: 'createToken' }, ['Retry']),
      h('div', { style: { marginLeft: 'auto' } }),
      h('button.btn-plain', { ngClick: 'dialog.confirm()' }, ['Close window'])
    ])
  ];
}

function inputTemplate() {
  return [
    h(
      'form',
      {
        ngSubmit: 'createToken.execute()'
      },
      [
        h('.cfnext-form__field', [
          h(
            'label',
            {
              style: { fontWeight: 'bold' }
            },
            ['Token name']
          ),
          h('input.cfnext-form__input', {
            ngModel: 'input.tokenName',
            dataTestId: 'pat.create.tokenName',
            ariaInvalid: '{{hasError && "true"}}',
            uiAutofocus: 'true',
            type: 'text',
            maxlength: '150',
            style: { width: '100%' }
          }),
          h(
            'p.cfnext-form__field-error',
            {
              ngIf: 'hasError'
            },
            ['Please provide the name']
          ),
          h('p.cfnext-form__hint', ['Be descriptive, e.g. “testing my app” (150 chars max.)'])
        ]),
        h(
          'button.btn-action',
          {
            uiCommand: 'createToken',
            dataTestId: 'pat.create.generate'
          },
          ['Generate']
        )
      ]
    )
  ];
}
