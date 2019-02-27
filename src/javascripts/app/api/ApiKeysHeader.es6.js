import React from 'react';
import Icon from 'ui/Components/Icon.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

function ApiKeysHeader() {
  return (
    <div className="workbench-header__wrapper">
      <header className="workbench-header">
        <div className="workbench-header__icon">
          <Icon scale="0.75" name="page-apis" />
        </div>
        <h1 className="workbench-header__title">
          APIs
          <KnowledgeBase target="api_key" className="workbench-header__kb-link" />
        </h1>
      </header>
    </div>
  );
}

export default ApiKeysHeader;
