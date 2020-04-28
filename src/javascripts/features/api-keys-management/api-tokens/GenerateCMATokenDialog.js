import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { track } from 'analytics/Analytics';
import { Modal, TextField, Button, Note, TextInput } from '@contentful/forma-36-react-components';

const styles = {
  generateWrapper: css({ marginTop: tokens.spacingL }),
  closeWrapper: css({ marginTop: tokens.spacingXl }),
  closeButton: css({ marginLeft: tokens.spacingM }),
  note: css({ marginBottom: tokens.spacingL }),
  testInput: css({ marginBottom: tokens.spacingL }),
  doneButton: css({ marginTop: tokens.spacingL }),
};

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

function InputState(props) {
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
        onChange={(e) => {
          props.setTokenName((e.target.value || '').trim());
        }}
      />
      <div className={styles.generateWrapper}>
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
  onGenerateClick: PropTypes.func.isRequired,
};

function FailureState(props) {
  return (
    <>
      <Note testId="pat.create.tokenGenerationFailed" noteType="negative">
        The token generation failed. We&quot;ve been informed about this problem. Please retry
        shortly, or reach out to our support team if the problem persists.
      </Note>
      <div className={styles.closeWrapper}>
        <Button testId="pat.create.retry" buttonType="primary" onClick={props.onRetryClick}>
          Retry
        </Button>
        <Button className={styles.closeButton} buttonType="muted" onClick={props.onCloseClick}>
          Close
        </Button>
      </div>
    </>
  );
}

FailureState.propTypes = {
  onRetryClick: PropTypes.func.isRequired,
  onCloseClick: PropTypes.func.isRequired,
};

function SuccessStatus(props) {
  return (
    <div data-test-id="pat.create.successStatus">
      <Note
        testId="pat.create.tokenGenerationSuccess"
        className={styles.note}
        noteType="positive"
        title={`"${props.tokenName}" is ready!`}>
        Make sure to <em>immediately</em> copy your new Personal Access Token. You won&apos;t be
        able to see it again!
      </Note>
      <TextInput className={styles.textInput} value={props.tokenValue} disabled withCopyButton />
      <div>
        <Button
          className={styles.doneButton}
          testId="pat.create.done-button"
          buttonType="primary"
          onClick={props.onDoneClick}>
          Done
        </Button>
      </div>
    </div>
  );
}

SuccessStatus.propTypes = {
  tokenName: PropTypes.string.isRequired,
  tokenValue: PropTypes.string.isRequired,
  onDoneClick: PropTypes.func.isRequired,
};

export function GenerateCMATokenDialog(props) {
  const [tokenName, setTokenName] = useState('');
  const [tokenValue, setTokenValue] = useState('');
  const [status, setStatus] = useState('input');

  const onGenerateClick = useCallback(() => {
    props.createToken(tokenName).then(
      (data) => {
        track('personal_access_token:action', { action: 'create', patId: data.sys.id });
        setTokenValue(data.token);
        setStatus('success');
        if (props.successHandler) {
          props.successHandler({
            sys: data.sys,
            name: data.name,
            token: data.token,
          });
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
  successHandler: PropTypes.func.isRequired,
};

GenerateCMATokenDialog.propTypes = GenerateCMATokenDialogPropTypes;
