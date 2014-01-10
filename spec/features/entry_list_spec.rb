require 'spec_helper'

feature 'Entry List', js: true do
  include ContentTypeHelper
  include EditorHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
    create_content_type 'Text'
    3.times do |x|
      add_button 'Entry with Text'
      edit_field('textField', 'en-US', 'textarea').set 'Foo'
      close_tab
    end
    wait_for_elasticsearch
  end

  after do
    remove_test_space
  end

  scenario 'Playing around in the Entry List' do
    nav_bar 'entry-list'
    select_filter 'All'
    expect(page).to have_selector('.cell-status.draft', count: 3)

    all('input[type="checkbox"]')[1].set(true)
    click_button 'Publish'
    expect_success 'published successfully'
    wait_for_elasticsearch
    expect(page).to have_selector('.cell-status.draft', count: 2)
    expect(page).to have_selector('.cell-status.published', count: 1)

    select_filter 'Published'
    sleep 0.5
    expect(page).to_not have_selector('.cell-status.draft')
    expect(page).to     have_selector('.cell-status.published', count: 1)

    select_filter 'Draft'
    sleep 0.5
    expect(page).to     have_selector('.cell-status.draft', count: 2)
    expect(page).to_not have_selector('.cell-status.published')

    first('input[type="checkbox"]').set(true)
    click_button 'Archive'
    expect_success 'archived successfully'
    wait_for_elasticsearch
    expect(page).to have_selector('.cell-status.archived', count: 2)

    select_filter 'Archived'
    sleep 0.5
    expect(page).to have_selector('.cell-status.archived', count: 2)

    all('input[type="checkbox"]')[2].set(true)
    click_button 'Delete'
    click_button 'Are you sure?'
    expect_success 'deleted successfully'
    wait_for_elasticsearch
    
    expect(page).to_not have_selector('.tab-actions')

    select_filter('Entry with Text')
    wait_for_elasticsearch
    expect(page).to have_selector('.cell-status.archived' , count: 1)
    expect(page).to have_selector('.cell-status.published', count: 1)
  end

  def select_filter(f)
    find('.filter-list li', text: f).click
  end

end
