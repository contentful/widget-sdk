import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { TypeformEmbed } from './TypeformEmbed.es6';

export class TypeformModal extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    typeformUrl: PropTypes.string.isRequired,
    onTypeformSubmit: PropTypes.func,
    testId: PropTypes.string
  };

  static defaultProps = {
    onTypeformSubmit: () => this.props.onClose(),
    testId: 'cf-ui-typeform-modal'
  };

  render() {
    const { title, isShown, onClose, typeformUrl, onTypeformSubmit, testId } = this.props;

    return (
      <Modal
        title={title}
        isShown={isShown}
        onClose={onClose}
        allowHeightOverflow
        size="700px"
        testId={testId}>
        <TypeformEmbed
          url={typeformUrl}
          renderAs="widget"
          widgetOpacity={0}
          onSubmit={onTypeformSubmit}
          className="cf-typeform-modal"
        />
      </Modal>
    );
  }
}
