Feature: Log in with fastify app

  Scenario: Log in with fastify app
    Given I open the 'FASTIFY' server app home page
    When I click log in with dummy in the server app page
    Then I am logged in and redirected to the 'FASTIFY' hello page