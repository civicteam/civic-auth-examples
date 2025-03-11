Feature: Confirm solana app builds and loads correctly

  Scenario: Confirm solana app builds and loads correctly
    Given I open the 'SOLANA' app home page
    When I click the select wallet button
    And I click the civic wallet button
    Then I confirm provider is visible in iframe
