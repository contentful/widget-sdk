require 'spec_helper'

feature 'Entry List', js: true, sauce: true do
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
    sleep 3 # ElasticSearch catchup
  end

  after do
    remove_test_space
  end

  scenario do
    nav_bar 'entry-list'
    select_filter 'All'
    page.should have_selector('.cell-status.draft', count: 3)

    all('input[type="checkbox"]')[1].set(true)
    click_button 'Publish'
    expect_success 'published successfully'
    sleep 2 # Orr Elasticsearch
    page.should have_selector('.cell-status.draft', count: 2)
    page.should have_selector('.cell-status.published', count: 1)

    select_filter 'Published'
    sleep 0.5
    page.should_not have_selector('.cell-status.draft')
    page.should     have_selector('.cell-status.published', count: 1)

    select_filter 'Draft'
    sleep 0.5
    page.should     have_selector('.cell-status.draft', count: 2)
    page.should_not have_selector('.cell-status.published')

    first('input[type="checkbox"]').set(true)
    click_button 'Archive'
    expect_success 'archived successfully'
    sleep 2 # Orr Elasticsearch
    page.should have_selector('.cell-status.archived', count: 2)

    select_filter 'Archived'
    sleep 0.5
    page.should have_selector('.cell-status.archived', count: 2)

    all('input[type="checkbox"]')[2].set(true)
    click_button 'Delete'
    click_button 'Are you sure?'
    expect_success 'deleted successfully'
    sleep 2 # Orr Elasticsearch
    
    page.should_not have_selector('.tab-actions')

    select_filter('Entry with Text')
    sleep 2
    page.should have_selector('.cell-status.archived' , count: 1)
    page.should have_selector('.cell-status.published', count: 1)
  end

  def select_filter(f)
    find('.filter-list li', text: f).click
  end

end
