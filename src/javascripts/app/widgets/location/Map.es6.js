import { isNumber } from 'lodash';
import { observeResize } from 'ui/ResizeDetector.es6';
import * as K from 'utils/kefir.es6';
import * as LazyLoader from 'utils/LazyLoader.es6';

/**
 * Create a Google Map inside an element and react to scope data
 * changes to update the map and vice versa.
 *
 * This is used by the `cfLocationEditor` directive and uses its scope.
 */
export function init(scope, mapSlotElement) {
  let destroyed = false;
  scope.$on('$destroy', () => {
    destroyed = true;
  });

  scope.isLoading = true;
  LazyLoader.get('googleMaps').then(
    GMaps => {
      if (!destroyed) {
        scope.isLoading = false;
        initMap(scope, GMaps, mapSlotElement);
        scope.$applyAsync();
      }
    },
    () => {
      scope.isLoading = false;
      scope.loadError = true;
      scope.$applyAsync();
    }
  );
}

function initMap(scope, GMaps, mapSlotElement) {
  let map = new GMaps.Map(mapSlotElement, {
    scrollwheel: false,
    zoom: 6,
    center: { lat: 52.5018, lng: 13.41115439 },
    mapTypeId: GMaps.MapTypeId.ROADMAP
  });

  K.onValueScope(scope, observeResize(mapSlotElement), () => {
    GMaps.event.trigger(map, 'resize');
  });

  let marker = new GMaps.Marker({
    map,
    position: map.getCenter(),
    draggable: true,
    visible: true
  });

  scope.$watch('isDisabled', isDisabled => {
    marker.setDraggable(!isDisabled);
  });

  scope.$watchCollection('location', location => {
    const latLng = toLatLng(location);
    if (latLng) {
      marker.setVisible(true);
      marker.setPosition(latLng);
      map.panTo(latLng);
    } else {
      marker.setVisible(false);
    }
  });

  GMaps.event.addListener(marker, 'dragend', event => {
    scope.$apply(() => {
      scope.location = fromLatLng(event.latLng);
      scope.search.updateAddressFromLocation();
    });
  });

  GMaps.event.addListener(map, 'click', event => {
    scope.$apply(() => {
      const latLng = event.latLng;
      if (!toLatLng(scope.location) && !scope.isDisabled) {
        marker.setPosition(latLng);
        scope.location = fromLatLng(latLng);
        scope.search.updateAddressFromLocation();
      }
    });
  });

  scope.$on('$destroy', () => {
    GMaps.event.clearInstanceListeners(map);
    GMaps.event.clearInstanceListeners(marker);
    map = null;
    marker = null;
  });
}

function fromLatLng(latLng) {
  if (latLng) {
    return { lat: latLng.lat(), lon: latLng.lng() };
  } else {
    return {};
  }
}

function toLatLng(location) {
  if (location && isNumber(location.lat) && isNumber(location.lon)) {
    return { lat: location.lat, lng: location.lon };
  } else {
    return null;
  }
}