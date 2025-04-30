Feature: Log in with hono app

  Scenario: Log in with hono app
    Given I open the 'HONO' server app home page
    When I click log in with dummy in the server app page
    Then I am logged in and redirected to the 'HONO' hello page
