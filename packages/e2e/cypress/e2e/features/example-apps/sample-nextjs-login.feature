@local
Feature: Log in with sample next js example app

  Scenario: Log in with sample next js example app
    Given I open sample next js example app home page
    When I select iframe
    And I click the sign in button
    When I click log in with dummy in the iframe
    Then I fetch tokens from cookies
    And I confirm cookie values change after a certain amount of time
