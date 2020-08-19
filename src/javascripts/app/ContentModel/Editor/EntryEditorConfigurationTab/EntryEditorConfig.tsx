import React, { useReducer, useEffect } from 'react';
import { css } from 'emotion';
import { reducer } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer'; // Replace
import {
  convertInternalStateToConfiguration,
  convertConfigurationToInternalState,
} from 'app/EntrySidebar/Configuration/service/SidebarSync'; // Replace
import WidgetsConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration';
import { create } from 'widgets/BuiltinWidgets';
import { WidgetNamespace, Editor } from 'features/widget-renderer';
import WidgetParametersConfiguration from 'app/EntrySidebar/Configuration/WidgetParametersConfiguration'; // Replace
import { defaultWidgetsMap } from 'app/EntrySidebar/Configuration/defaults';

const styles = {
  container: css({
    margin: '0 auto',
    marginBottom: '60px',
  }),
};

interface EditorConfigProps {
  onUpdateConfiguration: () => void,
  defaultWidgets: Editor[],
  customWidgets: Editor[],
  configuration: Object
}

function EntryEditorConfiguration(props: EditorConfigProps) {
  const { onUpdateConfiguration, defaultWidgets, customWidgets, configuration } = props;

  const [state, dispatch] = useReducer(
    reducer,
    {
      items: (configuration.length ? configuration :  defaultWidgets),
      availableItems: customWidgets,
      configurableWidget: null
    }
  );
 console.log(state)

  useEffect(() => {
    onUpdateConfiguration(convertInternalStateToConfiguration(state, defaultWidgets));
  }, [state, onUpdateConfiguration, defaultWidgets]);

  return (
    <div className={styles.container}>
      {state.configurableWidget === null && (
        <WidgetsConfiguration
          state={state}
          dispatch={dispatch}
          defaultAvailableItems={[...defaultWidgets]}
          configuration={{
            location: 'Tabs',
            description: 'Configure the tabs of the entry editor for this content type.',
          }}
        />
      )}
      {state.configurableWidget !== null && (
        <WidgetParametersConfiguration widget={state.configurableWidget} dispatch={dispatch} />
      )}
    </div>
  );
}

export default (props: Omit<EditorConfigProps, 'defaultWidgets'>) => {
  const defaultEditors = create().filter(
    (editor) => editor.namespace === WidgetNamespace.EDITOR_BUILTIN
  );
  const defaultWidgets = defaultEditors.map((editor) => ({
    widgetId: editor.id,
    widgetNamespace: editor.namespace,
    ...editor,
  }));

  return <EntryEditorConfiguration {...props} defaultWidgets={defaultWidgets} />;
};
