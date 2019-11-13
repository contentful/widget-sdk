import * as ReactDOM from 'react-dom';

export default function createMountPoint(container) {
  return { render, destroy };

  function render(root) {
    ReactDOM.render(root, container);
  }

  function destroy() {
    ReactDOM.unmountComponentAtNode(container);
  }
}
