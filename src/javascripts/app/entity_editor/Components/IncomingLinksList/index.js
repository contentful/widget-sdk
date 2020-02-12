import React from 'react';
import PropTypes from 'prop-types';
import {
  TextLink,
  Paragraph,
  List,
  ListItem,
  Typography
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { template } from '../template';
import { Origin as IncomingLinksOrigin } from 'analytics/events/IncomingLinks';

const styles = {
  incomingLinksList: css({
    maxHeight: '143px',
    overflowYy: 'auto'
  }),
  incomingLinksItem: css({
    marginLeft: tokens.spacingL,
    listStyleType: 'disc'
  }),
  incomingLinksLink: css({
    display: 'inline-block',
    maxWidth: tokens.contentWidthFull,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'top'
  })
};

class IncomingLinksList extends React.Component {
  static propTypes = {
    links: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string,
        url: PropTypes.string.isRequired
      }).isRequired
    ).isRequired,
    message: PropTypes.string.isRequired,
    origin: PropTypes.oneOf([IncomingLinksOrigin.DIALOG, IncomingLinksOrigin.SIDEBAR]).isRequired,
    onComponentMount: PropTypes.func,
    onClick: PropTypes.func
  };

  componentDidMount() {
    if (this.props.onComponentMount) {
      this.props.onComponentMount();
    }
  }

  handleClick = linkEntityId => {
    if (this.props.onClick) {
      this.props.onClick({
        linkEntityId,
        incomingLinksCount: this.props.links.length
      });
    }
  };

  render() {
    const { links, message } = this.props;

    return (
      <Typography>
        <div data-test-id="links">
          <Paragraph>{template(message, { numberOfLinks: links.length })}</Paragraph>
          <List className={styles.incomingLinksList}>
            {links.map(({ id, url, ...link }) => {
              const title = link.title || 'Untitled';

              return (
                <ListItem key={url} className={styles.incomingLinksItem}>
                  <TextLink
                    className={styles.incomingLinksLink}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={title}
                    testId="link"
                    onClick={() => this.handleClick(id)}>
                    {title}
                  </TextLink>
                </ListItem>
              );
            })}
          </List>
        </div>
      </Typography>
    );
  }
}

export default IncomingLinksList;
