import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon.es6';
import * as Navigator from 'states/Navigator.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

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
        icon={<Icon name="page-apis" scale="0.8" />}
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
  actions: PropTypes.any
};
