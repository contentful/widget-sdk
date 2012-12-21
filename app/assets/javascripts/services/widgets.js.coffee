# Sorry for coffee, but I need multiline strings :(

define [
  'services'
  'lodash'
], (services, _) ->
  'use strict'
  
  # TODO: Precompile widgets, make possibility for widgets to declare dependencies/custom directives
  
  editWidgets =
    string:
      textField:
        name: "Single line text field"
        template: """<input type="text" ng-model="value" ot-bind="text"/>"""
    text:
      textArea:
        name: "Multiline text field"
        template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="text"></textarea>"""
    boolean:
      checkBox:
        name: "Boolean Checkbox"
        template: """<label class="checkbox"><input type="checkbox" ng-model="value" ot-bind="replace"/> <span ng-show="value">Yes</span><span ng-show="!value">No</span></label>"""
    date:
      textField:
        name: "Date Field"
        template: """
          <input type="date" ng-model="date" />
          <input type="text" ng-model="time" ng-pattern="/(0|\\d|0\\d|1\\d|2[0-3]):[0-5][\\d](:[0-5][\\d])?/"> 
          """
        link: (scope, elm, attr) ->
          scope.setFromUnixtime = (ut) ->
            dateTime = new Date(ut)
            [@date, @time] = dateTime.toISOString().split(/T|\./)
          scope.setFromUnixtime(Date.now())

          dateController = elm.find('input[type=date]').inheritedData('$ngModelController')
          timeController = elm.find('input[type=text]').inheritedData('$ngModelController')
          changeHandler = ->
            return unless dateController.$modelValue? && timeController.$modelValue?
            dateAndTime = "#{dateController.$modelValue}-#{timeController.$modelValue}"
            [year, month, day, hours, minutes, seconds] = dateAndTime.split(/-|:/).map((s) -> Number(s))
            scope.changeValue Date.UTC(year, month-1, day, hours, minutes, seconds ?= 0)
          dateController.$viewChangeListeners.push changeHandler
          timeController.$viewChangeListeners.push changeHandler
          scope.$on 'valueChanged', (event, value) ->
            event.currentScope.setFromUnixtime(value)
          elm.find('input[type=date]').change (event, bla) ->
            val = elm.find('input[type=date]').val()
            dateController.$setViewValue(val)
    array:
      textField:
        name: "Array field"
        # TODO: This could be smarter with ShareJS but that's a ton of work
        template: """<input type="text" ng-list="" ng-model="value" ot-bind="model"/>"""
    object:
      jsonArea:
        name: "JSON Field"
        template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="model"></textarea>"""
        link: (scope, elm, attr) ->
          # TODO proper modeController access
          controller = elm.find('textarea').inheritedData('$ngModelController')
          controller.$formatters.push (obj) -> JSON.stringify(obj)
          controller.$parsers.push (string) ->
            try
              json = JSON.parse(string)
              controller.$setValidity('json', true)
              return json
            catch e
              controller.$setValidity('json', false)
              return undefined
    location:
      googlemap:
        name: "Location Picker"
        template: """
          <div class="gmaps-container"></div>
          <button class="btn">Remove</button>"""
        link: (scope, elm, attr) ->
          button = elm.find('button').hide()
          window.map = map = new google.maps.Map elm.find('.gmaps-container')[0],
            zoom: 6
            center: new google.maps.LatLng(51.16, 10.45)
            mapTypeId: google.maps.MapTypeId.ROADMAP
          marker = new google.maps.Marker
            map: map
            position: map.getCenter()
            draggable: true
            visible: true

          setPosition = (latLng) ->
            if latLng
              pos =
                lat: latLng.lat()
                lon: latLng.lng()
              scope.changeValue pos, (err) ->
                console.log('changevalue callback')
               #TODO Handle Failure
            else
              scope.changeValue null, (err) ->
                console.log('changevalue callback')

          google.maps.event.addListener map, 'click', (event) ->
            unless marker.getVisible()
              setPosition(event.latLng)
              marker.setPosition(event.latLng)
              marker.setVisible(true)
              button.show()
            return
          button.click ->
            if marker.getVisible()
              marker.setVisible(false)
              button.hide()
              setPosition(null)

          scope.$on 'valueChanged', (event, value) ->
            console.log('value changed', event, value)
            if value
              latLng = new google.maps.LatLng(value.lat, value.lon)
              marker.setPosition(latLng)
              map.setCenter(latLng)
              marker.setVisible(true)
              button.show()
            else
              console.log('no value')
              marker.setVisible(false)
              button.hide()
          google.maps.event.addListener marker, 'dragend', (event) ->
            setPosition(event.latLng)
          return

    number:
      textField:
        name: "Textfield for floats"
        template: """<input type="number" ng-model="value" ot-bind="replace"/>"""
        link: (scope, elm, attr) ->
          # TODO proper modeController access
          controller = elm.find('input').inheritedData('$ngModelController')
          controller.$parsers.unshift (viewValue) ->
            FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/
            if FLOAT_REGEXP.test(viewValue)
              controller.$setValidity('float', true)
              return parseFloat(viewValue.replace(',', '.'))
            else
              ctrl.$setValidity('float', false)
              return undefined
    integer:
      textField:
        name: "Textfield for integers"
        template: """<input type="number" ng-pattern="/^\\-?\\d*$/" ng-model="value" ot-bind="replace"/>"""
    
  displayWidgets =
    string:
      textField:
        template: "{{entry[fieldName]}}"

  class WidgetBuilder
    editor:  (fieldType, widgetType) ->
      type = editWidgets[fieldType] ? editWidgets.string
      type[widgetType] ? _(type).values()[0]
    display: (fieldType, widgetType) ->
      type = editWidgets[fieldType] ? editWidgets.string
      type[widgetType] ? _(type).values()[0]
    availableEditWidgets: (fieldType) ->
      _(editWidgets[fieldType]).keys()
    availableDisplayWidgets: (fieldType) ->
      _(displayWidgets[fieldType]).keys()
          
  services.service('widgets', WidgetBuilder);
