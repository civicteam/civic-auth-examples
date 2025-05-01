Feature: Confirm solana next14 with wallet adapter logs in and shows balance

  Scenario: Confirm solana next14 with wallet adapter logs in and shows balance
    Given I open the app home page
    When I click the select wallet button
    And I click the civic wallet button
    And I click log in with dummy in the iframe

   Scenario: Verify login
    Then I confirm solana login with wallet adapter