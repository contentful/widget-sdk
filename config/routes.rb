Contentful::Application.routes.draw do
  root :to => 'application#index'

  match "styleguide" => "application#styleguide"
  match "*args" => 'application#index'
end
