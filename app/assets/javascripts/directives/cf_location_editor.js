/*global google:false*/
angular.module('contentful/directives').directive('cfLocationEditor', function(){
  'use strict';

  return {
    restrict: 'C',
    template: JST['cf_location_editor'],
    link: function(scope, elm) {
      var button = elm.find('button').hide();
      var map = new google.maps.Map(elm.find('.gmaps-container')[0], {
        zoom: 6,
        center: new google.maps.LatLng(51.16, 10.45),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
        
      var marker = new google.maps.Marker({
        map: map,
        position: map.getCenter(),
        draggable: true,
        visible: true
      });

      var setPosition = function(latLng) {
        if (latLng) {
          var pos = {
            lat: latLng.lat(),
            lon: latLng.lng()
          };
          scope.changeValue(pos, function() {
            scope.$apply(function() {
              console.log('changevalue callback');
            });
          });
        } else {
          scope.changeValue(null, function() {
            scope.$apply(function() {
              console.log('changevalue callback');
            });
          });
        }
      };

      google.maps.event.addListener(map, 'click', function(event){
        if (!marker.getVisible()) {
          setPosition(event.latLng);
          marker.setPosition(event.latLng);
          marker.setVisible(true);
          button.show();
        }
      });

      button.click(function() {
        if(marker.getVisible()) {
          marker.setVisible(false);
          button.hide();
          setPosition(null);
        }
      });

      scope.$on('valueChanged', function(event, value){
        console.log('value changed', event, value);
        if(value) {
          var latLng = new google.maps.LatLng(value.lat, value.lon);
          marker.setPosition(latLng);
          map.setCenter(latLng);
          marker.setVisible(true);
          button.show();
        } else {
          console.log('no value');
          marker.setVisible(false);
          button.hide();
        }
      });
      google.maps.event.addListener(marker, 'dragend', function(event){
        setPosition(event.latLng);
      });
    }
  };
});


