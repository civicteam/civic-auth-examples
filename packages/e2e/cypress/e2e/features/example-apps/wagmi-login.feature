Feature: Confirm wagmi without wallet adapter logs in and shows balance

  Scenario: Confirm wagmi without wallet adapter logs in and shows balance
    Given I open the 'WAGMI' app home page
    When I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm ethereum login without wallet adapter