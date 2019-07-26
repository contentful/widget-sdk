/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import { css } from 'emotion';
import {
  Button,
  Heading,
  Paragraph,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow
} from '@contentful/forma-36-react-components';
import EmptyStateIllustration from 'svg/content-preview-empty-state.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

const styles = {
  illustrationWrapper: css({
    marginTop: 200,
    width: '25vw',
    minWidth: '280px',
    marginLeft: '-2vw'
  })
};

export default class ContentPreviewList extends Component {
  static propTypes = {
    contentPreviews: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired
      })
    ).isRequired
  };

  renderList() {
    return (
      <Table style={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.contentPreviews.map(preview => (
            <StateLink
              key={preview.sys.id}
              to="^.detail"
              params={{ contentPreviewId: preview.sys.id }}>
              {({ onClick }) => (
                <TableRow onClick={onClick} style={{ cursor: 'pointer' }}>
                  <TableCell>{preview.name}</TableCell>
                  <TableCell>{preview.description}</TableCell>
                </TableRow>
              )}
            </StateLink>
          ))}
        </TableBody>
      </Table>
    );
  }

  renderPlaceholderList() {
    return (
      <EmptyStateContainer>
        <div className={styles.illustrationWrapper}>
          <EmptyStateIllustration />
        </div>
        <Heading>Set up content preview</Heading>
        <Paragraph>
          To view your content in a live environment, set up content preview. Learn how to set up a
          custom content preview for this space in{' '}
          <KnowledgeBase target="content_preview" text="our guide" inlineText />.
        </Paragraph>
        <StateLink to="^.new">
          {({ onClick }) => (
            <Button buttonType="primary" onClick={onClick} testId="add-content-preview-button">
              Set up content preview
            </Button>
          )}
        </StateLink>
      </EmptyStateContainer>
    );
  }

  render() {
    const { contentPreviews } = this.props;
    return (
      <div>{contentPreviews.length > 0 ? this.renderList() : this.renderPlaceholderList()}</div>
    );
  }
}
