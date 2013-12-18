require 'spec_helper'

feature 'Reload Notification', js: true, sauce: true do
  before do
    ensure_login
  end

  scenario 'Causing an error' do
    page.execute_script '$(".client").scope().$apply(function(){throw new Error()})'
    expect(page).to have_selector('.title', text: 'The application needs to reload')
  end

end
