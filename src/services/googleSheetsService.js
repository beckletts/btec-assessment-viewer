// src/services/googleSheetsService.js

// Mock data for when the API is not available or fails
const MOCK_DATA = [
  // Sample RQF BTEC National
  {
    qualification: 'RQF BTEC National',
    sector: 'Business',
    componentCode: '31619H',
    componentName: 'Unit 2: Developing a Marketing Campaign',
    examType: 'Task',
    duration: '3 hours supervised assessment',
    access: 'Secure Dispatch',
    levelOfControl: 'High',
    additionalInfo: 'Externally assessed by Pearson. Released in January and May/June windows.',
    invigilator: 'External',
    qualificationSizes: 'National Certificate, National Extended Certificate, National Foundation Diploma, National Diploma, National Extended Diploma'
  },
  {
    qualification: 'RQF BTEC National',
    sector: 'Computing',
    componentCode: '31748H',
    componentName: 'Unit 1: Principles of Computer Science',
    examType: 'Exam',
    duration: '2 hours',
    access: 'Secure Dispatch',
    levelOfControl: 'High',
    additionalInfo: 'Written exam, mixture of short and extended response questions.',
    invigilator: 'External',
    qualificationSizes: 'National Certificate, National Extended Certificate, National Foundation Diploma, National Diploma, National Extended Diploma'
  },
  // Sample NQF BTEC First
  {
    qualification: 'NQF BTEC First',
    sector: 'Sport',
    componentCode: '21317E',
    componentName: 'Unit 1: Fitness for Sport and Exercise',
    examType: 'Exam',
    duration: '1 hour',
    access: 'Onscreen Test',
    levelOfControl: 'High',
    additionalInfo: 'Onscreen test with a range of question types',
    invigilator: 'External',
    qualificationSizes: ''
  },
  // Sample BTEC Technical
  {
    qualification: 'BTEC Technical',
    sector: 'Engineering',
    componentCode: '31161H',
    componentName: 'Unit 1: Exploring Engineering Sectors and Design Applications',
    examType: 'Task',
    duration: '5 hours supervised assessment',
    access: 'Secure Dispatch',
    levelOfControl: 'Medium',
    additionalInfo: 'Design-based task with supporting documentation',
    invigilator: 'Internal',
    qualificationSizes: ''
  },
  // Sample BTEC Tech Award 2022
  {
    qualification: 'BTEC Tech Award 2022',
    sector: 'Health and Social Care',
    componentCode: 'BTCHSC3',
    componentName: 'Component 3: Health and Wellbeing',
    examType: 'Task',
    duration: '3 hours supervised assessment',
    access: 'Secure Dispatch',
    levelOfControl: 'High',
    additionalInfo: 'Externally assessed task where students apply knowledge to a case study',
    invigilator: 'External',
    qualificationSizes: ''
  }
];

// Use environment variables for sensitive information
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || '1xGvTeBQ6XWUd8X5cm6PMWUyTEpGHvYR-s8HD3uuBSB4';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'AIzaSyAHNyezQ94cwJSeabAlVDe8J0L5x-mMOC8';

// Sheet ranges to fetch
const SHEET_RANGES = [
  'Nationals!A5:R500',  // Range for Nationals sheet
  'Firsts!A5:K500',     // Range for Firsts sheet
  'Technicals!A5:K500', // Range for Technicals sheet
  'Tech Award from 2022!A5:K500' // Range for Tech Awards sheet
];

/**
 * Fetches assessment data from Google Sheets
 * @returns {Promise<Array>} The assessment data
 */
export const fetchAssessmentData = async () => {
  try {
    // Try to load the Google Sheets API with a timeout
    const apiLoaded = await Promise.race([
      loadGoogleSheetsAPI(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('API load timeout')), 5000))
    ]).catch(error => {
      console.warn('Failed to load Google Sheets API, using mock data:', error);
      return false;
    });
    
    // If API fails to load, return mock data
    if (!apiLoaded) {
      console.log('Using mock data instead of API');
      return MOCK_DATA;
    }
    
    // Fetch data from all sheet ranges
    const allData = [];
    let fetchFailed = false;
    
    for (const range of SHEET_RANGES) {
      try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: range
        });
        
        const sheetName = range.split('!')[0];
        const values = response.result.values || [];
        
        if (values.length > 0) {
          const processedData = processSheetData(sheetName, values);
          allData.push(...processedData);
        }
      } catch (error) {
        console.error(`Error fetching data from ${range}:`, error);
        fetchFailed = true;
        break;
      }
    }
    
    // If any fetch fails, return mock data
    if (fetchFailed || allData.length === 0) {
      console.log('API fetch failed or returned no data, using mock data');
      return MOCK_DATA;
    }
    
    return allData;
  } catch (error) {
    console.error('Error in fetchAssessmentData:', error);
    console.log('Falling back to mock data');
    return MOCK_DATA;
  }
};

/**
 * Processes data from a specific sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} values - Sheet values
 * @returns {Array} Processed data
 */
function processSheetData(sheetName, values) {
  try {
    const processedData = [];
    
    // Get column indices based on headers
    const headerRow = values[0] || [];
    const indices = getColumnIndices(sheetName, headerRow);
    
    // Process each data row
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row.some(cell => cell)) {
        continue;
      }
      
      const assessment = createAssessmentObject(sheetName, row, indices);
      if (assessment) {
        processedData.push(assessment);
      }
    }
    
    return processedData;
  } catch (error) {
    console.error(`Error processing ${sheetName} sheet:`, error);
    return [];
  }
}

