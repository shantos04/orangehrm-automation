Feature: Time Module - Shared Calendar Widget
  As an employee
  I want to use the calendar widget on the Attendance page
  So that I can accurately log my punch in and punch out times

  Background:
    Given I am logged into OrangeHRM and navigate to the Punch In/Out page

  # TC01
  Scenario: Verify the visibility of the Date Picker calendar widget
    When I click the calendar icon
    Then the dynamic calendar widget should be visible

  # TC02 & TC10
  Scenario Outline: Verify the date selection functionality within the Date Picker
    When I select the date "<year>", "<month>", "<day>" from the calendar
    Then the calendar should close automatically
    And the input field should display the date in "<expected_format>" format

    Examples:
      | year | month    | day | expected_format |
      | 2026 | May      | 15  | 2026-15-05      |
      | 2024 | February | 29  | 2024-29-02      |

  # TC03, TC04, TC05
  Scenario Outline: Verify the functionality of the calendar shortcut buttons
    When I pre-fill the date field if required for the "<button_name>" action
    And I click the "<button_name>" shortcut button in the calendar
    Then the calendar should perform the "<expected_action>" action

    Examples:
      | button_name | expected_action                            |
      | Today       | populate field with current date and close |
      | Clear       | clear the input field and close            |
      | Close       | close without altering the input field     |

  # TC06, TC07
  Scenario Outline: Verify navigating months using calendar arrows
    Given I open the calendar and record the current month
    When I click the "<direction>" month arrow
    Then the calendar UI should update to display the "<expected_change>" month

    Examples:
      | direction | expected_change |
      | next      | subsequent      |
      | previous  | preceding       |

  # TC08, TC09
  Scenario: Verify month and year selection via Dropdowns
    Given I open the calendar widget
    When I select the month "December" from the dropdown
    Then the calendar should display the month "December"
    When I select the year "2024" from the dropdown
    Then the calendar should display the year "2024"

  # TC11
  Scenario: Verify dismissing the calendar by clicking outside
    Given I open the calendar widget
    When I click on the main page header outside the calendar
    Then the calendar widget should automatically dismiss

  # TC12
  Scenario: Verify manual keystroke input bypasses the UI calendar widget
    When I manually type a valid date "2026-25-12" into the input field
    And I trigger the frontend validation
    Then the system should accept the manual input without throwing formatting errors

  # TC13, TC14
  Scenario Outline: Verify format validation for explicitly invalid or blank date string inputs
    When I manually input "<input_value>" into the date field
    And I trigger the frontend validation
    Then the system should display a validation error message "<error_type>"

    Examples:
      | input_value         | error_type |
      | Invalid-Date-String | format     |
      |                     | required   |

  # TC15
  Scenario: Verify Future Year restriction discrepancy
    Given the calendar UI limits the Year dropdown up to the current year
    When I manually input a date with a future year bypass
    Then the system should accept the future year input without errors