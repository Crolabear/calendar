class QuarterlyRuleCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDays = new Set();
        this.selectionHistory = []; // Array of selected dates with metadata
        this.validDays = new Set();
        this.blockedDates = new Set(); // Manually blocked dates
        this.avoidHolidays = true; // Avoid US holidays by default
        
        // Profile management
        this.currentProfile = 'default';
        this.profiles = this.loadProfiles();
        this.monthlySelectionEnabled = false; // Monthly selection toggle

        this.initializeElements();
        this.bindEvents();
        this.loadProfile(this.currentProfile);
        this.updateProfileSelector();
        this.calculateValidDays();
        this.renderCalendar();
        this.updateBlockedDatesDisplay();
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
        this.prevPeriodBtn.addEventListener('click', () => this.changePeriod(-6));
        this.nextPeriodBtn.addEventListener('click', () => this.changePeriod(6));
        this.clearSelectedBtn.addEventListener('click', () => this.clearAllSelected());
        this.clearMonthlySelectedBtn.addEventListener('click', () => this.clearAllMonthlySelected());
        this.enableMonthlyCheckbox.addEventListener('change', (e) => this.toggleMonthlySelection(e.target.checked));
        
        // Profile event listeners
        this.profileSelect.addEventListener('change', (e) => this.switchProfile(e.target.value));
        this.createProfileBtn.addEventListener('click', () => this.createProfile());
        this.deleteProfileBtn.addEventListener('click', () => this.deleteProfile());
        this.exportProfileBtn.addEventListener('click', () => this.exportProfile());
        this.importProfileBtn.addEventListener('click', () => this.importProfileInput.click());
        this.importProfileInput.addEventListener('change', (e) => this.importProfile(e));
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
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();
    }

    removeSelectedDay(dateString) {
        this.selectedDays.delete(dateString);
        this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectionHistoryDisplay();
        this.updateSelectedDaysDisplay();
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
            monthOfQuarter: this.getMonthOfQuarter(date),
            dayPeriod: this.getDayPeriod(date),
            dayOfWeek: date.getDay(),
            dateString: date.toDateString()
        };
    }

    hasConsecutiveViolation(newSelection, attribute) {
        // Sort history by date
        const sortedHistory = [...this.selectionHistory].sort((a, b) => a.date - b.date);

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

        // Apply rules based on profile type
        if (this.currentProfileType === 'monthly') {
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
        // Monthly rules: Once per month + quarterly rules
        
        // Rule 2a: Once per month
        const monthSelections = this.selectionHistory.filter(s =>
            s.year === metadata.year && s.date.getMonth() === metadata.date.getMonth()
        );
        if (monthSelections.length >= 1) {
            return false;
        }

        // Rule 2b: Once per quarter (still applies)
        /*
        const quarterSelections = this.selectionHistory.filter(s =>
            s.year === metadata.year && s.quarter === metadata.quarter
        );
        if (quarterSelections.length >= 1) {
            return false;
        }
        */

        // Rule 3: No more than 2 consecutive for dayPeriod (monthly context)
        if (this.hasConsecutiveViolationMonthly(metadata, 'dayPeriod')) {
            return false;
        }

        // Rule 4: No more than 2 consecutive for dayOfWeek (monthly context)
        
        if (this.hasConsecutiveViolationMonthly(metadata, 'dayOfWeek')) {
            return false;
        }

        /*

        // Rule 5: Monthly selection must occur on same day as quarterly selection
        if (!this.isValidMonthlyDayAlignment(metadata)) {
            return false;
        }
        */

        // Apply quarterly rules as well
        // Rule 6: No more than 2 consecutive for monthOfQuarter
        /*
        if (this.hasConsecutiveViolation(metadata, 'monthOfQuarter')) {
            return false;
        }
        */

        return true;
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

    calculateValidDays() {
        this.validDays.clear();

        const startYear = this.currentDate.getFullYear();
        const startMonth = this.currentDate.getMonth();

        // Calculate valid days for 6 months starting from current date
        for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
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

        // Update period header to show the 6-month range
        const startDate = new Date(startYear, startMonth, 1);
        const endDate = new Date(startYear, startMonth + 5, 1);
        
        const startMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate);
        const endMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endDate);
        const startYearStr = startDate.getFullYear();
        const endYearStr = endDate.getFullYear();
        
        if (startYearStr === endYearStr) {
            this.currentPeriodEl.textContent = `${startMonthName} - ${endMonthName} ${startYearStr}`;
        } else {
            this.currentPeriodEl.textContent = `${startMonthName} ${startYearStr} - ${endMonthName} ${endYearStr}`;
        }

        // Clear calendar
        this.calendarEl.innerHTML = '';

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Create 6 month grids
        for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
            const currentDate = new Date(startYear, startMonth + monthOffset, 1);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-container';

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

                // Check if day is selected
                if (this.selectedDays.has(dateString)) {
                    dayEl.classList.add('selected');
                }

                // Add click handlers
                if (this.validDays.has(dateString)) {
                    dayEl.addEventListener('click', () => this.toggleDay(dateString, dayEl, date));
                } else if (this.selectedDays.has(dateString)) {
                    // Allow clicking on selected days to remove them even if they're no longer valid
                    dayEl.addEventListener('click', () => this.removeSelectedDay(dateString));
                    dayEl.style.cursor = 'pointer';
                    dayEl.title = 'Click to remove selection';
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
        if (this.selectedDays.has(dateString)) {
            // Remove selection
            this.selectedDays.delete(dateString);
            dayEl.classList.remove('selected');

            // Remove from history
            this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        } else {
            // Add selection
            this.selectedDays.add(dateString);
            dayEl.classList.add('selected');

            // Add to history with metadata
            const metadata = this.getDateMetadata(date);
            this.selectionHistory.push(metadata);
        }

        // Recalculate valid days after selection change
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectedDaysDisplay();
        this.updateSelectionHistoryDisplay();
    }

    updateSelectionHistoryDisplay() {
        if (this.selectionHistory.length === 0) {
            this.selectionHistoryEl.innerHTML = '<em>No selections made</em>';
            return;
        }

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
            lastModified: new Date().toISOString()
        };
        
        this.saveProfiles();
    }

    loadProfile(profileId) {
        const profile = this.profiles[profileId];
        if (!profile) return;

        this.selectedDays = new Set(profile.selectedDays || []);
        this.selectionHistory = (profile.selectionHistory || []).map(s => ({
            ...s,
            date: new Date(s.date)
        }));
        this.blockedDates = new Set(profile.blockedDates || []);
        this.avoidHolidays = profile.avoidHolidays !== undefined ? profile.avoidHolidays : true;
        this.currentProfileType = profile.profileType || 'quarterly';
        
        // Update UI elements
        this.avoidHolidaysCheckbox.checked = this.avoidHolidays;
        this.updateRulesDisplay();
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

    toggleDay(dateString, dayEl, date) {
        if (this.selectedDays.has(dateString)) {
            // Remove selection
            this.selectedDays.delete(dateString);
            dayEl.classList.remove('selected');

            // Remove from history
            this.selectionHistory = this.selectionHistory.filter(s => s.dateString !== dateString);
        } else {
            // Add selection
            this.selectedDays.add(dateString);
            dayEl.classList.add('selected');

            // Add to history with metadata
            const metadata = this.getDateMetadata(date);
            this.selectionHistory.push(metadata);
        }

        // Recalculate valid days after selection change
        this.calculateValidDays();
        this.renderCalendar();
        this.updateSelectedDaysDisplay();
        this.updateSelectionHistoryDisplay();
        this.saveCurrentProfile();
    }

    updateRulesDisplay() {
        const isMonthly = this.currentProfileType === 'monthly';
        
        if (isMonthly) {
            this.rulesTitleEl.textContent = 'Monthly + Quarterly Selection Rules';
            this.rulesDisplayEl.innerHTML = `
                <ul>
                    <li><strong>Rule 1:</strong> Once per month maximum</li>
                    <li><strong>Rule 2:</strong> Once per quarter maximum (quarterly selection)</li>
                    <li><strong>Rule 3:</strong> No more than 2 consecutive monthly selections for:
                        <ul>
                            <li>Day period (1st 10 days, 2nd 10 days, or 3rd 10 days)</li>
                            <li>Day of week (Monday through Friday only)</li>
                        </ul>
                    </li>
                    <li><strong>Rule 4:</strong> Monthly selection must occur on same day of week as quarterly selection</li>
                    <li><strong>Rule 5:</strong> No more than 2 consecutive quarterly selections for:
                        <ul>
                            <li>Month of quarter (1st, 2nd, or 3rd month)</li>
                        </ul>
                    </li>
                </ul>
            `;
        } else {
            this.rulesTitleEl.textContent = 'Quarterly Selection Rules';
            this.rulesDisplayEl.innerHTML = `
                <ul>
                    <li><strong>Rule 1:</strong> Once per quarter maximum</li>
                    <li><strong>Rule 2:</strong> No more than 2 consecutive selections for:
                        <ul>
                            <li>Month of quarter (1st, 2nd, or 3rd month)</li>
                            <li>Day period (1st 10 days, 2nd 10 days, or 3rd 10 days)</li>
                            <li>Day of week (Monday through Friday only)</li>
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