import React from 'react';
import PropTypes from 'prop-types';
import TokenTable from './TokenTable';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note, SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import Paginator from 'ui/Components/Paginator';
import { LinkOpen } from 'ui/Content';
import * as Config from 'Config';

const styles = {
  tableWrapper: css({
    position: 'relative',
    minHeight: '6em',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
  }),
};

/**
 * Template for the token table and the pagination
 *
 * Also includes the error note box when fetching the tokens failed and
 * the loader.
 */
const TokenList = ({
  loadingTokens,
  loadingTokensError,
  tokens,
  currentPage,
  totalPages,
  revoke,
  selectPage,
}) => {
  if (loadingTokensError) {
    return (
      <Note noteType="warning" data-test-id="pat.error">
        The list of tokens failed to load, try refreshing the page. If the problem persists{' '}
        <LinkOpen key="contact-support-link" url={Config.supportUrl}>
          contact support
        </LinkOpen>
      </Note>
    );
  }

  return (
    <div data-test-id="pat.list">
      <div className={styles.tableWrapper}>
        {loadingTokens && (
          <SkeletonContainer
            testId="pat.loading"
            clipId="loading-tokens"
            ariaLabel="Loading..."
            svgWidth="100%"
            svgHeight={120}>
            <SkeletonBodyText numberOfLines={5} />
          </SkeletonContainer>
        )}
        <TokenTable tokens={tokens} revoke={revoke} />
      </div>
      <Paginator select={selectPage} page={currentPage} pageCount={totalPages} />
    </div>
  );
};

TokenList.propTypes = {
  loadingTokens: PropTypes.bool,
  loadingTokensError: PropTypes.bool,
  tokens: PropTypes.array,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  revoke: PropTypes.func,
  selectPage: PropTypes.func,
};

export default TokenList;
