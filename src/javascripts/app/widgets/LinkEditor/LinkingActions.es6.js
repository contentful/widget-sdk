import { noop } from 'lodash';
import pluralize from 'pluralize';
import { css } from 'emotion';
import React from 'react';
import PropTypes from 'prop-types';
import Visible from 'components/shared/Visible/index.es6';
import { TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import {
  default as CreateEntryButton,
  Style as CreateEntryStyle
} from 'components/CreateEntryButton/index.es6';
import { TYPES } from './Util.es6';

const TYPE_NAMES = {
  [TYPES.ENTRY]: 'entry',
  [TYPES.ASSET]: 'asset'
};

export const labels = {
  createAndLink: name => `Create new ${name} and link`,
  linkExisting: name => `Link existing ${name}`
};

export const testIds = {
  createAndLink: 'linkEditor.createAndLink',
  linkExisting: 'linkEditor.linkExisting'
};

const styles = {
  linkEditor: css({
    display: 'flex',
    alignItems: 'baseline',
    marginTop: tokens.spacingS,
    '> *:not(:first-child)': {
      marginLeft: '20px'
    }
  })
};

export default class LinkingActions extends React.Component {
  static propTypes = {
    type: PropTypes.oneOf(Object.values(TYPES)).isRequired,
    isDisabled: PropTypes.bool,
    isSingle: PropTypes.bool,
    canCreateEntity: PropTypes.bool.isRequired,
    contentTypes: PropTypes.arrayOf(PropTypes.object),
    onCreateAndLink: PropTypes.func,
    onLinkExisting: PropTypes.func
  };

  static defaultProps = {
    contentTypes: [],
    onCreateAndLink: noop,
    onLinkExisting: noop
  };

  render() {
    const {
      type,
      isSingle,
      canCreateEntity,
      contentTypes,
      onCreateAndLink,
      onLinkExisting
    } = this.props;
    const typeName = TYPE_NAMES[type];
    const singleCtOrTypeName = contentTypes.length === 1 ? contentTypes[0].name : typeName;
    return (
      <div className={styles.linkEditor}>
        <Visible if={type === TYPES.ENTRY && canCreateEntity}>
          <CreateEntryButton
            testId={testIds.createAndLink}
            text={labels.createAndLink(singleCtOrTypeName)}
            contentTypes={contentTypes}
            hasPlusIcon={true}
            style={CreateEntryStyle.Link}
            onSelect={contentType => onCreateAndLink(contentType)}
          />
        </Visible>
        <Visible if={type === TYPES.ASSET && canCreateEntity}>
          <TextLink
            testId={testIds.createAndLink}
            onClick={() => onCreateAndLink(null)}
            linkType="primary"
            icon="Link">
            {labels.createAndLink(typeName)}
          </TextLink>
        </Visible>
        <TextLink
          testId={testIds.linkExisting}
          onClick={onLinkExisting}
          linkType="primary"
          icon="Link">
          {labels.linkExisting(isSingle ? typeName : pluralize(typeName))}
        </TextLink>
      </div>
    );
  }
}
