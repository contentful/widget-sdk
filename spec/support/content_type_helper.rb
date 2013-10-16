module ContentTypeHelper
  def add_field(name, type, options={})
    find('.add-field-button, button', text: 'Field').click
    find(:xpath, ".//span[text()='#{type}']/..").click

    fill_in 'fieldName', with: name
    fill_in 'newFieldIdInput'  , with: options[:id] if options[:id]
    find('.field-id-form .ss-check').click
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
        find('.close-button').click
      end
    end
  end

  def add_validation(name)
    find('.dropdown-toggle', text:'Validation').click
    find('.dropdown-menu li', text: name).click
    
    validation = all('.cf-validation-options').last

    within validation do
      yield
    end
  end
end
