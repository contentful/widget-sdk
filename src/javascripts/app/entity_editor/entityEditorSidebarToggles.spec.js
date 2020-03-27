import initSidebarTogglesProps from 'app/entity_editor/entityEditorSidebarToggles';

describe('entityEditorSidebarToggles', () => {
  let props;
  const $scope = {
    $digest: () => {},
  };
  const $rootScope = {
    $broadcast: jest.fn(),
  };

  beforeEach(() => {
    $rootScope.$broadcast.mockReset();
    props = initSidebarTogglesProps($rootScope, $scope);
  });

  it('closes panels by default', () => {
    expect(props.auxToggle.isActive).toBeFalsy();
    expect(props.commentsToggle.isActive).toBeFalsy();
  });

  it('opens aux panel', () => {
    props.auxToggle.onClick();
    expect(props.auxToggle.isActive).toBeTruthy();
    expect($rootScope.$broadcast).toBeCalledWith('show-aux-panel', true);
  });

  it('opens comments panel', () => {
    props.commentsToggle.onClick();
    expect(props.commentsToggle.isActive).toBeTruthy();
    expect($rootScope.$broadcast).toBeCalledWith('show-comments-panel', true);
  });

  it('closes comments panel when opening aux panel', () => {
    props.commentsToggle.onClick();
    props.auxToggle.onClick();
    expect(props.commentsToggle.isActive).toBeFalsy();
    expect($rootScope.$broadcast).toBeCalledWith('show-comments-panel', false);
  });

  it('closes aux panel when opening comments panel', () => {
    props.auxToggle.onClick();
    props.commentsToggle.onClick();
    expect(props.auxToggle.isActive).toBeFalsy();
    expect($rootScope.$broadcast).toBeCalledWith('show-aux-panel', false);
  });
});
