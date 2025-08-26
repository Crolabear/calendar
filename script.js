class QuarterlyRuleCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDays = new Set();
        this.selectionHistory = []; // Array of selected dates with metadata
        this.validDays = new Set();
        this.blockedDates = new Set(); // Manually blocked dates
        this.avoidHolidays = true; // Avoid US holidays by default
        this.monthDisplayCount = 9; // Default to 9 months display

        // Monthly selection data structures
        this.monthlySelectedDays = new Set(); // Pure monthly selections (excluding quarterly)
        this.monthlySelectionEnabled = false; // Monthly selection mode toggle
        this.quarterlyToMonthlyMapping = new Map(); // Maps quarterly selections to their quarters for monthly dependency tracking
        this.currentSelectionMode = 'quarterly'; // Track current selection mode: 'quarterly' or 'monthly'

        // Profile management
        this.currentProfile = 'default';
        this.profiles = this.loadProfiles();

        this.initializeElements();
        this.bindEvents();
        this.loadProfile(this.currentProfile);
        this.updateProfileSelector();
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();

        // Ensure rules display is properly initialized
        this.updateRulesDisplay();
    }

    initializeElements() {
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.clearBlockedBtn = document.getElementById('clearBlocked');
        this.generateValidDaysBtn = document.getElementById('generateValidDays');
        this.avoidHolidaysCheckbox = document.getElementById('avoidHolidays');
        this.blockDateInput = document.getElementById('blockDate');
        this.addBlockedDateBtn = document.getElementById('addBlockedDate');
        this.blockedDatesListEl = document.getElementById('blockedDatesList');
        this.selectionHistoryEl = document.getElementById('selectionHistory');
        this.prevPeriodBtn = document.getElementById('prevPeriod');
        this.nextPeriodBtn = document.getElementById('nextPeriod');
        this.currentPeriodEl = document.getElementById('currentPeriod');
        this.calendarEl = document.getElementById('calendar');
        this.selectedDaysEl = document.getElementById('selectedDays');
        this.clearSelectedBtn = document.getElementById('clearSelected');

        // Profile elements
        this.profileSelect = document.getElementById('profileSelect');
        this.newProfileNameInput = document.getElementById('newProfileName');
        this.createProfileBtn = document.getElementById('createProfile');
        this.deleteProfileBtn = document.getElementById('deleteProfile');
        this.exportProfileBtn = document.getElementById('exportProfile');
        this.importProfileInput = document.getElementById('importProfile');
        this.importProfileBtn = document.getElementById('importProfileBtn');

        // Data export/import elements
        this.exportAllDataBtn = document.getElementById('exportAllData');
        this.importAllDataInput = document.getElementById('importAllData');
        this.importAllDataBtn = document.getElementById('importAllDataBtn');
        this.clearAllDataBtn = document.getElementById('clearAllData');
        this.rulesDisplayEl = document.getElementById('rulesDisplay');
        this.rulesTitleEl = document.getElementById('rulesTitle');

        // Monthly selection elements
        this.enableMonthlyCheckbox = document.getElementById('enableMonthlySelection');
        this.selectionModeControlsEl = document.getElementById('selectionModeControls');
        this.monthlySelectionsSectionEl = document.getElementById('monthlySelectionsSection');
        this.quarterlyModeBtnEl = document.getElementById('quarterlyModeBtn');
        this.monthlyModeBtnEl = document.getElementById('monthlyModeBtn');
        this.monthlySelectedDaysEl = document.getElementById('monthlySelectedDays');
        this.clearMonthlySelectedBtn = document.getElementById('clearMonthlySelected');

        // Display configuration elements
        this.monthDisplayCountSelect = document.getElementById('monthDisplayCount');

        // Floating toggle elements (will be initialized in setupFloatingToggle)
        this.floatingToggle = null;
        this.floatingCheckbox = null;
        this.floatingStatus = null;
        this.floatingCollapseBtn = null;
    }

    bindEvents() {
        this.clearHistoryBtn.addEventListener('click', () => this.clearSelectionHistory());
        this.clearBlockedBtn.addEventListener('click', () => this.clearBlockedDates());
        this.generateValidDaysBtn.addEventListener('click', () => this.generateValidDays());
        this.avoidHolidaysCheckbox.addEventListener('change', (e) => this.toggleHolidayAvoidance(e.target.checked));
        this.addBlockedDateBtn.addEventListener('click', () => this.addBlockedDate());
        this.blockDateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBlockedDate();
        });
        this.prevPeriodBtn.addEventListener('click', () => this.changePeriod(-this.monthDisplayCount));
        this.nextPeriodBtn.addEventListener('click', () => this.changePeriod(this.monthDisplayCount));
        this.clearSelectedBtn.addEventListener('click', () => this.clearAllSelected());
        this.clearMonthlySelectedBtn.addEventListener('click', () => this.clearAllMonthlySelected());
        this.enableMonthlyCheckbox.addEventListener('change', (e) => this.toggleMonthlySelection(e.target.checked));

        // Selection mode button event listeners
        if (this.quarterlyModeBtnEl) {
            this.quarterlyModeBtnEl.addEventListener('click', () => this.setSelectionMode('quarterly'));
        }
        if (this.monthlyModeBtnEl) {
            this.monthlyModeBtnEl.addEventListener('click', () => this.setSelectionMode('monthly'));
        }

        // Display configuration event listeners
        this.monthDisplayCountSelect.addEventListener('change', (e) => this.setMonthDisplayCount(parseInt(e.target.value)));

        // Test runner event listener
        const runTestsBtn = document.getElementById('runIntegrationTests');
        if (runTestsBtn) {
            runTestsBtn.addEventListener('click', () => this.runIntegrationTests());
        }

        // Floating toggle event listeners
        this.setupFloatingToggle();

        // Profile event listeners
        this.profileSelect.addEventListener('change', (e) => this.switchProfile(e.target.value));
        this.createProfileBtn.addEventListener('click', () => this.createProfile());
        this.deleteProfileBtn.addEventListener('click', () => this.deleteProfile());
        this.exportProfileBtn.addEventListener('click', () => this.exportProfile());
        this.importProfileBtn.addEventListener('click', () => this.importProfileInput.click());
        this.importProfileInput.addEventListener('change', (e) => this.importProfile(e));

        // Data export/import event listeners
        this.exportAllDataBtn.addEventListener('click', () => this.exportAllData());
        this.importAllDataBtn.addEventListener('click', () => this.importAllDataInput.click());
        this.importAllDataInput.addEventListener('change', (e) => this.importAllData(e));
        this.clearAllDataBtn.addEventListener('click', () => this.clearAllDataConfirm());
        this.newProfileNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createProfile();
        });
    }

    clearSelectionHistory() {
        this.selectionHistory = [];
        this.selectedDays.clear();
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();
    }

    clearAllSelected() {
        this.selectedDays.clear();
        this.selectionHistory = [];

        // Also clear monthly selections and mapping when clearing quarterly
        if (this.monthlySelectionEnabled) {
            this.monthlySelectedDays.clear();
            this.quarterlyToMonthlyMapping.clear();
        }

        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();

        // Update monthly display if enabled
        if (this.monthlySelectionEnabled) {
            this.updateMonthlySelectedDaysDisplay();
        }
    }

    removeSelectedDay(dateString) {
        // If monthly selection is enabled, handle quarterly-monthly dependency
        if (this.monthlySelectionEnabled && this.selectedDays.has(dateString)) {
            const date = new Date(dateString);
            const metadata = this.getDateMetadata(date);

            // Check if there are monthly selections that will be affected
            const monthlySelectionsInQuarter = this.getMonthlySelectionsForQuarter(metadata.quarter, metadata.year);
            const affectedMonthlySelections = monthlySelectionsInQuarter.filter(monthlyDateString =>
                monthlyDateString !== dateString && this.monthlySelectedDays.has(monthlyDateString)
            );

            // Show warning if removing quarterly selection will affect monthly selections
            if (affectedMonthlySelections.length > 0) {
                const confirmMessage = `Removing this quarterly selection will also remove ${affectedMonthlySelections.length} monthly selection(s) in Quarter ${metadata.quarter} ${metadata.year}:\n\n${affectedMonthlySelections.map(ds => new Date(ds).toLocaleDateString()).join('\n')}\n\nDo you want to continue?`;

                if (!confirm(confirmMessage)) {
                    return; // User cancelled the removal
                }
            }

            // Remove all monthly selections for this quarter when removing quarterly selection
            monthlySelectionsInQuarter.forEach(monthlyDateString => {
                // Only remove pure monthly selections, not the quarterly one we're already removing
                if (monthlyDateString !== dateString) {
                    this.monthlySelectedDays.delete(monthlyDateString);
                }
            });

            // Remove from quarterly-monthly mapping
            this.quarterlyToMonthlyMapping.delete(dateString);
        }

        this.selectedDays.delete(dateString);
        this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();

        // Update monthly display if enabled
        if (this.monthlySelectionEnabled) {
            this.updateMonthlySelectedDaysDisplay();
        }
    }

    clearBlockedDates() {
        this.blockedDates.clear();
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
    }

    generateValidDays() {
        this.calculateValidDays();
        this.renderCalendar();
    }

    toggleHolidayAvoidance(avoid) {
        this.avoidHolidays = avoid;
        this.calculateValidDays();
        this.renderCalendar();
    }

    addBlockedDate() {
        const dateValue = this.blockDateInput.value;
        if (!dateValue) return;

        const date = new Date(dateValue + 'T00:00:00');
        const dateString = date.toDateString();

        this.blockedDates.add(dateString);
        this.blockDateInput.value = '';

        // Remove from selected days if it was selected
        if (this.selectedDays.has(dateString)) {
            this.selectedDays.delete(dateString);
            this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        }

        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
        this.updateSelectedDaysDisplay();
        this.updateSelectionHistoryDisplay();
    }

    removeBlockedDate(dateString) {
        this.blockedDates.delete(dateString);
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
    }

    isUSHoliday(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // Fixed date holidays
        const fixedHolidays = [
            { month: 1, day: 1 },   // New Year's Day
            { month: 7, day: 4 },   // Independence Day
            { month: 11, day: 11 }, // Veterans Day
            { month: 12, day: 25 }  // Christmas Day
        ];

        if (fixedHolidays.some(h => h.month === month && h.day === day)) {
            return true;
        }

        // Variable holidays
        // Martin Luther King Jr. Day - 3rd Monday in January
        if (month === 1 && this.isNthWeekdayOfMonth(date, 1, 3)) {
            return true;
        }

        // Presidents' Day - 3rd Monday in February
        if (month === 2 && this.isNthWeekdayOfMonth(date, 1, 3)) {
            return true;
        }

        // Memorial Day - Last Monday in May
        if (month === 5 && this.isLastWeekdayOfMonth(date, 1)) {
            return true;
        }

        // Labor Day - 1st Monday in September
        if (month === 9 && this.isNthWeekdayOfMonth(date, 1, 1)) {
            return true;
        }

        // Columbus Day - 2nd Monday in October
        if (month === 10 && this.isNthWeekdayOfMonth(date, 1, 2)) {
            return true;
        }

        // Thanksgiving - 4th Thursday in November
        if (month === 11 && this.isNthWeekdayOfMonth(date, 4, 4)) {
            return true;
        }

        return false;
    }

    isNthWeekdayOfMonth(date, weekday, n) {
        if (date.getDay() !== weekday) return false;

        const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstWeekday = new Date(firstOfMonth);

        // Find first occurrence of the weekday
        while (firstWeekday.getDay() !== weekday) {
            firstWeekday.setDate(firstWeekday.getDate() + 1);
        }

        // Calculate the nth occurrence
        const nthWeekday = new Date(firstWeekday);
        nthWeekday.setDate(firstWeekday.getDate() + (n - 1) * 7);

        return date.getDate() === nthWeekday.getDate();
    }

    isLastWeekdayOfMonth(date, weekday) {
        if (date.getDay() !== weekday) return false;

        const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const lastWeekday = new Date(lastOfMonth);

        // Find last occurrence of the weekday
        while (lastWeekday.getDay() !== weekday) {
            lastWeekday.setDate(lastWeekday.getDate() - 1);
        }

        return date.getDate() === lastWeekday.getDate();
    }

    getQuarter(date) {
        const month = date.getMonth() + 1;
        return Math.ceil(month / 3);
    }

    getMonthOfQuarter(date) {
        const month = date.getMonth() + 1;
        return ((month - 1) % 3) + 1; // 1, 2, or 3
    }

    getDayPeriod(date) {
        const day = date.getDate();
        if (day <= 10) return 1;
        if (day <= 20) return 2;
        return 3;
    }

    getDateMetadata(date) {
        return {
            date: date,
            year: date.getFullYear(),
            quarter: this.getQuarter(date),
            month: date.getMonth() + 1, // 1-based month (1-12)
            monthOfQuarter: this.getMonthOfQuarter(date),
            dayPeriod: this.getDayPeriod(date),
            dayOfWeek: date.getDay(),
            dateString: date.toDateString(),
            selectionType: this.monthlySelectionEnabled ? 'monthly' : 'quarterly'
        };
    }

    // Helper method to check if a selection is within the allowed time window (current + previous 2 quarters)
    isWithinAllowedTimeWindow(selectionMetadata, currentMetadata) {
        const currentQuarterKey = `${currentMetadata.year}-Q${currentMetadata.quarter}`;
        const selectionQuarterKey = `${selectionMetadata.year}-Q${selectionMetadata.quarter}`;

        // Calculate quarter difference
        const currentQuarterNum = currentMetadata.year * 4 + currentMetadata.quarter;
        const selectionQuarterNum = selectionMetadata.year * 4 + selectionMetadata.quarter;
        const quarterDiff = currentQuarterNum - selectionQuarterNum;

        // Allow current quarter (0) and previous 2 quarters (1, 2)
        return quarterDiff >= 0 && quarterDiff <= 2;
    }

    hasConsecutiveViolation(newSelection, attribute) {
        // Filter history to only include selections within allowed time window (current + previous 2 quarters)
        const relevantHistory = this.selectionHistory.filter(selection =>
            this.isWithinAllowedTimeWindow(selection, newSelection)
        );

        // Sort relevant history by date
        const sortedHistory = [...relevantHistory].sort((a, b) => a.date - b.date);

        // Find consecutive selections with same attribute value
        let consecutiveCount = 0;
        let lastValue = null;

        for (const selection of sortedHistory) {
            const currentValue = selection[attribute];

            if (currentValue === lastValue) {
                consecutiveCount++;
                if (consecutiveCount >= 2 && currentValue === newSelection[attribute]) {
                    return true; // Would create 3 consecutive
                }
            } else {
                consecutiveCount = 1;
                lastValue = currentValue;
            }
        }

        // Check if adding new selection would create 3 consecutive
        if (sortedHistory.length > 0) {
            const lastSelection = sortedHistory[sortedHistory.length - 1];
            if (lastSelection[attribute] === newSelection[attribute]) {
                // Count backwards to see how many consecutive we already have
                let count = 1;
                for (let i = sortedHistory.length - 2; i >= 0; i--) {
                    if (sortedHistory[i][attribute] === newSelection[attribute]) {
                        count++;
                    } else {
                        break;
                    }
                }
                return count >= 2; // Would make 3 consecutive
            }
        }

        return false;
    }

    isValidSelection(date) {
        const metadata = this.getDateMetadata(date);
        const dateString = date.toDateString();

        // Check if date is manually blocked
        if (this.blockedDates.has(dateString)) {
            return false;
        }

        // Check if date is a US holiday (if avoidance is enabled)
        if (this.avoidHolidays && this.isUSHoliday(date)) {
            return false;
        }

        // Rule 1: Only weekdays (Monday-Friday)
        if (metadata.dayOfWeek === 0 || metadata.dayOfWeek === 6) {
            return false;
        }

        // Apply rules based on selection mode
        if (this.monthlySelectionEnabled) {
            return this.isValidMonthlySelection(metadata);
        } else {
            return this.isValidQuarterlySelection(metadata);
        }
    }

    isValidQuarterlySelection(metadata) {
        // Rule 2: Once per quarter
        const quarterSelections = this.selectionHistory.filter(s =>
            s.year === metadata.year && s.quarter === metadata.quarter
        );
        if (quarterSelections.length >= 1) {
            return false;
        }

        // Rule 3: No more than 2 consecutive for monthOfQuarter
        if (this.hasConsecutiveViolation(metadata, 'monthOfQuarter')) {
            return false;
        }

        // Rule 4: No more than 2 consecutive for dayPeriod
        if (this.hasConsecutiveViolation(metadata, 'dayPeriod')) {
            return false;
        }

        // Rule 5: No more than 2 consecutive for dayOfWeek
        if (this.hasConsecutiveViolation(metadata, 'dayOfWeek')) {
            return false;
        }

        return true;
    }

    isValidMonthlySelection(metadata) {
        // Monthly selection validation logic

        // Rule 1: Monthly selections are only allowed in quarters that have quarterly selections
        if (!this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year)) {
            return false;
        }

        // Rule 2: Only one selection per month (counting quarterly selections as monthly)
        const allMonthlySelections = this.getAllMonthlySelections();
        const monthSelections = Array.from(allMonthlySelections).filter(dateString => {
            const date = new Date(dateString);
            const selectionMetadata = this.getDateMetadata(date);
            return selectionMetadata.year === metadata.year && selectionMetadata.month === metadata.month;
        });

        if (monthSelections.length >= 1) {
            return false;
        }

        // Rule 3: No more than 2 consecutive for dayPeriod (monthly context with quarterly-monthly dependency)
        if (this.hasConsecutiveViolationMonthlyWithDependency(metadata, 'dayPeriod')) {
            return false;
        }

        // Rule 4: No more than 2 consecutive for dayOfWeek (monthly context with quarterly-monthly dependency)
        if (this.hasConsecutiveViolationMonthlyWithDependency(metadata, 'dayOfWeek')) {
            return false;
        }

        // Rule 5: No more than 2 consecutive for monthOfQuarter (applies to monthly selections too)
        if (this.hasConsecutiveViolationMonthlyWithDependency(metadata, 'monthOfQuarter')) {
            return false;
        }

        return true;
    }

    getMonthlySelectionValidationError(metadata) {
        // Detailed validation with specific error messages

        // Rule 1: Monthly selections are only allowed in quarters that have quarterly selections
        if (!this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year)) {
            return {
                isValid: false,
                errorMessage: `Monthly selections require a quarterly selection in Quarter ${metadata.quarter} ${metadata.year} first. Please make a quarterly selection in this quarter before adding monthly selections.`
            };
        }

        // Rule 2: Only one selection per month (counting quarterly selections as monthly)
        const allMonthlySelections = this.getAllMonthlySelections();
        const monthSelections = Array.from(allMonthlySelections).filter(dateString => {
            const date = new Date(dateString);
            const selectionMetadata = this.getDateMetadata(date);
            return selectionMetadata.year === metadata.year && selectionMetadata.month === metadata.month;
        });

        if (monthSelections.length >= 1) {
            const existingDate = new Date(monthSelections[0]);
            const monthName = existingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return {
                isValid: false,
                errorMessage: `Only one selection per month is allowed. ${monthName} already has a selection on ${existingDate.toLocaleDateString()}.`
            };
        }

        // Rule 3: No more than 2 consecutive for dayPeriod
        if (this.hasConsecutiveViolationMonthlyWithDependency(metadata, 'dayPeriod')) {
            const periodNames = { 1: 'early (1-10)', 2: 'middle (11-20)', 3: 'late (21-31)' };
            return {
                isValid: false,
                errorMessage: `Cannot select 3 consecutive selections in the ${periodNames[metadata.dayPeriod]} period of the month. This would violate the consecutive day period rule.`
            };
        }

        // Rule 4: No more than 2 consecutive for dayOfWeek
        if (this.hasConsecutiveViolationMonthlyWithDependency(metadata, 'dayOfWeek')) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return {
                isValid: false,
                errorMessage: `Cannot select 3 consecutive ${dayNames[metadata.dayOfWeek]}s. This would violate the consecutive day of week rule.`
            };
        }

        // Rule 5: No more than 2 consecutive for monthOfQuarter
        if (this.hasConsecutiveViolationMonthlyWithDependency(metadata, 'monthOfQuarter')) {
            const monthNames = { 1: 'first', 2: 'second', 3: 'third' };
            return {
                isValid: false,
                errorMessage: `Cannot select 3 consecutive selections in the ${monthNames[metadata.monthOfQuarter]} month of quarters. This would violate the consecutive month pattern rule.`
            };
        }

        return { isValid: true };
    }

    hasConsecutiveViolationMonthly(newSelection, attribute) {
        // Sort history by date for monthly consecutive checking
        const sortedHistory = [...this.selectionHistory].sort((a, b) => a.date - b.date);

        // Get last 2 selections to check for consecutive pattern
        const recentSelections = sortedHistory.slice(-2);

        if (recentSelections.length < 2) {
            return false; // Not enough history to have 2 consecutive
        }

        // Check if last 2 selections have same attribute value as new selection
        const lastTwo = recentSelections.map(s => s[attribute]);
        const newValue = newSelection[attribute];

        return lastTwo.every(value => value === newValue);
    }

    hasConsecutiveViolationMonthlyWithDependency(newSelection, attribute) {
        // Get all monthly selections (quarterly + pure monthly) and sort by date
        const allMonthlySelections = this.getAllMonthlySelections();
        const allSelectionMetadata = [];

        // Convert all monthly selections to metadata
        allMonthlySelections.forEach(dateString => {
            const date = new Date(dateString);
            const metadata = this.getDateMetadata(date);
            allSelectionMetadata.push(metadata);
        });

        // Filter to only include selections within allowed time window (current + previous 2 quarters)
        const relevantSelections = allSelectionMetadata.filter(selection =>
            this.isWithinAllowedTimeWindow(selection, newSelection)
        );

        // Sort by date
        const sortedSelections = relevantSelections.sort((a, b) => a.date - b.date);

        // Find consecutive selections with same attribute value
        let consecutiveCount = 0;
        let lastValue = null;

        for (const selection of sortedSelections) {
            const currentValue = selection[attribute];

            if (currentValue === lastValue) {
                consecutiveCount++;
                if (consecutiveCount >= 2 && currentValue === newSelection[attribute]) {
                    return true; // Would create 3 consecutive
                }
            } else {
                consecutiveCount = 1;
                lastValue = currentValue;
            }
        }

        // Check if adding new selection would create 3 consecutive at the end
        if (sortedSelections.length > 0) {
            const lastSelection = sortedSelections[sortedSelections.length - 1];
            if (lastSelection[attribute] === newSelection[attribute]) {
                // Count backwards to see how many consecutive we already have
                let count = 1;
                for (let i = sortedSelections.length - 2; i >= 0; i--) {
                    if (sortedSelections[i][attribute] === newSelection[attribute]) {
                        count++;
                    } else {
                        break;
                    }
                }
                return count >= 2; // Would make 3 consecutive
            }
        }

        return false;
    }

    isValidMonthlyDayAlignment(metadata) {
        // Find the quarterly selection for this quarter
        const quarterlySelection = this.selectionHistory.find(s =>
            s.year === metadata.year && s.quarter === metadata.quarter
        );

        if (!quarterlySelection) {
            return true; // No quarterly selection yet, so any day is valid
        }

        // Monthly selection must be on the same day of week as quarterly selection
        return metadata.dayOfWeek === quarterlySelection.dayOfWeek;
    }

    setMonthDisplayCount(count) {
        if (count < 3 || count > 12) {
            console.warn('Month display count must be between 3 and 12');
            return;
        }

        this.monthDisplayCount = count;
        this.monthDisplayCountSelect.value = count;
        this.calculateValidDays();
        this.renderCalendar();
    }

    getMonthDisplayCount() {
        return this.monthDisplayCount;
    }

    calculateValidDays() {
        this.validDays.clear();

        const startYear = this.currentDate.getFullYear();
        const startMonth = this.currentDate.getMonth();

        // Calculate valid days for configured number of months starting from current date
        for (let monthOffset = 0; monthOffset < this.monthDisplayCount; monthOffset++) {
            const date = new Date(startYear, startMonth + monthOffset, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month, day);
                const dateString = currentDate.toDateString();

                if (this.isValidSelection(currentDate)) {
                    this.validDays.add(dateString);
                }
            }
        }
    }

    changePeriod(monthsToAdd) {
        this.currentDate.setMonth(this.currentDate.getMonth() + monthsToAdd);
        this.calculateValidDays();
        this.renderCalendar();
    }

    renderCalendar() {
        const startYear = this.currentDate.getFullYear();
        const startMonth = this.currentDate.getMonth();

        // Update period header to show the configured month range
        const startDate = new Date(startYear, startMonth, 1);
        const endDate = new Date(startYear, startMonth + this.monthDisplayCount - 1, 1);

        const startMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate);
        const endMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endDate);
        const startYearStr = startDate.getFullYear();
        const endYearStr = endDate.getFullYear();

        if (startYearStr === endYearStr) {
            this.currentPeriodEl.textContent = `${startMonthName} - ${endMonthName} ${startYearStr}`;
        } else {
            this.currentPeriodEl.textContent = `${startMonthName} ${startYearStr} - ${endMonthName} ${endYearStr}`;
        }

        // Clear calendar and set appropriate CSS class
        this.calendarEl.innerHTML = '';
        this.calendarEl.className = `calendar-grid months-${this.monthDisplayCount}`;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Create month grids based on configured count
        for (let monthOffset = 0; monthOffset < this.monthDisplayCount; monthOffset++) {
            const currentDate = new Date(startYear, startMonth + monthOffset, 1);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-container';

            // Add quarter-level visual indicators for monthly selection mode
            if (this.monthlySelectionEnabled) {
                const quarter = this.getQuarter(currentDate);
                const eligibilityInfo = this.getQuarterEligibilityInfo(quarter, year);

                if (eligibilityInfo.hasQuarterly) {
                    monthContainer.classList.add('has-quarterly-selection', 'eligible-for-monthly');
                    monthContainer.title = `Quarter ${quarter} ${eligibilityInfo.year}: Has quarterly selection - eligible for monthly selections\n• Current monthly selections: ${eligibilityInfo.monthlyCount}\n• Click on valid days to add monthly selections\n• Monthly selections will be removed if quarterly selection is removed`;
                } else {
                    monthContainer.classList.add('no-quarterly-selection');
                    monthContainer.title = `Quarter ${quarter} ${year}: No quarterly selection found\n• Monthly selections require a quarterly selection first\n• Make a quarterly selection in this quarter to enable monthly selections\n• Only one quarterly selection per quarter is allowed`;
                }
            }

            // Month header
            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.textContent = `${monthNames[month]} ${year}`;
            monthContainer.appendChild(monthHeader);

            // Month grid
            const monthGrid = document.createElement('div');
            monthGrid.className = 'month-grid';

            // Add day headers for each month
            dayHeaders.forEach(day => {
                const dayHeaderEl = document.createElement('div');
                dayHeaderEl.className = 'day-header-small';
                dayHeaderEl.textContent = day;
                monthGrid.appendChild(dayHeaderEl);
            });

            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Add empty cells for days before month starts
            for (let i = 0; i < firstDay; i++) {
                const emptyEl = document.createElement('div');
                emptyEl.className = 'day-cell empty';
                monthGrid.appendChild(emptyEl);
            }

            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('div');
                const date = new Date(year, month, day);
                const dateString = date.toDateString();

                dayEl.className = 'day-cell';
                dayEl.textContent = day;

                // Check if day is blocked
                if (this.blockedDates.has(dateString)) {
                    dayEl.classList.add('blocked');
                    dayEl.title = 'Manually blocked date';
                } else if (this.avoidHolidays && this.isUSHoliday(date)) {
                    dayEl.classList.add('holiday');
                    dayEl.title = 'US Federal Holiday';
                } else if (this.validDays.has(dateString)) {
                    dayEl.classList.add('valid');
                } else {
                    dayEl.classList.add('invalid');
                }

                // Check if day is selected and apply appropriate styling
                if (this.selectedDays.has(dateString)) {
                    if (this.monthlySelectionEnabled) {
                        dayEl.classList.add('selected', 'quarterly-selected');
                        dayEl.title = `Quarterly selection: ${date.toLocaleDateString()}\n• Enables monthly selections for Quarter ${this.getQuarter(date)} ${date.getFullYear()}\n• Click to remove (will also remove all monthly selections in this quarter)\n• Only one quarterly selection per quarter allowed`;
                    } else {
                        dayEl.classList.add('selected');
                        dayEl.title = 'Selected date';
                    }
                } else if (this.monthlySelectionEnabled && this.monthlySelectedDays.has(dateString)) {
                    dayEl.classList.add('selected', 'monthly-selected');
                    dayEl.title = `Monthly selection: ${date.toLocaleDateString()}\n• Additional selection in Quarter ${this.getQuarter(date)} ${date.getFullYear()}\n• Depends on quarterly selection in same quarter\n• Click to remove this monthly selection\n• Only one selection per month allowed`;
                }

                // Add monthly selection visual indicators
                if (this.monthlySelectionEnabled && !this.selectedDays.has(dateString) && !this.monthlySelectedDays.has(dateString)) {
                    const metadata = this.getDateMetadata(date);
                    if (this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year)) {
                        // Quarter has quarterly selection - eligible for monthly
                        if (this.validDays.has(dateString)) {
                            dayEl.classList.add('monthly-eligible');
                            dayEl.title = `Available for monthly selection: ${date.toLocaleDateString()}\n• Quarter ${this.getQuarter(date)} ${date.getFullYear()} has quarterly selection\n• Click to add as monthly selection\n• Must follow monthly selection rules (one per month, no 3 consecutive patterns)\n• Will be removed if quarterly selection is removed`;
                        } else {
                            // Not valid for selection but in eligible quarter
                            dayEl.title = `Not available for monthly selection: ${date.toLocaleDateString()}\n• Quarter ${this.getQuarter(date)} ${date.getFullYear()} has quarterly selection but this day violates monthly rules\n• Possible reasons: Month already has selection, would create 3 consecutive patterns\n• Click for detailed validation information`;
                        }
                    } else if (!this.blockedDates.has(dateString) && !(this.avoidHolidays && this.isUSHoliday(date))) {
                        // Quarter doesn't have quarterly selection - show prerequisite missing
                        dayEl.classList.add('quarterly-prerequisite-missing');
                        dayEl.title = `Monthly selection not available: ${date.toLocaleDateString()}\n• Quarter ${this.getQuarter(date)} ${date.getFullYear()} requires quarterly selection first\n• Make a quarterly selection in this quarter to enable monthly selections\n• Click for more information about monthly selection requirements`;
                    }
                }

                // Add click handlers
                if (this.validDays.has(dateString)) {
                    dayEl.addEventListener('click', () => this.toggleDay(dateString, dayEl, date));
                    dayEl.style.cursor = 'pointer';
                } else if (this.selectedDays.has(dateString)) {
                    // Allow clicking on selected days to remove them even if they're no longer valid
                    dayEl.addEventListener('click', () => this.removeSelectedDay(dateString));
                    dayEl.style.cursor = 'pointer';
                    dayEl.title = `Quarterly selection: ${date.toLocaleDateString()}\n• Click to remove this quarterly selection\n• Warning: Removing will also remove all monthly selections in Quarter ${this.getQuarter(date)} ${date.getFullYear()}\n• This enables monthly selections for the quarter`;
                } else if (this.monthlySelectionEnabled && this.monthlySelectedDays.has(dateString)) {
                    // Allow clicking on monthly selected days to remove them
                    dayEl.addEventListener('click', () => this.removeMonthlySelection(dateString));
                    dayEl.style.cursor = 'pointer';
                    dayEl.title = `Monthly selection: ${date.toLocaleDateString()}\n• Click to remove this monthly selection\n• Quarterly selection in Quarter ${this.getQuarter(date)} ${date.getFullYear()} will remain\n• Other monthly selections in this quarter will not be affected`;
                } else if (this.monthlySelectionEnabled && !this.validDays.has(dateString)) {
                    // In monthly mode, allow clicking on invalid days to show feedback
                    const metadata = this.getDateMetadata(date);
                    if (!this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year)) {
                        dayEl.addEventListener('click', () => this.showInvalidSelectionFeedback(dayEl, `Monthly selections require a quarterly selection in Quarter ${metadata.quarter} ${metadata.year} first. Click on a valid day in this quarter to make a quarterly selection first.`, 'prerequisite'));
                        dayEl.style.cursor = 'pointer';
                    } else {
                        dayEl.addEventListener('click', () => {
                            // Determine specific reason for invalid monthly selection
                            let reason = 'Invalid monthly selection';
                            if (this.blockedDates.has(dateString)) {
                                reason = 'Date is manually blocked';
                            } else if (this.avoidHolidays && this.isUSHoliday(date)) {
                                reason = 'Date is a holiday';
                            } else if (metadata.dayOfWeek === 0 || metadata.dayOfWeek === 6) {
                                reason = 'Only weekdays are allowed';
                            } else {
                                // Check specific monthly rules
                                const allMonthlySelections = this.getAllMonthlySelections();
                                const monthSelections = Array.from(allMonthlySelections).filter(ds => {
                                    const d = new Date(ds);
                                    const m = this.getDateMetadata(d);
                                    return m.year === metadata.year && m.month === metadata.month;
                                });
                                if (monthSelections.length >= 1) {
                                    reason = 'Only one selection per month allowed';
                                } else {
                                    reason = 'Violates consecutive selection rules';
                                }
                            }
                            this.showInvalidSelectionFeedback(dayEl, reason, 'validation');
                        });
                        dayEl.style.cursor = 'pointer';
                    }
                } else if (this.blockedDates.has(dateString)) {
                    dayEl.addEventListener('click', () => this.removeBlockedDate(dateString));
                    dayEl.style.cursor = 'pointer';
                    dayEl.title += ' (Click to unblock)';
                }

                monthGrid.appendChild(dayEl);
            }

            monthContainer.appendChild(monthGrid);
            this.calendarEl.appendChild(monthContainer);
        }

        this.updateSelectedDaysDisplay();
    }

    toggleDay(dateString, dayEl, date) {
        const metadata = this.getDateMetadata(date);

        // Check if removing an existing selection
        if (this.selectedDays.has(dateString)) {
            // Removing a quarterly selection - handle dependency cleanup
            this.removeSelectedDay(dateString);
            return;
        } else if (this.monthlySelectedDays.has(dateString)) {
            // Removing a pure monthly selection
            this.removeMonthlySelection(dateString);
            return;
        }

        // Determine selection type: when monthly selection is enabled, default to monthly unless explicitly in quarterly mode
        if (this.monthlySelectionEnabled && this.currentSelectionMode !== 'quarterly') {
            // Make monthly selection (default when monthly selection is enabled)
            if (!this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year)) {
                // Show visual feedback for invalid monthly selection attempt
                this.showInvalidSelectionFeedback(dayEl, `Monthly selections require a quarterly selection in Quarter ${metadata.quarter} ${metadata.year} first. Please make a quarterly selection in this quarter before adding monthly selections.`, 'prerequisite');
                return;
            }

            // Check if this would be a valid monthly selection with detailed error message
            const validationResult = this.getMonthlySelectionValidationError(metadata);
            if (validationResult.isValid == false) {
                this.showInvalidSelectionFeedback(dayEl, validationResult.errorMessage, 'validation');
                return;
            }

            // Add as monthly selection
            this.monthlySelectedDays.add(dateString);
            dayEl.classList.add('selected', 'monthly-selected', 'selection-success');

            // Show success feedback for monthly selection
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            this.showSuccessNotification(`Monthly selection added for ${monthName}. You can add more monthly selections in quarters with quarterly selections.`);

            // Update monthly display
            this.updateMonthlySelectedDaysDisplay();
        } else {
            // Adding a quarterly selection (when monthly is disabled OR explicitly in quarterly mode)

            // Validate quarterly selection
            if (!this.isValidQuarterlySelection(metadata)) {
                // Show appropriate error message for quarterly selection
                let errorMessage = 'This selection is not valid.';

                // Check specific quarterly validation rules
                const quarterSelections = this.selectionHistory.filter(s =>
                    s.year === metadata.year && s.quarter === metadata.quarter
                );
                if (quarterSelections.length >= 1) {
                    errorMessage = `Only one selection per quarter is allowed. Quarter ${metadata.quarter} ${metadata.year} already has a selection.`;
                } else if (this.hasConsecutiveViolation(metadata, 'monthOfQuarter')) {
                    errorMessage = `Cannot select 3 consecutive selections in the same month of quarter. This would violate the consecutive pattern rule.`;
                } else if (this.hasConsecutiveViolation(metadata, 'dayPeriod')) {
                    errorMessage = `Cannot select 3 consecutive selections in the same day period. This would violate the consecutive pattern rule.`;
                } else if (this.hasConsecutiveViolation(metadata, 'dayOfWeek')) {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    errorMessage = `Cannot select 3 consecutive ${dayNames[metadata.dayOfWeek]}s. This would violate the consecutive day of week rule.`;
                }

                this.showInvalidSelectionFeedback(dayEl, errorMessage, 'validation');
                return;
            }

            // Add quarterly selection
            this.selectedDays.add(dateString);
            dayEl.classList.add('selected', 'quarterly-selected', 'selection-success');

            // Add to history with metadata
            this.selectionHistory.push(metadata);

            // If monthly mode is enabled, add to quarterly-to-monthly mapping
            if (this.monthlySelectionEnabled) {
                const quarterKey = `Q${metadata.quarter}-${metadata.year}`;
                this.quarterlyToMonthlyMapping.set(dateString, quarterKey);
            }

            // Show success feedback for quarterly selection
            const successMessage = this.monthlySelectionEnabled
                ? `Quarterly selection added for Quarter ${metadata.quarter} ${metadata.year}. This quarter is now eligible for monthly selections.`
                : `Quarterly selection added for Quarter ${metadata.quarter} ${metadata.year}.`;
            this.showSuccessNotification(successMessage);
        }

        // Recalculate valid days after selection change
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectedDaysDisplay();
        this.updateSelectionHistoryDisplay();

        // Save profile after selection change
        this.saveCurrentProfile();
    }

    updateSelectionHistoryDisplay() {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        if (this.monthlySelectionEnabled) {
            // Show both quarterly and monthly selections when monthly mode is enabled
            const allSelections = [];

            // Add quarterly selections
            this.selectionHistory.forEach(selection => {
                allSelections.push({
                    ...selection,
                    selectionType: 'quarterly'
                });
            });

            // Add pure monthly selections
            this.monthlySelectedDays.forEach(dateString => {
                const date = new Date(dateString);
                const metadata = this.getDateMetadata(date);
                allSelections.push({
                    ...metadata,
                    selectionType: 'monthly'
                });
            });

            if (allSelections.length === 0) {
                this.selectionHistoryEl.innerHTML = '<em>No selections made</em>';
                return;
            }

            const sortedSelections = allSelections.sort((a, b) => a.date - b.date);

            let html = '<div class="history-list">';
            sortedSelections.forEach(selection => {
                const typeClass = selection.selectionType === 'quarterly' ? 'quarterly-type' : 'monthly-mode';
                const typeBadge = selection.selectionType === 'quarterly' ?
                    '<span class="selection-type-badge quarterly">Q</span>' :
                    '<span class="selection-type-badge monthly">M</span>';

                html += `<div class="history-item ${typeClass}">
                    <strong>${selection.date.toLocaleDateString()}</strong> (${dayNames[selection.dayOfWeek]})${typeBadge}
                    <br>Q${selection.quarter}, Month ${selection.monthOfQuarter}, Period ${selection.dayPeriod}
                </div>`;
            });
            html += '</div>';

            this.selectionHistoryEl.innerHTML = html;
        } else {
            // Show only quarterly selections when monthly mode is disabled
            if (this.selectionHistory.length === 0) {
                this.selectionHistoryEl.innerHTML = '<em>No selections made</em>';
                return;
            }

            const sortedHistory = [...this.selectionHistory].sort((a, b) => a.date - b.date);

            let html = '<div class="history-list">';
            sortedHistory.forEach(selection => {
                html += `<div class="history-item">
                    <strong>${selection.date.toLocaleDateString()}</strong> (${dayNames[selection.dayOfWeek]})
                    <br>Q${selection.quarter}, Month ${selection.monthOfQuarter}, Period ${selection.dayPeriod}
                </div>`;
            });
            html += '</div>';

            this.selectionHistoryEl.innerHTML = html;
        }
    }

    updateSelectedDaysDisplay() {
        this.selectedDaysEl.innerHTML = '';

        const sortedDays = Array.from(this.selectedDays).sort((a, b) => new Date(a) - new Date(b));

        if (sortedDays.length === 0) {
            this.selectedDaysEl.innerHTML = '<em>No days selected</em>';
            return;
        }

        sortedDays.forEach(dateString => {
            const tag = document.createElement('div');
            tag.className = 'selected-day-tag';

            const dateSpan = document.createElement('span');
            dateSpan.textContent = new Date(dateString).toLocaleDateString();

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-selected';
            removeBtn.innerHTML = '×';
            removeBtn.title = 'Remove this selection';
            removeBtn.onclick = () => this.removeSelectedDay(dateString);

            tag.appendChild(dateSpan);
            tag.appendChild(removeBtn);
            this.selectedDaysEl.appendChild(tag);
        });
    }

    updateBlockedDatesDisplay() {
        if (this.blockedDates.size === 0) {
            this.blockedDatesListEl.innerHTML = '<em>No dates blocked</em>';
            return;
        }

        const sortedBlocked = Array.from(this.blockedDates).sort((a, b) => new Date(a) - new Date(b));

        let html = '<div class="blocked-list">';
        sortedBlocked.forEach(dateString => {
            const date = new Date(dateString);
            html += `<div class="blocked-item">
                <span>${date.toLocaleDateString()}</span>
                <button class="remove-blocked" onclick="calendar.removeBlockedDate('${dateString}')">×</button>
            </div>`;
        });
        html += '</div>';

        this.blockedDatesListEl.innerHTML = html;
    }

    // Floating toggle setup and management
    setupFloatingToggle() {
        this.floatingToggle = document.getElementById('floatingMonthlyToggle');
        this.floatingCheckbox = document.getElementById('floatingEnableMonthlySelection');
        this.floatingStatus = document.getElementById('floatingToggleStatus');
        this.floatingCollapseBtn = document.getElementById('floatingToggleCollapse');
        this.originalToggle = document.getElementById('enableMonthlySelection');
        this.selectionOptionsSection = document.querySelector('.selection-options');

        // Track scroll position to show/hide floating toggle
        this.setupScrollListener();

        // Sync floating toggle with original toggle
        this.setupToggleSync();

        // Handle collapse/expand functionality
        this.setupCollapseToggle();
    }

    setupScrollListener() {
        let ticking = false;

        const updateFloatingToggle = () => {
            if (!this.selectionOptionsSection || !this.floatingToggle) return;

            const rect = this.selectionOptionsSection.getBoundingClientRect();
            const isOriginalVisible = rect.bottom > 0 && rect.top < window.innerHeight;

            if (!isOriginalVisible && window.scrollY > 200) {
                // Show floating toggle when original is not visible and user has scrolled down
                this.showFloatingToggle();
            } else {
                // Hide floating toggle when original is visible or at top of page
                this.hideFloatingToggle();
            }

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateFloatingToggle);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        // Initial check
        setTimeout(updateFloatingToggle, 100);
    }

    setupToggleSync() {
        if (!this.floatingCheckbox || !this.originalToggle) return;

        // Sync floating toggle with original toggle
        const syncToggles = (sourceCheckbox, targetCheckbox, updateStatus = false) => {
            targetCheckbox.checked = sourceCheckbox.checked;

            if (updateStatus && this.floatingStatus) {
                this.updateFloatingStatus(sourceCheckbox.checked);
            }

            // Trigger the monthly selection toggle
            this.toggleMonthlySelection(sourceCheckbox.checked);
        };

        // Original toggle changes floating toggle
        this.originalToggle.addEventListener('change', (e) => {
            syncToggles(e.target, this.floatingCheckbox, true);
        });

        // Floating toggle changes original toggle
        this.floatingCheckbox.addEventListener('change', (e) => {
            syncToggles(e.target, this.originalToggle, true);
        });

        // Initial sync
        this.floatingCheckbox.checked = this.originalToggle.checked;
        this.updateFloatingStatus(this.originalToggle.checked);
    }

    setupCollapseToggle() {
        if (!this.floatingCollapseBtn || !this.floatingToggle) return;

        let isCollapsed = false;

        this.floatingCollapseBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;

            if (isCollapsed) {
                this.floatingToggle.classList.add('collapsed');
                this.floatingCollapseBtn.title = 'Show floating toggle';
            } else {
                this.floatingToggle.classList.remove('collapsed');
                this.floatingCollapseBtn.title = 'Hide floating toggle';
            }
        });
    }

    showFloatingToggle() {
        if (!this.floatingToggle) return;

        this.floatingToggle.style.display = 'block';
        // Force reflow to ensure animation plays
        this.floatingToggle.offsetHeight;
        this.floatingToggle.style.opacity = '1';
    }

    hideFloatingToggle() {
        if (!this.floatingToggle) return;

        this.floatingToggle.style.opacity = '0';
        setTimeout(() => {
            if (this.floatingToggle.style.opacity === '0') {
                this.floatingToggle.style.display = 'none';
            }
        }, 300);
    }

    updateFloatingStatus(isEnabled) {
        if (!this.floatingStatus) return;

        // Add changing animation
        this.floatingStatus.classList.add('changing');

        setTimeout(() => {
            if (this.floatingStatus) {
                this.floatingStatus.textContent = isEnabled ? 'ON' : 'OFF';
                this.floatingStatus.className = `toggle-status ${isEnabled ? 'on' : 'off'}`;

                // Remove changing animation
                setTimeout(() => {
                    if (this.floatingStatus) {
                        this.floatingStatus.classList.remove('changing');
                    }
                }, 150);
            }
        }, 150);
    }



    // Integration test runner
    async runIntegrationTests() {
        const testResults = [];
        let passed = 0;
        let failed = 0;

        const addResult = (testName, success, message = '') => {
            testResults.push({ testName, success, message });
            if (success) {
                passed++;
                console.log(`✅ ${testName}: PASSED`);
            } else {
                failed++;
                console.error(`❌ ${testName}: FAILED - ${message}`);
            }
        };

        console.log('🧪 Running Monthly Selection Integration Tests...');

        try {
            // Test 1: Monthly Selection Mode Toggle
            const initialState = this.monthlySelectionEnabled;
            this.toggleMonthlySelection(true);
            addResult('Monthly Selection Enable', this.monthlySelectionEnabled === true, 'Failed to enable monthly selection');

            this.toggleMonthlySelection(false);
            addResult('Monthly Selection Disable', this.monthlySelectionEnabled === false, 'Failed to disable monthly selection');

            // Restore initial state
            this.toggleMonthlySelection(initialState);

            // Test 2: Month Display Configuration
            const originalCount = this.monthDisplayCount;
            this.setMonthDisplayCount(6);
            addResult('Month Display Count Change', this.monthDisplayCount === 6, 'Failed to change month display count');

            // Test invalid count
            this.setMonthDisplayCount(15);
            addResult('Invalid Month Count Rejection', this.monthDisplayCount === 6, 'Failed to reject invalid month count');

            // Restore original
            this.setMonthDisplayCount(originalCount);

            // Test 3: Profile Data Management
            this.toggleMonthlySelection(true);
            this.setMonthDisplayCount(8);

            const profileData = this.getCurrentProfileData();
            addResult('Profile Data Export',
                profileData.monthlySelectionEnabled !== undefined &&
                profileData.monthDisplayCount !== undefined &&
                profileData.monthlySelectedDays !== undefined,
                'Profile data missing monthly fields');

            // Test profile import
            const testProfile = {
                monthlySelectionEnabled: false,
                monthDisplayCount: 4,
                monthlySelectedDays: [],
                selectedDays: [],
                selectionHistory: [],
                blockedDates: [],
                avoidHolidays: true
            };

            this.loadProfileData(testProfile);
            addResult('Profile Data Import',
                this.monthlySelectionEnabled === false && this.monthDisplayCount === 4,
                'Failed to import profile data correctly');

            // Test 4: Validation Rules
            this.toggleMonthlySelection(true);
            this.clearAllSelected();

            // Test quarterly prerequisite
            const testDate = new Date(2024, 1, 15); // February 15, 2024
            const metadata = this.getDateMetadata(testDate);
            const hasQuarterly = this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year);
            addResult('Quarterly Prerequisite Check', !hasQuarterly, 'Should not have quarterly selection initially');

            const validation = this.getMonthlySelectionValidationError(metadata);
            addResult('Monthly Validation Without Quarterly',
                !validation.isValid && validation.errorMessage.includes('quarterly'),
                'Should require quarterly prerequisite');

            // Test 5: getAllMonthlySelections
            this.selectedDays.clear();
            this.monthlySelectedDays.clear();

            this.selectedDays.add('Mon Mar 15 2024');
            this.monthlySelectedDays.add('Tue Feb 20 2024');

            const allMonthly = this.getAllMonthlySelections();
            addResult('getAllMonthlySelections Method',
                allMonthly.has('Mon Mar 15 2024') && allMonthly.has('Tue Feb 20 2024'),
                'getAllMonthlySelections should include both quarterly and monthly selections');

            // Test 6: Clear All Functionality
            this.clearAllSelected();
            addResult('Clear All Selections',
                this.selectedDays.size === 0 && this.monthlySelectedDays.size === 0,
                'Clear all should remove both quarterly and monthly selections');

            // Test 7: Date Metadata
            const testMetadata = this.getDateMetadata(new Date(2024, 1, 15));
            addResult('Date Metadata Generation',
                testMetadata.year === 2024 &&
                testMetadata.quarter === 1 &&
                testMetadata.month === 2 &&
                testMetadata.monthOfQuarter === 2,
                'Date metadata should be correctly calculated');

            // Test 8: Backward Compatibility
            const legacyProfile = {
                selectedDays: ['Mon Mar 15 2024'],
                selectionHistory: [],
                blockedDates: [],
                avoidHolidays: true
                // No monthly data
            };

            this.loadProfileData(legacyProfile);
            addResult('Backward Compatibility',
                !this.monthlySelectionEnabled && this.selectedDays.size === 1,
                'Legacy profile should load without monthly mode enabled');

            // Test 9: Floating Toggle Functionality
            if (this.floatingToggle && this.floatingCheckbox) {
                // Test floating toggle sync
                this.toggleMonthlySelection(true);
                const floatingChecked = this.floatingCheckbox.checked;
                const originalChecked = this.enableMonthlyCheckbox.checked;

                addResult('Floating Toggle Sync',
                    floatingChecked === originalChecked && floatingChecked === true,
                    'Floating toggle should sync with original toggle');

                // Test floating status update
                const statusText = this.floatingStatus ? this.floatingStatus.textContent : '';
                addResult('Floating Status Update',
                    statusText === 'ON',
                    'Floating status should show ON when enabled');
            } else {
                addResult('Floating Toggle Elements', false, 'Floating toggle elements not found');
            }

        } catch (error) {
            addResult('Test Execution', false, `Test execution failed: ${error.message}`);
        }

        // Display results
        this.displayTestResults(passed, failed, testResults);

        console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            console.log('🎉 ALL INTEGRATION TESTS PASSED!');
        } else {
            console.log(`⚠️ ${failed} test(s) failed. See results above.`);
        }

        return { passed, failed, testResults };
    }

    displayTestResults(passed, failed, testResults) {
        // Remove existing results
        const existingResults = document.getElementById('integrationTestResults');
        if (existingResults) {
            existingResults.remove();
        }

        // Create results display
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'integrationTestResults';
        resultsDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 3px solid ${failed === 0 ? '#28a745' : '#dc3545'};
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        const header = document.createElement('h3');
        header.style.cssText = `
            margin: 0 0 15px 0;
            color: ${failed === 0 ? '#28a745' : '#dc3545'};
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        header.innerHTML = `${failed === 0 ? '✅' : '❌'} Integration Test Results`;

        const summary = document.createElement('div');
        summary.style.cssText = 'margin-bottom: 15px; font-weight: 600;';
        summary.innerHTML = `
            <div style="color: #28a745;">✅ Passed: ${passed}</div>
            <div style="color: #dc3545;">❌ Failed: ${failed}</div>
            <div style="color: #6c757d;">📊 Total: ${passed + failed}</div>
        `;

        const detailsToggle = document.createElement('button');
        detailsToggle.textContent = 'Show Details';
        detailsToggle.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
            font-size: 12px;
        `;

        const detailsList = document.createElement('div');
        detailsList.style.cssText = 'display: none; font-size: 12px; max-height: 200px; overflow-y: auto;';

        testResults.forEach(result => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 6px;
                margin: 4px 0;
                border-radius: 4px;
                background: ${result.success ? '#d4edda' : '#f8d7da'};
                border-left: 3px solid ${result.success ? '#28a745' : '#dc3545'};
            `;
            item.innerHTML = `
                <strong>${result.success ? '✅' : '❌'} ${result.testName}</strong>
                ${result.message ? `<br><small style="color: #6c757d;">${result.message}</small>` : ''}
            `;
            detailsList.appendChild(item);
        });

        detailsToggle.addEventListener('click', () => {
            const isVisible = detailsList.style.display !== 'none';
            detailsList.style.display = isVisible ? 'none' : 'block';
            detailsToggle.textContent = isVisible ? 'Show Details' : 'Hide Details';
        });

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6c757d;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.addEventListener('click', () => resultsDiv.remove());

        resultsDiv.appendChild(closeBtn);
        resultsDiv.appendChild(header);
        resultsDiv.appendChild(summary);
        resultsDiv.appendChild(detailsToggle);
        resultsDiv.appendChild(detailsList);

        document.body.appendChild(resultsDiv);

        // Auto-remove after 15 seconds if all tests passed
        if (failed === 0) {
            setTimeout(() => {
                if (resultsDiv.parentElement) {
                    resultsDiv.remove();
                }
            }, 15000);
        }
    }

    // Additional methods for testing and external access
    getCurrentProfileData() {
        // Return current profile data for testing/export
        return {
            selectedDays: Array.from(this.selectedDays),
            selectionHistory: this.selectionHistory,
            blockedDates: Array.from(this.blockedDates),
            avoidHolidays: this.avoidHolidays,
            monthDisplayCount: this.monthDisplayCount,
            monthlySelectionEnabled: this.monthlySelectionEnabled,
            monthlySelectedDays: Array.from(this.monthlySelectedDays),
            quarterlyToMonthlyMapping: Object.fromEntries(this.quarterlyToMonthlyMapping),
            currentSelectionMode: this.currentSelectionMode
        };
    }

    loadProfileData(profileData) {
        // Load profile data from external source (for testing/import)
        try {
            if (profileData.selectedDays) {
                this.selectedDays = new Set(profileData.selectedDays);
            }

            if (profileData.selectionHistory) {
                this.selectionHistory = profileData.selectionHistory.map(s => ({
                    ...s,
                    date: new Date(s.date)
                }));
            }

            if (profileData.blockedDates) {
                this.blockedDates = new Set(profileData.blockedDates);
            }

            if (profileData.avoidHolidays !== undefined) {
                this.avoidHolidays = profileData.avoidHolidays;
                this.avoidHolidaysCheckbox.checked = this.avoidHolidays;
            }

            if (profileData.monthDisplayCount !== undefined) {
                this.setMonthDisplayCount(profileData.monthDisplayCount);
            }

            // Handle monthly selection data (with backward compatibility)
            if (profileData.monthlySelectionEnabled !== undefined) {
                this.toggleMonthlySelection(profileData.monthlySelectionEnabled);
            } else {
                // Default to false for legacy profiles
                this.toggleMonthlySelection(false);
            }

            if (profileData.monthlySelectedDays) {
                this.monthlySelectedDays = new Set(profileData.monthlySelectedDays);
            }

            if (profileData.quarterlyToMonthlyMapping) {
                this.quarterlyToMonthlyMapping = new Map(Object.entries(profileData.quarterlyToMonthlyMapping));
            }

            // Restore selection mode
            if (profileData.currentSelectionMode) {
                this.currentSelectionMode = profileData.currentSelectionMode;
            } else {
                this.currentSelectionMode = 'quarterly'; // Default for legacy profiles
            }

            // Update mode buttons if monthly selection is enabled
            if (this.monthlySelectionEnabled) {
                this.setSelectionMode(this.currentSelectionMode);
            }

            // Update displays
            this.calculateValidDays();
            this.renderCalendar();
            this.updateSelectedDaysDisplay();
            this.updateSelectionHistoryDisplay();
            this.updateBlockedDatesDisplay();

            if (this.monthlySelectionEnabled) {
                this.updateMonthlySelectedDaysDisplay();
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            throw error;
        }
    }

    // Profile Management Methods
    loadProfiles() {
        const saved = localStorage.getItem('calendarProfiles');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading profiles:', e);
            }
        }

        // Initialize with default profile
        return {
            'default': {
                name: 'Default Profile',
                profileType: 'quarterly',
                selectedDays: [],
                selectionHistory: [],
                blockedDates: [],
                avoidHolidays: true,
                monthDisplayCount: 9,
                monthlySelectedDays: [],
                monthlySelectionEnabled: false,
                quarterlyToMonthlyMapping: [],
                created: new Date().toISOString()
            }
        };
    }

    saveProfiles() {
        try {
            localStorage.setItem('calendarProfiles', JSON.stringify(this.profiles));
        } catch (e) {
            console.error('Error saving profiles:', e);
            alert('Error saving profiles. Storage may be full.');
        }
    }

    saveCurrentProfile() {
        if (!this.profiles[this.currentProfile]) {
            this.profiles[this.currentProfile] = {
                name: this.currentProfile,
                created: new Date().toISOString()
            };
        }

        this.profiles[this.currentProfile] = {
            ...this.profiles[this.currentProfile],
            profileType: this.currentProfileType,
            selectedDays: Array.from(this.selectedDays),
            selectionHistory: this.selectionHistory.map(s => ({
                ...s,
                date: s.date.toISOString()
            })),
            blockedDates: Array.from(this.blockedDates),
            avoidHolidays: this.avoidHolidays,
            monthDisplayCount: this.monthDisplayCount,
            monthlySelectedDays: Array.from(this.monthlySelectedDays),
            monthlySelectionEnabled: this.monthlySelectionEnabled,
            quarterlyToMonthlyMapping: Array.from(this.quarterlyToMonthlyMapping.entries()),
            lastModified: new Date().toISOString()
        };

        this.saveProfiles();
    }

    loadProfile(profileId) {
        try {
            const profile = this.profiles[profileId];
            if (!profile) {
                this.showErrorNotification(`Profile '${profileId}' not found.`);
                return;
            }

            this.selectedDays = new Set(profile.selectedDays || []);
            this.selectionHistory = (profile.selectionHistory || []).map(s => ({
                ...s,
                date: new Date(s.date)
            }));
            this.blockedDates = new Set(profile.blockedDates || []);
            this.avoidHolidays = profile.avoidHolidays !== undefined ? profile.avoidHolidays : true;
            this.monthDisplayCount = profile.monthDisplayCount || 9;
            this.currentProfileType = profile.profileType || 'quarterly';

            // Load monthly selection data with validation
            this.monthlySelectedDays = new Set(profile.monthlySelectedDays || []);
            this.monthlySelectionEnabled = profile.monthlySelectionEnabled || false;
            this.quarterlyToMonthlyMapping = new Map(profile.quarterlyToMonthlyMapping || []);

            // Update UI elements
            this.avoidHolidaysCheckbox.checked = this.avoidHolidays;
            this.monthDisplayCountSelect.value = this.monthDisplayCount;
            if (this.enableMonthlyCheckbox) {
                this.enableMonthlyCheckbox.checked = this.monthlySelectionEnabled;
            }

            // Update monthly selection UI state
            if (this.monthlySelectionEnabled) {
                this.selectionModeControlsEl.style.display = 'block';
                this.monthlySelectionsSectionEl.style.display = 'block';
                this.quarterlyModeBtnEl.classList.add('active');
                this.monthlyModeBtnEl.classList.add('active');

                // Validate monthly selection integrity after loading
                this.validateMonthlySelectionIntegrity();
                this.handleMonthlySelectionEdgeCases();
            } else {
                this.selectionModeControlsEl.style.display = 'none';
                this.monthlySelectionsSectionEl.style.display = 'none';
                this.quarterlyModeBtnEl.classList.add('active');
                this.monthlyModeBtnEl.classList.remove('active');
            }

            this.updateRulesDisplay();
            this.updateMonthlySelectedDaysDisplay();

            this.showSuccessNotification(`Profile '${profileId}' loaded successfully.`);

        } catch (error) {
            console.error('Error loading profile:', error);
            this.showErrorNotification(`Failed to load profile '${profileId}'. The profile data may be corrupted.`);
        }
    }

    switchProfile(profileId) {
        if (profileId === this.currentProfile) return;

        // Save current profile before switching
        this.saveCurrentProfile();

        // Switch to new profile
        this.currentProfile = profileId;
        this.loadProfile(profileId);

        // Update UI
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();

        this.showMessage(`Switched to profile: ${this.profiles[profileId].name}`, 'success');
    }

    createProfile() {
        const name = this.newProfileNameInput.value.trim();
        if (!name) {
            this.showMessage('Please enter a profile name', 'error');
            return;
        }

        const profileId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (this.profiles[profileId]) {
            this.showMessage('Profile with this name already exists', 'error');
            return;
        }

        // Save current profile first
        this.saveCurrentProfile();

        // Get selected profile type
        const profileType = this.profileTypeSelect.value;

        // Create new profile
        this.profiles[profileId] = {
            name: name,
            profileType: profileType,
            selectedDays: [],
            selectionHistory: [],
            blockedDates: [],
            avoidHolidays: true,
            monthDisplayCount: 9,
            monthlySelectedDays: [],
            monthlySelectionEnabled: false,
            quarterlyToMonthlyMapping: [],
            created: new Date().toISOString()
        };

        this.saveProfiles();
        this.updateProfileSelector();

        // Switch to new profile
        this.profileSelect.value = profileId;
        this.switchProfile(profileId);

        this.newProfileNameInput.value = '';
        this.showMessage(`Created profile: ${name}`, 'success');
    }

    deleteProfile() {
        if (this.currentProfile === 'default') {
            this.showMessage('Cannot delete the default profile', 'error');
            return;
        }

        const profileName = this.profiles[this.currentProfile].name;

        if (!confirm(`Are you sure you want to delete profile "${profileName}"? This action cannot be undone.`)) {
            return;
        }

        delete this.profiles[this.currentProfile];
        this.saveProfiles();

        // Switch to default profile
        this.currentProfile = 'default';
        this.profileSelect.value = 'default';
        this.loadProfile('default');
        this.updateProfileSelector();

        // Update UI
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();

        this.showMessage(`Deleted profile: ${profileName}`, 'success');
    }

    exportProfile() {
        const profile = {
            ...this.profiles[this.currentProfile],
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(profile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `calendar-profile-${profile.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        link.click();

        this.showMessage(`Exported profile: ${profile.name}`, 'success');
    }

    importProfile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const profile = JSON.parse(e.target.result);

                if (!profile.name) {
                    this.showMessage('Invalid profile file: missing name', 'error');
                    return;
                }

                const profileId = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                let finalName = profile.name;
                let finalId = profileId;
                let counter = 1;

                // Handle name conflicts
                while (this.profiles[finalId]) {
                    finalName = `${profile.name} (${counter})`;
                    finalId = finalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    counter++;
                }

                // Save current profile first
                this.saveCurrentProfile();

                // Import profile
                this.profiles[finalId] = {
                    name: finalName,
                    selectedDays: profile.selectedDays || [],
                    selectionHistory: profile.selectionHistory || [],
                    blockedDates: profile.blockedDates || [],
                    avoidHolidays: profile.avoidHolidays !== undefined ? profile.avoidHolidays : true,
                    monthDisplayCount: profile.monthDisplayCount || 9,
                    monthlySelectedDays: profile.monthlySelectedDays || [],
                    monthlySelectionEnabled: profile.monthlySelectionEnabled || false,
                    quarterlyToMonthlyMapping: profile.quarterlyToMonthlyMapping || [],
                    created: profile.created || new Date().toISOString(),
                    imported: new Date().toISOString()
                };

                this.saveProfiles();
                this.updateProfileSelector();

                // Switch to imported profile
                this.profileSelect.value = finalId;
                this.switchProfile(finalId);

                this.showMessage(`Imported profile: ${finalName}`, 'success');

            } catch (error) {
                console.error('Import error:', error);
                this.showMessage('Error importing profile: Invalid file format', 'error');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    // Data export/import methods
    exportAllData() {
        const allData = {
            // Current calendar state
            selectedDays: Array.from(this.selectedDays),
            monthlySelectedDays: Array.from(this.monthlySelectedDays),
            selectionHistory: this.selectionHistory,
            blockedDates: Array.from(this.blockedDates),
            quarterlyToMonthlyMapping: Array.from(this.quarterlyToMonthlyMapping.entries()),

            // Settings
            monthlySelectionEnabled: this.monthlySelectionEnabled,
            currentSelectionMode: this.currentSelectionMode,
            avoidHolidays: this.avoidHolidays,
            monthDisplayCount: this.monthDisplayCount,
            currentProfile: this.currentProfile,

            // All profiles
            profiles: this.profiles,

            // Export metadata
            exportedAt: new Date().toISOString(),
            version: '2.0',
            type: 'complete_backup'
        };

        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        link.download = `calendar-backup-${timestamp}.json`;
        link.click();

        console.log('All calendar data exported successfully');
    }

    importAllData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.type || data.type !== 'complete_backup') {
                    console.error('Invalid backup file: not a complete backup');
                    return;
                }

                // Confirm with user before importing
                if (!confirm('This will replace all your current data with the imported data. Are you sure you want to continue?')) {
                    return;
                }

                // Import all data
                this.selectedDays = new Set(data.selectedDays || []);
                this.monthlySelectedDays = new Set(data.monthlySelectedDays || []);
                this.selectionHistory = data.selectionHistory || [];
                this.blockedDates = new Set(data.blockedDates || []);
                this.quarterlyToMonthlyMapping = new Map(data.quarterlyToMonthlyMapping || []);

                // Import settings
                this.monthlySelectionEnabled = data.monthlySelectionEnabled || false;
                this.currentSelectionMode = data.currentSelectionMode || 'quarterly';
                this.avoidHolidays = data.avoidHolidays !== undefined ? data.avoidHolidays : true;
                this.monthDisplayCount = data.monthDisplayCount || 9;

                // Import profiles
                if (data.profiles) {
                    this.profiles = data.profiles;
                    this.saveProfiles();
                }

                // Set current profile
                if (data.currentProfile && this.profiles[data.currentProfile]) {
                    this.currentProfile = data.currentProfile;
                } else {
                    this.currentProfile = 'default';
                }

                // Update UI
                this.toggleMonthlySelection(this.monthlySelectionEnabled);
                this.setSelectionMode(this.currentSelectionMode);
                this.updateProfileSelector();
                this.profileSelect.value = this.currentProfile;

                // Update other UI elements
                if (this.avoidHolidaysCheckbox) {
                    this.avoidHolidaysCheckbox.checked = this.avoidHolidays;
                }
                if (this.monthDisplayCountSelect) {
                    this.monthDisplayCountSelect.value = this.monthDisplayCount;
                }

                // Update displays
                this.updateSelectedDaysDisplay();
                this.updateMonthlySelectedDaysDisplay();
                this.updateSelectionHistoryDisplay();
                this.updateBlockedDatesDisplay();
                this.calculateValidDays();
                this.renderCalendar();

                // Save the imported data to current profile
                this.saveCurrentProfile();

                console.log('All calendar data imported successfully');

            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing data: Invalid file format');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    clearAllDataConfirm() {
        if (confirm('This will permanently delete ALL your calendar data, including all profiles and selections. This cannot be undone. Are you sure?')) {
            this.clearAllDataPermanent();
        }
    }

    clearAllDataPermanent() {
        // Clear all calendar data
        this.selectedDays.clear();
        this.monthlySelectedDays.clear();
        this.selectionHistory = [];
        this.blockedDates.clear();
        this.quarterlyToMonthlyMapping.clear();

        // Reset settings to defaults
        this.monthlySelectionEnabled = false;
        this.currentSelectionMode = 'quarterly';
        this.avoidHolidays = true;
        this.monthDisplayCount = 9;

        // Clear all profiles except default
        this.profiles = {
            default: {
                name: 'Default Profile',
                selectedDays: [],
                selectionHistory: [],
                blockedDates: [],
                avoidHolidays: true,
                monthDisplayCount: 9,
                monthlySelectedDays: [],
                monthlySelectionEnabled: false,
                quarterlyToMonthlyMapping: [],
                created: new Date().toISOString()
            }
        };

        this.currentProfile = 'default';
        this.saveProfiles();

        // Update UI
        this.toggleMonthlySelection(false);
        this.setSelectionMode('quarterly');
        this.updateProfileSelector();
        this.profileSelect.value = 'default';

        // Update displays
        this.updateSelectedDaysDisplay();
        this.updateMonthlySelectedDaysDisplay();
        this.updateSelectionHistoryDisplay();
        this.updateBlockedDatesDisplay();
        this.calculateValidDays();
        this.renderCalendar();

        console.log('All calendar data cleared');
    }

    updateProfileSelector() {
        const currentValue = this.profileSelect.value;
        this.profileSelect.innerHTML = '';

        Object.entries(this.profiles).forEach(([id, profile]) => {
            const option = document.createElement('option');
            option.value = id;
            const profileTypeLabel = profile.profileType === 'monthly' ? ' (Monthly)' : ' (Quarterly)';
            option.textContent = profile.name + profileTypeLabel;
            this.profileSelect.appendChild(option);
        });

        // Restore selection or default to current profile
        this.profileSelect.value = this.profiles[currentValue] ? currentValue : this.currentProfile;

        // Update delete button state
        this.deleteProfileBtn.disabled = this.currentProfile === 'default';
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `profile-message ${type}`;
        messageEl.textContent = message;

        // Add to profile section
        const profileSection = document.querySelector('.profile-section');
        profileSection.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // Override existing methods to save profile data
    clearSelectionHistory() {
        this.selectionHistory = [];
        this.selectedDays.clear();
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();
        this.saveCurrentProfile();
    }

    clearAllSelected() {
        this.selectedDays.clear();
        this.selectionHistory = [];
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();
        this.saveCurrentProfile();
    }

    clearBlockedDates() {
        this.blockedDates.clear();
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
        this.saveCurrentProfile();
    }

    toggleHolidayAvoidance(avoid) {
        this.avoidHolidays = avoid;
        this.calculateValidDays();
        this.renderCalendar();
        this.saveCurrentProfile();
    }

    addBlockedDate() {
        const dateValue = this.blockDateInput.value;
        if (!dateValue) return;

        const date = new Date(dateValue + 'T00:00:00');
        const dateString = date.toDateString();

        this.blockedDates.add(dateString);
        this.blockDateInput.value = '';

        // Remove from selected days if it was selected
        if (this.selectedDays.has(dateString)) {
            this.selectedDays.delete(dateString);
            this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        }

        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
        this.updateSelectedDaysDisplay();
        this.updateSelectionHistoryDisplay();
        this.saveCurrentProfile();
    }

    removeBlockedDate(dateString) {
        this.blockedDates.delete(dateString);
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
        this.saveCurrentProfile();
    }

    removeSelectedDay(dateString) {
        this.selectedDays.delete(dateString);
        this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();
        this.saveCurrentProfile();
    }

    // Selection mode management
    setSelectionMode(mode) {
        if (!this.monthlySelectionEnabled) {
            // If monthly selection is not enabled, always use quarterly mode
            mode = 'quarterly';
        }

        this.currentSelectionMode = mode;

        // Update button states
        if (this.quarterlyModeBtnEl && this.monthlyModeBtnEl) {
            if (mode === 'quarterly') {
                this.quarterlyModeBtnEl.classList.add('active');
                this.monthlyModeBtnEl.classList.remove('active');
            } else {
                this.quarterlyModeBtnEl.classList.remove('active');
                this.monthlyModeBtnEl.classList.add('active');
            }
        }

        // Update calendar to show appropriate valid days
        this.calculateValidDays();
        this.renderCalendar();

        // Update rules display
        this.updateRulesDisplay();
    }

    // Monthly selection methods
    toggleMonthlySelection(enabled) {
        this.monthlySelectionEnabled = enabled;

        // Update both original and floating checkboxes
        if (this.enableMonthlyCheckbox) {
            this.enableMonthlyCheckbox.checked = enabled;
        }
        if (this.floatingCheckbox) {
            this.floatingCheckbox.checked = enabled;
        }

        // Update floating toggle status
        this.updateFloatingStatus(enabled);

        // Show/hide monthly selection UI controls
        if (enabled) {
            if (this.selectionModeControlsEl) this.selectionModeControlsEl.style.display = 'block';
            if (this.monthlySelectionsSectionEl) this.monthlySelectionsSectionEl.style.display = 'block';

            // Set default mode to monthly when enabling monthly selection
            this.setSelectionMode('monthly');

            // Convert existing quarterly selections to monthly mapping
            this.convertQuarterlyToMonthly();

            // Validate monthly selection integrity when enabling
            this.validateMonthlySelectionIntegrity();
            this.handleMonthlySelectionEdgeCases();

            // Show success notification
            this.showSuccessNotification('Monthly selection mode enabled. You can now make additional selections within quarters that have quarterly selections.');
        } else {
            if (this.selectionModeControlsEl) this.selectionModeControlsEl.style.display = 'none';
            if (this.monthlySelectionsSectionEl) this.monthlySelectionsSectionEl.style.display = 'none';

            // Reset to quarterly mode when disabling monthly selection
            this.setSelectionMode('quarterly');

            // Keep monthly-specific data when disabling (no longer clear it)
            // this.monthlySelectedDays.clear(); // REMOVED - preserve data
            // this.quarterlyToMonthlyMapping.clear(); // REMOVED - preserve data
        }

        // Update rules display to show appropriate rules
        this.updateRulesDisplay();

        // Update monthly selection display
        this.updateMonthlySelectedDaysDisplay();

        // Recalculate valid days and re-render calendar
        this.calculateValidDays();
        this.renderCalendar();
    }

    clearAllMonthlySelected() {
        // Clear only the pure monthly selections (not quarterly ones)
        this.monthlySelectedDays.clear();

        // Update the display
        this.updateMonthlySelectedDaysDisplay();

        // Recalculate valid days and re-render calendar
        this.calculateValidDays();
        this.renderCalendar();

        // Save profile after clearing
        this.saveCurrentProfile();
    }

    removeMonthlySelection(dateString) {
        this.monthlySelectedDays.delete(dateString);
        this.updateMonthlySelectedDaysDisplay();
        this.calculateValidDays();
        this.renderCalendar();
        this.saveCurrentProfile();
    }

    updateMonthlySelectedDaysDisplay() {
        if (!this.monthlySelectionEnabled) {
            return;
        }

        this.monthlySelectedDaysEl.innerHTML = '';

        // Get all monthly selections (quarterly + pure monthly)
        const allMonthlySelections = this.getAllMonthlySelections();
        const sortedSelections = Array.from(allMonthlySelections).sort((a, b) => new Date(a) - new Date(b));

        if (sortedSelections.length === 0) {
            this.monthlySelectedDaysEl.innerHTML = '<em>No monthly selections</em>';
            return;
        }

        sortedSelections.forEach(dateString => {
            const tag = document.createElement('div');
            tag.className = 'selected-day-tag monthly-tag';

            const dateSpan = document.createElement('span');
            dateSpan.textContent = new Date(dateString).toLocaleDateString();

            // Determine the type of selection
            const isQuarterlySelection = this.selectedDays.has(dateString);
            const isPureMonthlySelection = this.monthlySelectedDays.has(dateString);

            if (isQuarterlySelection && !isPureMonthlySelection) {
                // This is a quarterly selection being shown in monthly view
                tag.className = 'selected-day-tag quarterly-tag';
                const typeIndicator = document.createElement('span');
                typeIndicator.className = 'selection-type-indicator quarterly';
                typeIndicator.textContent = '(Q)';
                typeIndicator.title = 'Quarterly selection - remove from quarterly section';
                tag.appendChild(dateSpan);
                tag.appendChild(typeIndicator);
            } else if (isPureMonthlySelection) {
                // This is a pure monthly selection
                tag.className = 'selected-day-tag monthly-tag';
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-selected';
                removeBtn.innerHTML = '×';
                removeBtn.title = 'Remove this monthly selection';
                removeBtn.onclick = () => this.removeMonthlySelection(dateString);

                const typeIndicator = document.createElement('span');
                typeIndicator.className = 'selection-type-indicator monthly';
                typeIndicator.textContent = '(M)';
                typeIndicator.title = 'Monthly selection';

                tag.appendChild(dateSpan);
                tag.appendChild(typeIndicator);
                tag.appendChild(removeBtn);
            }

            this.monthlySelectedDaysEl.appendChild(tag);
        });
    }

    // Helper methods for quarterly-monthly relationship management
    convertQuarterlyToMonthly() {
        // Clear existing mapping
        this.quarterlyToMonthlyMapping.clear();

        // Map each quarterly selection to its quarter for dependency tracking
        this.selectedDays.forEach(dateString => {
            const date = new Date(dateString);
            const metadata = this.getDateMetadata(date);
            const quarterKey = `${metadata.year}-Q${metadata.quarter}`;
            this.quarterlyToMonthlyMapping.set(dateString, quarterKey);
        });
    }

    getAllMonthlySelections() {
        // Return all selections that should be treated as monthly
        // This includes both quarterly selections (when monthly mode is enabled) and pure monthly selections
        const allSelections = new Set();

        if (this.monthlySelectionEnabled) {
            // Add quarterly selections (they count as monthly when monthly mode is enabled)
            this.selectedDays.forEach(dateString => allSelections.add(dateString));
        }

        // Add pure monthly selections
        this.monthlySelectedDays.forEach(dateString => allSelections.add(dateString));

        return allSelections;
    }

    getMonthlySelectionsForQuarter(quarter, year) {
        // Get all monthly selections (quarterly + pure monthly) for a specific quarter
        const quarterSelections = new Set();

        this.getAllMonthlySelections().forEach(dateString => {
            const date = new Date(dateString);
            const metadata = this.getDateMetadata(date);

            if (metadata.year === year && metadata.quarter === quarter) {
                quarterSelections.add(dateString);
            }
        });

        return quarterSelections;
    }

    hasQuarterlySelectionForQuarter(quarter, year) {
        // Check if there's a quarterly selection for the given quarter
        return this.selectionHistory.some(selection =>
            selection.year === year && selection.quarter === quarter
        );
    }

    getQuarterEligibilityInfo(quarter, year) {
        // Get detailed information about quarter eligibility for monthly selections
        const hasQuarterly = this.hasQuarterlySelectionForQuarter(quarter, year);
        const monthlyCount = this.getMonthlySelectionsForQuarter(quarter, year).length;

        return {
            hasQuarterly,
            monthlyCount,
            isEligible: hasQuarterly,
            status: hasQuarterly ? 'eligible' : 'requires-quarterly'
        };
    }

    removeMonthlySelection(dateString) {
        // Remove a pure monthly selection (not quarterly)
        this.monthlySelectedDays.delete(dateString);

        // Update display
        this.updateMonthlySelectedDaysDisplay();

        // Recalculate valid days and re-render calendar
        this.calculateValidDays();
        this.renderCalendar();
    }

    showInvalidSelectionFeedback(dayEl, message, errorType = 'general') {
        // Notifications disabled - just log to console
        console.log(`[INVALID SELECTION] ${message}`);
        return;

        // Add visual feedback class
        dayEl.classList.add('invalid-attempt');

        // Set tooltip message
        const originalTitle = dayEl.title;
        dayEl.title = message;

        // Show error notification
        this.showErrorNotification(message, errorType);

        // Remove feedback after a short delay
        setTimeout(() => {
            dayEl.classList.remove('invalid-attempt');
            dayEl.title = originalTitle;
        }, 2000);

        // Add appropriate animation based on error type
        if (errorType === 'prerequisite') {
            dayEl.style.animation = 'shake 0.5s ease-in-out';
        } else if (errorType === 'validation') {
            dayEl.style.animation = 'invalidPulse 0.6s ease-in-out';
        } else {
            dayEl.style.animation = 'shake 0.5s ease-in-out';
        }

        setTimeout(() => {
            dayEl.style.animation = '';
        }, 600);
    }

    showErrorNotification(message, type = 'error') {
        // Notifications disabled - just log to console
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;

        // Create or get notification container
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        // Add icon based on type
        const icon = type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add to container
        notificationContainer.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Add slide-in animation
        notification.style.animation = 'slideInRight 0.3s ease-out';
    }

    showSuccessNotification(message) {
        // Notifications disabled
        // this.showErrorNotification(message, 'success');
    }

    showWarningNotification(message) {
        // Notifications disabled
        // this.showErrorNotification(message, 'warning');
    }

    handleMonthlySelectionEdgeCases() {
        try {
            // Edge case 1: Check for orphaned monthly selections (monthly selections without quarterly in same quarter)
            const orphanedSelections = [];
            this.monthlySelectedDays.forEach(dateString => {
                const date = new Date(dateString);
                const metadata = this.getDateMetadata(date);
                if (!this.hasQuarterlySelectionForQuarter(metadata.quarter, metadata.year)) {
                    orphanedSelections.push(dateString);
                }
            });

            if (orphanedSelections.length > 0) {
                console.warn('Found orphaned monthly selections:', orphanedSelections);
                // Clean up orphaned selections
                orphanedSelections.forEach(dateString => {
                    this.monthlySelectedDays.delete(dateString);
                });
                this.showWarningNotification(`Cleaned up ${orphanedSelections.length} orphaned monthly selection(s) that had no corresponding quarterly selection.`);
                this.updateMonthlySelectedDaysDisplay();
            }

            // Edge case 2: Check for duplicate selections (same date in both quarterly and monthly sets)
            const duplicates = [];
            this.selectedDays.forEach(dateString => {
                if (this.monthlySelectedDays.has(dateString)) {
                    duplicates.push(dateString);
                }
            });

            if (duplicates.length > 0) {
                console.warn('Found duplicate selections:', duplicates);
                // Remove from monthly set (quarterly takes precedence)
                duplicates.forEach(dateString => {
                    this.monthlySelectedDays.delete(dateString);
                });
                this.showWarningNotification(`Cleaned up ${duplicates.length} duplicate selection(s). Quarterly selections take precedence.`);
                this.updateMonthlySelectedDaysDisplay();
            }

            // Edge case 3: Validate monthly selection limits per quarter
            const quarterCounts = new Map();
            this.getAllMonthlySelections().forEach(dateString => {
                const date = new Date(dateString);
                const metadata = this.getDateMetadata(date);
                const quarterKey = `${metadata.year}-Q${metadata.quarter}`;
                quarterCounts.set(quarterKey, (quarterCounts.get(quarterKey) || 0) + 1);
            });

            quarterCounts.forEach((count, quarterKey) => {
                if (count > 3) { // Maximum 3 monthly selections per quarter (1 quarterly + 2 additional monthly)
                    console.warn(`Quarter ${quarterKey} has ${count} monthly selections, which exceeds the recommended limit`);
                    this.showWarningNotification(`Quarter ${quarterKey} has ${count} selections. Consider reviewing your selection pattern.`);
                }
            });

        } catch (error) {
            console.error('Error in handleMonthlySelectionEdgeCases:', error);
            this.showErrorNotification('An error occurred while validating monthly selections. Please refresh and try again.');
        }
    }

    validateMonthlySelectionIntegrity() {
        try {
            // Comprehensive validation of monthly selection data integrity
            let issuesFound = 0;

            // Check 1: Ensure all monthly selections have valid dates
            const invalidDates = [];
            this.monthlySelectedDays.forEach(dateString => {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    invalidDates.push(dateString);
                    issuesFound++;
                }
            });

            if (invalidDates.length > 0) {
                invalidDates.forEach(dateString => {
                    this.monthlySelectedDays.delete(dateString);
                });
                this.showWarningNotification(`Removed ${invalidDates.length} invalid date(s) from monthly selections.`);
            }

            // Check 2: Ensure monthly selections follow business rules
            const violations = [];
            this.monthlySelectedDays.forEach(dateString => {
                const date = new Date(dateString);
                const metadata = this.getDateMetadata(date);

                // Check if it's a weekend
                if (metadata.dayOfWeek === 0 || metadata.dayOfWeek === 6) {
                    violations.push({ dateString, reason: 'Weekend day' });
                    issuesFound++;
                }

                // Check if it's a holiday (if holiday avoidance is enabled)
                if (this.avoidHolidays && this.isUSHoliday(date)) {
                    violations.push({ dateString, reason: 'US Federal Holiday' });
                    issuesFound++;
                }

                // Check if it's manually blocked
                if (this.blockedDates.has(dateString)) {
                    violations.push({ dateString, reason: 'Manually blocked date' });
                    issuesFound++;
                }
            });

            if (violations.length > 0) {
                violations.forEach(violation => {
                    this.monthlySelectedDays.delete(violation.dateString);
                });
                this.showWarningNotification(`Removed ${violations.length} monthly selection(s) that violated business rules.`);
                this.updateMonthlySelectedDaysDisplay();
            }

            // Check 3: Validate quarterly-monthly mapping consistency
            const mappingIssues = [];
            this.quarterlyToMonthlyMapping.forEach((quarterInfo, dateString) => {
                if (!this.selectedDays.has(dateString)) {
                    mappingIssues.push(dateString);
                    issuesFound++;
                }
            });

            if (mappingIssues.length > 0) {
                mappingIssues.forEach(dateString => {
                    this.quarterlyToMonthlyMapping.delete(dateString);
                });
                this.showWarningNotification(`Cleaned up ${mappingIssues.length} inconsistent quarterly-monthly mapping(s).`);
            }

            if (issuesFound === 0) {
                console.log('Monthly selection integrity validation passed');
            } else {
                console.log(`Monthly selection integrity validation found and fixed ${issuesFound} issue(s)`);
            }

            return issuesFound === 0;

        } catch (error) {
            console.error('Error in validateMonthlySelectionIntegrity:', error);
            this.showErrorNotification('An error occurred during monthly selection validation. Please refresh and try again.');
            return false;
        }
    }

    updateRulesDisplay() {
        // Ensure elements exist before updating
        if (!this.rulesTitleEl || !this.rulesDisplayEl) {
            console.warn('Rules display elements not found');
            return;
        }

        // Synchronize checkbox state with internal state
        if (this.enableMonthlyCheckbox) {
            this.enableMonthlyCheckbox.checked = this.monthlySelectionEnabled;
        }

        if (this.monthlySelectionEnabled) {
            const currentModeText = this.currentSelectionMode === 'monthly' ? 'Monthly Selection Mode (Default)' : 'Quarterly Selection Mode';
            this.rulesTitleEl.textContent = `Monthly + Quarterly Selection Rules - ${currentModeText}`;
            this.rulesDisplayEl.innerHTML = `
                <div style="background: ${this.currentSelectionMode === 'monthly' ? '#fff3cd' : '#d1ecf1'}; padding: 10px; border-radius: 4px; margin-bottom: 10px; border-left: 4px solid ${this.currentSelectionMode === 'monthly' ? '#fd7e14' : '#007bff'};">
                    <strong>Current Mode: ${this.currentSelectionMode === 'monthly' ? '🟠 Monthly Selection' : '🔵 Quarterly Selection'}</strong><br>
                    <small>${this.currentSelectionMode === 'monthly' ? 'Selections will be recorded as monthly selections' : 'Selections will be recorded as quarterly selections'}</small>
                </div>
                <ul>
                    <li><strong>Quarterly Rules:</strong>
                        <ul>
                            <li>Once per quarter maximum</li>
                            <li>Enables monthly selections for that quarter</li>
                        </ul>
                    </li>
                    <li><strong>Monthly Rules:</strong>
                        <ul>
                            <li>Only allowed in quarters with existing quarterly selections</li>
                            <li>Once per month maximum (quarterly selection counts as monthly)</li>
                            <li>Quarterly selections are automatically treated as monthly selections</li>
                            <li>No more than 2 consecutive monthly selections for (within current + previous 2 quarters):
                                <ul>
                                    <li>Day period (1st 10 days, 2nd 10 days, or 3rd 10 days)</li>
                                    <li>Day of week (Monday through Friday)</li>
                                    <li>Month of quarter (1st, 2nd, or 3rd month)</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li><strong>General Rules:</strong>
                        <ul>
                            <li>Only weekdays (Monday-Friday)</li>
                            <li>Avoid holidays (if enabled)</li>
                            <li>No more than 2 consecutive selections for (within current + previous 2 quarters):
                                <ul>
                                    <li>Month of quarter (1st, 2nd, or 3rd month)</li>
                                    <li>Day period (1st 10 days, 2nd 10 days, or 3rd 10 days)</li>
                                    <li>Day of week</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            `;
        } else {
            this.rulesTitleEl.textContent = 'Quarterly Selection Rules';
            this.rulesDisplayEl.innerHTML = `
                <ul>
                    <li><strong>Selection Rules:</strong>
                        <ul>
                            <li>Once per quarter maximum</li>
                            <li>Only weekdays (Monday-Friday)</li>
                            <li>Avoid holidays (if enabled)</li>
                        </ul>
                    </li>
                    <li><strong>Pattern Rules:</strong>
                        <ul>
                            <li>No more than 2 consecutive selections for (within current + previous 2 quarters):
                                <ul>
                                    <li>Month of quarter (1st, 2nd, or 3rd month)</li>
                                    <li>Day period (1st 10 days, 2nd 10 days, or 3rd 10 days)</li>
                                    <li>Day of week (Monday through Friday)</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            `;
        }
    }
}

// Initialize the calendar when the page loads
let calendar;
document.addEventListener('DOMContentLoaded', () => {
    calendar = new QuarterlyRuleCalendar();
});