Feature: Confirm wagmi nextjswithout wallet adapter logs in and shows balance

  Scenario: Confirm wagmi nextjs without wallet adapter logs in and shows balance
    Given I open the app home page
    When I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm ethereum login without wallet adapter