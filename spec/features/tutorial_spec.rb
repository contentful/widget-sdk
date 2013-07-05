require 'spec_helper'

feature 'Tutorial', js: true do
  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Run tutorial' do
    within 'nav.account .user' do
      find('.dropdown-toggle').click
      find('li', text: 'Start Tutorial').click
    end
    find('.left.tutorial-select-box .take').click
    click_link 'Next'
    find('.tablist-button .dropdown-toggle').click
    all('.tablist-button li', text: 'Content Type').first.click
    within('.tab-content', visible:true) do
      fill_in 'contentTypeName', with: 'Blog Post'
      fill_in 'contentTypeDescription', with: 'Foobar'

      fill_in 'newName', with: 'Title'
      find('.button.new').click

      fill_in 'newName', with: 'Content'
      find('.button.new').click

      fill_in 'newName', with: 'Timestamp'
      find('.type .dropdown-toggle').click
      #find('.type .li', text: 'Date/Time').click
      find(:xpath, ".//span[text()='Date/Time']/..").click
      find('.button.new').click
    end
    click_link 'Next'

    find('.publish').click

    all('.nav-bar li').first.click

    click_button 'Yes, please'

    find('a', text: 'Back to overview')
    all('.cell-name').should have(6).elements

    click_link 'Back to overview'
  end
end
