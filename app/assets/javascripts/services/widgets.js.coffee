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
        # TODO: Replace with Datepicker
        name: "Date Field"
        template: """<input type="text" ng-model="value" ot-bind="text"/>"""
    array:
      textField:
        name: "Array field"
        # TODO: This could be smarter with ShareJS but that's a ton of work
        template: """<input type="text" ng-list="" ng-model="value" ot-bind="replace"/>"""
    object:
      jsonArea:
        name: "JSON Field"
        template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="replace"></textarea>"""
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
