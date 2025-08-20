# Quarterly Rule-Based Calendar App

A specialized web calendar application that enforces strict quarterly selection rules with consecutive pattern restrictions.

## Features

- Interactive calendar interface with quarterly rule enforcement
- Real-time validation of date selections
- Selection history tracking with metadata
- Visual indication of valid/invalid days
- Automatic rule compliance checking
- Month navigation

## Hardcoded Rules

### Rule 1: Quarterly Limit
- **Maximum once per quarter**: Only one selection allowed per quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)

### Rule 2: Consecutive Pattern Restrictions
No more than **2 consecutive selections** for any of these attributes:

1. **Month of Quarter**: 1st, 2nd, or 3rd month within the quarter
2. **Day Period**: 1st 10 days (1-10), 2nd 10 days (11-20), or 3rd 10 days (21-31)
3. **Day of Week**: Monday, Tuesday, Wednesday, Thursday, Friday only (weekends excluded)

## How It Works

The system tracks your selection history and analyzes patterns to prevent violations:

- **Quarterly Tracking**: Monitors selections per quarter across years
- **Pattern Analysis**: Checks for consecutive patterns in month position, day period, and weekday
- **Real-time Validation**: Updates valid days immediately after each selection
- **Visual Feedback**: Green days are valid, red days violate rules

## Usage

1. Open `index.html` in your web browser
2. Navigate through months using the arrow buttons
3. Click on green (valid) days to select them
4. View your selection history in the bottom panel
5. Use "Clear History" to reset all selections
6. Use "Generate Valid Days" to refresh the calendar

## Selection Metadata

Each selection tracks:
- **Date**: Full date information
- **Quarter**: Q1, Q2, Q3, or Q4
- **Month of Quarter**: 1st, 2nd, or 3rd month in quarter
- **Day Period**: 1st (1-10), 2nd (11-20), or 3rd (21-31) ten-day period
- **Day of Week**: Monday through Friday only

## Example Scenarios

**Valid Pattern:**
- Q1 2024: January 15 (Monday, 2nd period, 1st month)
- Q2 2024: May 8 (Wednesday, 1st period, 2nd month)
- Q3 2024: September 22 (Friday, 3rd period, 3rd month)

**Invalid Pattern (would be blocked):**
- Q1 2024: January 15 (1st month of quarter)
- Q2 2024: April 10 (1st month of quarter) 
- Q3 2024: July 5 (1st month of quarter) ← **Blocked: 3 consecutive "1st month" selections**

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - Calendar logic and rule processing
- `README.md` - Documentation

## Browser Compatibility

Works in all modern browsers that support ES6+ features.