/**
 * Gets column indices for a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} headers - Header row
 * @returns {Object} Column indices
 */
function getColumnIndices(sheetName, headers) {
  const indices = {};
  
  if (sheetName === 'Nationals') {
    indices.qualification = headers.indexOf('Qualification');
    indices.sector = headers.indexOf('Sector');
    indices.componentCode = headers.indexOf('Component\r\nCode') !== -1 ? 
      headers.indexOf('Component\r\nCode') : headers.indexOf('Component Code');
    indices.componentName = headers.indexOf('Component Name');
    indices.examType = headers.indexOf('Exam/Task');
    indices.duration = headers.indexOf('Duration');
    indices.access = headers.indexOf('Access');
    indices.levelOfControl = headers.indexOf('Level of control');
    indices.additionalInfo = headers.indexOf('Additional information');
    indices.invigilator = headers.indexOf('Internal/External invigilator required');
    indices.qualificationSizes = headers.indexOf('Qualification Sizes\r\n(Double click to expand cell to see all qualifications)');
  } else if (sheetName === 'Firsts' || sheetName === 'Technicals') {
    indices.qualification = headers.indexOf('Qualification');
    indices.sector = headers.indexOf('Sector');
    indices.componentCode = headers.indexOf('Component Code');
    indices.componentName = headers.indexOf('Component Name');
    indices.examType = headers.indexOf('Exam/Task');
    indices.duration = headers.indexOf('Duration');
    indices.access = headers.indexOf('Access');
    indices.levelOfControl = headers.indexOf('Level of control');
    indices.additionalInfo = headers.indexOf('Additional information');
    indices.invigilator = headers.indexOf('Internal/External invigilator required');
  } else if (sheetName === 'Tech Award from 2022') {
    indices.qualification = headers.indexOf('Qualification');
    indices.sector = headers.indexOf('Subject'); // Use Subject as sector
    indices.componentCode = headers.indexOf('Examination code');
    indices.componentName = headers.indexOf('Title');
    indices.examType = headers.indexOf('Task/Test');
    indices.duration = headers.indexOf('Duration');
    indices.levelOfControl = headers.indexOf('Level of control');
    indices.additionalInfo = headers.indexOf('Additional information');
    indices.invigilator = headers.indexOf('Internal/External invigilator required');
  }
  
  return indices;
}

/**
 * Creates an assessment object from row data
 * @param {string} sheetName - Name of the sheet
 * @param {Array} row - Row data
 * @param {Object} indices - Column indices
 * @returns {Object} Assessment object
 */
function createAssessmentObject(sheetName, row, indices) {
  try {
    // Get qualification (required field)
    const qualification = indices.qualification !== -1 && row[indices.qualification] 
      ? row[indices.qualification] : getDefaultQualification(sheetName);
    
    if (!qualification) {
      return null;
    }
    
    // Create the assessment object
    return {
      qualification,
      sector: indices.sector !== -1 && row[indices.sector] ? row[indices.sector] : '',
      componentCode: indices.componentCode !== -1 && row[indices.componentCode] ? row[indices.componentCode] : '',
      componentName: indices.componentName !== -1 && row[indices.componentName] ? row[indices.componentName] : '',
      examType: indices.examType !== -1 && row[indices.examType] ? row[indices.examType] : 'Task',
      duration: indices.duration !== -1 && row[indices.duration] ? row[indices.duration] : '',
      access: indices.access !== -1 && row[indices.access] ? row[indices.access] : 'Secure Dispatch',
      levelOfControl: indices.levelOfControl !== -1 && row[indices.levelOfControl] ? row[indices.levelOfControl] : '',
      additionalInfo: indices.additionalInfo !== -1 && row[indices.additionalInfo] ? row[indices.additionalInfo] : '',
      invigilator: indices.invigilator !== -1 && row[indices.invigilator] ? row[indices.invigilator] : '',
      qualificationSizes: indices.qualificationSizes !== -1 && row[indices.qualificationSizes] ? row[indices.qualificationSizes] : ''
    };
  } catch (error) {
    console.error('Error creating assessment object:', error);
    return null;
  }
}

/**
 * Gets default qualification name based on sheet name
 * @param {string} sheetName - Name of the sheet
 * @returns {string} Default qualification name
 */
function getDefaultQualification(sheetName) {
  switch (sheetName) {
    case 'Nationals': return 'RQF BTEC National';
    case 'Firsts': return 'NQF BTEC First';
    case 'Technicals': return 'BTEC Technical';
    case 'Tech Award from 2022': return 'BTEC Tech Award 2022';
    default: return 'BTEC Qualification';
  }
}

/**
 * Loads the Google Sheets API
 * @returns {Promise} Promise that resolves when API is loaded
 */
function loadGoogleSheetsAPI() {
  return new Promise((resolve, reject) => {
    // Check if API is already loaded
    if (window.gapi && window.gapi.client && window.gapi.client.sheets) {
      resolve(true);
      return;
    }
    
    // Load the API
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapi.load('client', () => {
        gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
        }).then(() => {
          resolve(true);
        }).catch(error => {
          console.error('Google API client init error:', error);
          reject(error);
        });
      });
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Sheets API'));
    };
    
    document.body.appendChild(script);
  });
}
