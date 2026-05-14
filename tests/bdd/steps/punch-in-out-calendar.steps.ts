import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// Import Page Objects & Data
import { LoginPage } from '../../../app/pages/login.page';
import { PunchInOutPage } from '../../../app/pages/time/punch-in-out.page'; // Điều chỉnh đường dẫn POM của bạn
import { CalendarComponent } from '../../../app/components/common/calendar.component'; // Điều chỉnh đường dẫn POM của bạn
import usersData from '../../../data/users.json';
import expectedTexts from '../../../data/expected-texts.json';

// Import Browser Context
import { page } from '../support/hooks';

let initialMonth: string;
const baselineDate = '2026-05-05';

// ==========================================
// BACKGROUND
// ==========================================

Given('I am logged into OrangeHRM and navigate to the Punch In/Out page', async function () {
    const loginPage = new LoginPage(page);
    await page.goto('/web/index.php/auth/login');
    await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
    
    // Điều hướng thẳng tới trang Punch In/Out bằng URL để tiết kiệm thời gian click UI
    await page.goto('/web/index.php/attendance/punchIn');
    await page.waitForLoadState('networkidle');
});

// ==========================================
// VISIBILITY & BASIC INTERACTION
// ==========================================

When('I click the calendar icon', async function () {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.openCalendar();
});

Then('the dynamic calendar widget should be visible', async function () {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.verifyCalendarIsVisible();
});

Given('I open the calendar widget', async function () {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.openCalendar();
    await calendarComp.verifyCalendarIsVisible();
});

When('I select the date {string}, {string}, {string} from the calendar', async function (year, month, day) {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.openCalendar();
    await calendarComp.selectFullDate(year, month, day);
});

Then('the calendar should close automatically', async function () {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.verifyCalendarIsHidden();
});

Then('the input field should display the date in {string} format', async function (expectedFormat) {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.verifySelectedDateValue(expectedFormat);
});

// ==========================================
// SHORTCUT BUTTONS
// ==========================================

When('I pre-fill the date field if required for the {string} action', async function (action) {
    const punchIOPage = new PunchInOutPage(page);
    if (action === 'Clear' || action === 'Close') {
        await punchIOPage.txtDate.fill(baselineDate);
    }
});

When('I click the {string} shortcut button in the calendar', async function (buttonName) {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.openCalendar();
    
    if (buttonName === 'Today') await calendarComp.selectToday();
    if (buttonName === 'Clear') await calendarComp.clearDate();
    if (buttonName === 'Close') await calendarComp.btnClose.click();
});

Then('the calendar should perform the {string} action', async function (expectedAction) {
    const calendarComp = new CalendarComponent(page);
    const punchIOPage = new PunchInOutPage(page);
    
    await expect(calendarComp.calendarContainer).toBeHidden();

    if (expectedAction.includes('current date')) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        const expectedDateString = `${year}-${date}-${month}`;
        
        await calendarComp.verifySelectedDateValue(expectedDateString);
    } 
    else if (expectedAction.includes('clear')) {
        await calendarComp.verifyDateIsEmpty();
    } 
    else if (expectedAction.includes('without altering')) {
        await expect(punchIOPage.txtDate).toHaveValue(baselineDate);
    }
});

// ==========================================
// NAVIGATION (ARROWS & DROPDOWNS)
// ==========================================

Given('I open the calendar and record the current month', async function () {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.openCalendar();
    initialMonth = await calendarComp.lblCurrentMonth.innerText();
});

When('I click the {string} month arrow', async function (direction) {
    const calendarComp = new CalendarComponent(page);
    if (direction === 'next') {
        await calendarComp.btnNextMonth.click();
    } else {
        await calendarComp.btnPrevMonth.click();
    }
});

Then('the calendar UI should update to display the {string} month', async function (expectedChange) {
    const calendarComp = new CalendarComponent(page);
    await expect(calendarComp.lblCurrentMonth).not.toHaveText(initialMonth);
});

When('I select the month {string} from the dropdown', async function (targetMonth) {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.selectMonth(targetMonth);
});

Then('the calendar should display the month {string}', async function (targetMonth) {
    const calendarComp = new CalendarComponent(page);
    await expect(calendarComp.lblCurrentMonth).toHaveText(targetMonth);
});

When('I select the year {string} from the dropdown', async function (targetYear) {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.selectYear(targetYear);
});

Then('the calendar should display the year {string}', async function (targetYear) {
    const calendarComp = new CalendarComponent(page);
    await expect(calendarComp.lblCurrentYear).toHaveText(targetYear);
});

// ==========================================
// INPUT VALIDATION & DISMISSAL
// ==========================================

When('I click on the main page header outside the calendar', async function () {
    const punchIOPage = new PunchInOutPage(page);
    await punchIOPage.mainTitle.click();
});

Then('the calendar widget should automatically dismiss', async function () {
    const calendarComp = new CalendarComponent(page);
    await calendarComp.verifyCalendarIsHidden();
});

When('I manually type a valid date {string} into the input field', async function (manualDate) {
    const punchIOPage = new PunchInOutPage(page);
    await punchIOPage.txtDate.fill('');
    await punchIOPage.txtDate.fill(manualDate);
});

When('I trigger the frontend validation', async function () {
    const punchIOPage = new PunchInOutPage(page);
    await punchIOPage.txtDate.press('Tab');
});

Then('the system should accept the manual input without throwing formatting errors', async function () {
    const punchIOPage = new PunchInOutPage(page);
    await expect(punchIOPage.errorMessageDate).toBeHidden();
});

When('I manually input {string} into the date field', async function (inputValue) {
    const punchIOPage = new PunchInOutPage(page);
    await punchIOPage.txtDate.fill(''); // Đảm bảo clear trước khi nhập
    if (inputValue !== "") {
        await punchIOPage.txtDate.fill(inputValue);
    }
});

Then('the system should display a validation error message {string}', async function (errorType) {
    const punchIOPage = new PunchInOutPage(page);
    await expect(punchIOPage.errorMessageDate).toBeVisible();
    
    if (errorType === 'format') {
        await expect(punchIOPage.errorMessageDate).toContainText(expectedTexts.validationMessages.invalidDateFormat);
    } else {
        await expect(punchIOPage.errorMessageDate).toContainText(expectedTexts.validationMessages.required);
    }
});

// ==========================================
// FUTURE YEAR RESTRICTION BYPASS
// ==========================================

Given('the calendar UI limits the Year dropdown up to the current year', async function () {
    const calendarComp = new CalendarComponent(page);
    const punchIOPage = new PunchInOutPage(page);
    const currentYear = new Date().getFullYear();
    const futureYear = currentYear + 1;
    
    await calendarComp.openCalendar();
    await calendarComp.yearDropdown.click();
    await expect(calendarComp.calendarContainer).not.toContainText(String(futureYear));
    await punchIOPage.mainTitle.click(); // Đóng calendar
});

When('I manually input a date with a future year bypass', async function () {
    const punchIOPage = new PunchInOutPage(page);
    const today = new Date();
    const futureYear = today.getFullYear() + 1;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const futureDateStr = `${futureYear}-${date}-${month}`;
    
    await punchIOPage.txtDate.fill(''); 
    await punchIOPage.txtDate.fill(futureDateStr);
    await punchIOPage.mainTitle.click(); 
});

Then('the system should accept the future year input without errors', async function () {
    const punchIOPage = new PunchInOutPage(page);
    await expect(punchIOPage.errorMessageDate).toBeHidden();
});