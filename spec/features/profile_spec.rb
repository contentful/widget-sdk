require 'spec_helper'

feature 'Working with profile', js: true, sauce: true do
  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Renaming user' do
    find('.user .dropdown-toggle').click
    expect(find('.user .dropdown-menu')).to have_text('Test User')
    find('li', text: 'Edit Profile').click
    tab_iframe do
      click_link 'Edit'
      fill_in 'user_first_name', with: 'Foo'
      fill_in 'user_last_name', with: 'Bar'
      click_button 'Update User'
    end
    find('.user .dropdown-toggle').click
    expect(find('.user .dropdown-menu')).to have_text('Foo Bar')
    find('li', text: 'Edit Profile').click
    tab_iframe do
      click_link 'Edit'
      fill_in 'user_first_name', with: 'Test'
      fill_in 'user_last_name', with: 'User'
      click_button 'Update User'
    end
  end
end
