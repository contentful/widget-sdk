import React, { useState } from 'react';
import ContentTypesPageReact from 'app/ContentModel/Editor/ContentTypesPage';
import { getModule } from 'core/NgRegistry';

function getCurrentTab($state) {
  if ($state.is('^.preview')) {
    return 'preview';
  }
  if ($state.is('^.sidebar_configuration')) {
    return 'sidebar_configuration';
  }
  if ($state.is('^.entry_editor_configuration')) {
    return 'entry_editor_configuration';
  }
  return 'fields';
}

const Container = (props) => {
  const $state = getModule('$state');
  const [currentTab, setCurrentTab] = useState(getCurrentTab($state));
  const {
    params: { contentTypeId },
    current: { name },
  } = $state;

  const isNew = name.split('.').includes('new');
  return (
    <ContentTypesPageReact
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      contentTypeId={contentTypeId}
      isNew={isNew}
      {...props}
    />
  );
};

export default Container;
