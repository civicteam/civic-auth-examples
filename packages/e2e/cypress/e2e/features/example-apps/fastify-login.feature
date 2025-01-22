@local @develop
Feature: Log in with login app only

  Scenario: Log in with login app only
    Given I open the 'FASTIFY' app home page
    And I click log in with dummy in the page

#   Scenario: Confirm user is logged in
    Then I confirm that login-app user is on the correct url
    And I confirm user info displayed in login app is correct
