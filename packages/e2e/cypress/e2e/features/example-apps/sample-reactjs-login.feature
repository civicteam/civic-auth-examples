@local
Feature: Log in with sample react js example app

  Scenario: Log in with sample react js example app
    Given I open sample react js example app home page
    When I select iframe
    And I click the sign in button
    And I click log in with dummy in the iframe
    Then I fetch tokens from local storage
    And I confirm local storage values change after a certain amount of time