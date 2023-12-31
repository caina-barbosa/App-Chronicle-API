import { google } from 'googleapis';

const sheets = google.sheets('v4');
const SPREADSHEET_ID = '1A99BZ7G8YoUp866ueBvWisEHipzg6VBzhTLLv-q_rws';
const SHEET_NAME = "AppChronicle API Lookup";
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

// Authenticate and set up the Google Sheets API client.
const auth = new google.auth.JWT(
    CLIENT_EMAIL,
    null,
    PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
);

const updateCourseNameInSheet = async (rowIndex, newCourseName) => {
    try {
        console.log(newCourseName, rowIndex)
        await sheets.spreadsheets.values.update({
            auth,
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!G${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[newCourseName]]
            }
        });
    } catch (error) {
        console.error('Error updating Google Sheets:', error);
        throw error;
    }
};

export const findRowInSheet = async (Name, Subject, CourseName, AppName) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:I`, 
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return null;
        }

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const isPerfectMatch = (
                row[1] === Name &&
                row[5] === Subject &&
                row[6] === CourseName &&
                row[7] === AppName
            );
            const isPartialMatch = (
                row[1] === Name &&
                row[5] === Subject &&
                row[7] === AppName
            );
    
            if (isPerfectMatch) {
                const formattedRow = {
                    'Student & Campus ID': row[0],
                    'Name': row[1],
                    'LVL': row[2],
                    'Username': row[3],
                    'Subject': row[5],
                    'Course Name': row[6],
                    'App Name': row[7],
                    'Start': row[8],
                    'WasRosterAdjusted': 0
                };
                return formattedRow;
            } else if (isPartialMatch) {
                await updateCourseNameInSheet(i, CourseName);
                row[6] = CourseName;  
    
                const formattedRow = {
                    'Student & Campus ID': row[0],
                    'Name': row[1],
                    'LVL': row[2],
                    'Username': row[3],
                    'Subject': row[5],
                    'Course Name': row[6],
                    'App Name': row[7],
                    'Start': row[8],
                    'WasRosterAdjusted': 1
                };
                return formattedRow;
            }
        }
    
        return null;
    } catch (error) {
        console.error('Error accessing Google Sheets:', error);
        throw error;
    }
};
