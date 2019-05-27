import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { track } from 'analytics/Analytics.es6';
import { Modal, TextField, Button, Note, TextInput } from '@contentful/forma-36-react-components';

export function openGenerateTokenDialog(createToken, successHandler) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <GenerateCMATokenDialog
      key={Date.now()}
      createToken={createToken}
      successHandler={successHandler}
      isShown={isShown}
      onConfirm={() => {
        onClose(true);
      }}
      onCancel={() => {
        onClose(false);
      }}
    />
  ));
}

export function InputState(props) {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <>
      <TextField
        testId="pat.create.tokenName"
        labelText="Token name"
        required
        helpText={`Be descriptive, e.g. “testing my app”`}
        textInputProps={{ maxLength: 150, inputRef: inputRef }}
        countCharacters
        id="tokenName"
        name="tokenName"
        value={props.tokenName}
        onChange={e => {
          props.setTokenName((e.target.value || '').trim());
        }}
      />
      <div className="f36-margin-top--l">
        <Button
          buttonType="primary"
          testId="pat.create.generate"
          disabled={!props.tokenName}
          onClick={props.onGenerateClick}>
          Generate
        </Button>
      </div>
    </>
  );
}

InputState.propTypes = {
  tokenName: PropTypes.string,
  setTokenName: PropTypes.func.isRequired,
  onGenerateClick: PropTypes.func.isRequired
};

export function FailureState(props) {
  return (
    <>
      <Note testId="pat.create.tokenGenerationFailed" noteType="negative">
        The token generation failed. We&quot;ve been informed about this problem. Please retry
        shortly, or reach out to our support team if the problem persists.
      </Note>
      <div className="f36-margin-top--xl">
        <Button testId="pat.create.retry" buttonType="primary" onClick={props.onRetryClick}>
          Retry
        </Button>
        <Button className="f36-margin-left--m" buttonType="muted" onClick={props.onCloseClick}>
          Close
        </Button>
      </div>
    </>
  );
}

FailureState.propTypes = {
  onRetryClick: PropTypes.func.isRequired,
  onCloseClick: PropTypes.func.isRequired
};

export function SuccessStatus(props) {
  return (
    <div data-test-id="pat.create.successStatus">
      <Note
        testId="pat.create.tokenGenerationSuccess"
        className="f36-margin-bottom--l"
        noteType="positive"
        title={`"${props.tokenName}" is ready!`}>
        Make sure to <em>immediately</em> copy your new Personal Access Token. You won&quot;t be
        able to see it again!
      </Note>
      <TextInput
        className="f36-margin-bottom--l"
        value={props.tokenValue}
        disabled
        withCopyButton
      />
      <div>
        <Button testId="pat.create.done-button" buttonType="primary" onClick={props.onDoneClick}>
          Done
        </Button>
      </div>
    </div>
  );
}

SuccessStatus.propTypes = {
  tokenName: PropTypes.string.isRequired,
  tokenValue: PropTypes.string.isRequired,
  onDoneClick: PropTypes.func.isRequired
};

export default function GenerateCMATokenDialog(props) {
  const [tokenName, setTokenName] = useState('');
  const [tokenValue, setTokenValue] = useState('');
  const [status, setStatus] = useState('input');

  const onGenerateClick = useCallback(() => {
    props.createToken(tokenName).then(
      data => {
        track('personal_access_token:action', { action: 'create', patId: data.sys.id });
        setTokenValue(data.token);
        setStatus('success');
        if (props.successHandler) {
          props.successHandler();
        }
      },
      () => {
        setStatus('failure');
      }
    );
  }, [props, tokenName]);

  return (
    <Modal title="Generate Personal Access Token" onClose={props.onCancel} isShown={props.isShown}>
      {status === 'input' && (
        <InputState
          tokenName={tokenName}
          setTokenName={setTokenName}
          onGenerateClick={onGenerateClick}
        />
      )}
      {status == 'failure' && (
        <FailureState
          onRetryClick={onGenerateClick}
          onCloseClick={() => {
            props.onCancel();
          }}
        />
      )}
      {status === 'success' && (
        <SuccessStatus
          tokenName={tokenName}
          tokenValue={tokenValue}
          onDoneClick={() => {
            props.onConfirm(tokenValue);
          }}
        />
      )}
    </Modal>
  );
}

const GenerateCMATokenDialogPropTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  createToken: PropTypes.func.isRequired,
  successHandler: PropTypes.func.isRequired
};

GenerateCMATokenDialog.propTypes = GenerateCMATokenDialogPropTypes;
