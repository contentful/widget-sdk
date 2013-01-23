Contentful::Application.routes.draw do
  match "mockup" => "mockup#index"

  root :to => 'application#index'

  match "*args" => 'application#index'
end
