import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import {
  Heading,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import * as Navigator from 'states/Navigator';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

const styles = {
  knowledgeBaseIcon: css({
    lineHeight: tokens.lineHeightXl,
    marginLeft: tokens.spacing2Xs,
    padding: `0 ${tokens.spacing2Xs}`,
    fontSize: tokens.fontSizeXl,
  }),
};

export function KeyEditorWorkbench(props) {
  return (
    <Workbench>
      <Workbench.Header
        title={
          <>
            {props.title && <Heading>{props.title}</Heading>}
            {!props.title && (
              <SkeletonContainer svgHeight={21} svgWidth={300} clipId="loading-api-key-header">
                <SkeletonDisplayText lineHeight={21} width={270} />
              </SkeletonContainer>
            )}
            <div className={styles.knowledgeBaseIcon}>
              <KnowledgeBase target="api_key" />
            </div>
          </>
        }
        icon={<ProductIcon icon="Apis" size="large" />}
        onBack={() => {
          Navigator.go({ path: '^.list' });
        }}
        actions={props.actions}
      />
      <Workbench.Content type="text">
        {props.children ? (
          props.children
        ) : (
          <SkeletonContainer
            svgWidth={600}
            svgHeight={300}
            ariaLabel="Loading api key..."
            clipId="loading-api-key">
            <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        )}
      </Workbench.Content>
    </Workbench>
  );
}

KeyEditorWorkbench.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.any,
};
