import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';
import * as Navigator from 'states/Navigator';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

export default function KeyEditorWorkbench(props) {
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
            <div className="workbench-header__kb-link">
              <KnowledgeBase target="api_key" />
            </div>
          </>
        }
        icon={<NavigationIcon icon="apis" color="green" size="large" />}
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
