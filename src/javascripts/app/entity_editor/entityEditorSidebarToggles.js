export default function initSidebarTogglesProps($rootScope, $scope) {
  const props = {
    auxToggle: {
      isActive: false,
      onClick: function() {
        props.auxToggle.isActive = !props.auxToggle.isActive;
        props.commentsToggle.isActive = false;
        $scope.$digest();
        broadcastUpdate(props);
      }
    },
    commentsToggle: {
      commentsCount: undefined,
      isActive: false,
      onClick: function() {
        props.auxToggle.isActive = false;
        props.commentsToggle.isActive = !props.commentsToggle.isActive;
        $scope.$digest();
        broadcastUpdate(props);
      }
    }
  };

  function broadcastUpdate(props) {
    $rootScope.$broadcast('show-aux-panel', props.auxToggle.isActive);
    $rootScope.$broadcast('show-comments-panel', props.commentsToggle.isActive);
  }

  return props;
}
