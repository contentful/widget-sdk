module ContentTypeHelper
  def add_field(name, type, options={})
    find('.add-field-button, button', text: 'Field').click
    find(:xpath, ".//span[text()='#{type}']/..").click

    fill_in 'fieldName', with: name
    fill_in 'fieldId'  , with: options[:id] if options[:id]
    find('.toggle-localized').click if options[:localized]
    find('.toggle-required').click if options[:required]
  end

  def for_field(field_name)
    find('.cf-field-settings', text)
    field_settings = find :xpath, %Q{//*[contains(@class, 'display')]/*[contains(@class, 'name')][text()='#{field_name}']/../..}
    field_settings.click() unless field_settings[:class] !~ /open/

    within(field_settings) do
      yield
    end
  end

  def in_validations
    find('.toggle-validate').click
    unscope do
      find('.validation-dialog')
      within('.validation-dialog .modal-dialog') do
        yield
        find('button.cancel').click
      end
    end
  end

  def add_validation(name)
    find('button', text: 'Validation').click
    
    validation = all('.cf-validation-options').last

    within validation do
      find('.dropdown-toggle').click
      find('.dropdown-menu li', text: name).click
      yield
    end
  end
end
