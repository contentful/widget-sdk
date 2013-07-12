module ContentTypeHelper
  def add_field(name, type, options={})
    fill_in 'newName', with: name
    fill_in 'newId'  , with: options[:id] if options[:id]
    find('.type .dropdown-toggle').click
    find(:xpath, ".//span[text()='#{type}']/..").click
    find('input[ng-model="newField.localized"]').set(true) if options[:localized]
    find('input[ng-model="newField.required"]').set(true) if options[:required]
    find('.button.new').click
  end

  def for_field(field_name)
    within(:xpath, "//div[contains(@class, 'identifier')][text()='#{field_name}']/../../..") do
      yield
    end
  end
end
