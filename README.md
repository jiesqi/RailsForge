RailsForge

RailsForge is a Ruby on Rails developer toolkit designed to speed up application development by providing reusable tools, generators, authentication, API scaffolding, database utilities, and background-job examples.

Features

* Authentication starter
* API generator
* Database utilities
* Background-job examples
* Rails project generators
* Reusable development patterns
* Clean and modular architecture
* Developer-friendly CLI tools

Tech Stack

* Ruby
* Ruby on Rails
* PostgreSQL
* Redis
* Sidekiq
* RSpec
* Rake

Getting Started

Requirements

Make sure you have the following installed:

* Ruby
* Rails
* PostgreSQL
* Redis

Installation

Clone the repository:

git clone https://github.com/YOUR_USERNAME/railsforge.git
cd railsforge

Install dependencies:

bundle install

Set up the database:

bin/rails db:create
bin/rails db:migrate

Start the development server:

bin/rails server

The application will be available at:

http://localhost:3000

Project Structure

railsforge/
├── app/
├── bin/
├── config/
├── db/
├── lib/
├── spec/
├── Gemfile
├── Rakefile
└── README.md

Roadmap

Core

* Initial Rails application
* Authentication generator
* API generator
* Database utilities
* Background-job examples
* CLI interface

Developer Tools

* Model generator
* Controller generator
* Service-object generator
* API endpoint scaffolding
* Database seed utilities
* Development environment setup

Future

* RailsForge CLI
* Plugin system
* Project templates
* Interactive generators
* Documentation website
* Automated testing templates

Development

Clone the repository and install the dependencies:

bundle install

Run the test suite:

bundle exec rspec

Run Rails checks:

bin/rails test

Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add or update tests.
5. Commit your changes.
6. Open a pull request.

License

This project is licensed under the MIT License.

Author

Built as an open-source Ruby on Rails developer toolkit.
