import * as React from 'react';
import { haveMarks } from './UtilHave.es6';
import { actionOrigin, TOOLBAR_PLUGIN_PROP_TYPES } from './PluginApi.es6';

export default ({ type, title, icon }) => Mark => {
  return class CommonToggleMark extends React.Component {
    static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

    handleToggle = e => {
      const {
        change,
        onToggle,
        richTextAPI: { logAction }
      } = this.props;
      e.preventDefault();
      onToggle(change.toggleMark(type));
      const action = haveMarks(change, type) ? 'mark' : 'unmark';
      logAction(action, { origin: actionOrigin.TOOLBAR, markType: type });
    };

    render() {
      const { change, disabled } = this.props;
      return (
        <Mark
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleToggle}
          isActive={haveMarks(change, type)}
          disabled={disabled}
        />
      );
    }
  };
};
