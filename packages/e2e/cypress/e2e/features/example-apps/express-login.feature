Feature: Log in with express app

  Scenario: Log in with express app
    Given I open the server app home page
    When I click log in with dummy in the server app page
    Then I am logged in and redirected to the hello page
