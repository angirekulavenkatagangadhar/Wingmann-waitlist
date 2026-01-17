// Backend server to collect all submissions
// Run with: node server.js
// Make sure to install dependencies: npm install express cors xlsx dotenv
// 
// IMPORTANT: Data Export Endpoints:
// - CSV: GET /api/download?format=csv
// - Excel: GET /api/download?format=xlsx
// All form submissions are automatically saved to wingmann_submissions.json

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Secret key for data export (set via environment variable)
// In production, set this: export DOWNLOAD_KEY="your-secret-password-here"
// Or change the default value below:
const DOWNLOAD_KEY = process.env.DOWNLOAD_KEY || 'YOUR_SECRET_KEY_HERE';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// File-based storage (JSON, CSV, and Excel)
const DATA_FILE = path.join(__dirname, 'wingmann_submissions.json');
const CSV_FILE = path.join(__dirname, 'wingmann_submissions.csv');
const EXCEL_FILE = path.join(__dirname, 'wingmann_submissions.xlsx');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Initialize CSV and Excel files from existing data (called after functions are defined)
function initializeDataFiles() {
    const submissions = readSubmissions();
    updateCSVFile(submissions);
    updateExcelFile(submissions);
    console.log('✅ CSV and Excel files initialized/updated from existing data');
}

// Helper functions for file operations
function readSubmissions() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading submissions:', error);
        return [];
    }
}

function writeSubmissions(submissions) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing submissions:', error);
        return false;
    }
}

// API endpoint to receive submissions
app.post('/api/submit', (req, res) => {
    try {
        const data = req.body;
        
        // Validate required fields
        if (!data.personalInfo || !data.answers) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required data' 
            });
        }
        
        const { name, age, gender, city, contact } = data.personalInfo;
        const { question1, question2, question3, question4 } = data.answers;
        
        if (!name || !age || !gender || !city || !contact || 
            !question1 || !question2 || !question3 || !question4) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        // Read existing submissions
        const submissions = readSubmissions();
        
        // Create new submission
        const newSubmission = {
            id: submissions.length + 1,
            name,
            age,
            gender,
            city,
            contact,
            answer1: question1,
            answer2: question2,
            answer3: question3,
            answer4: question4,
            submission_date: data.submissionDate || new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        // Add to array and save
        submissions.push(newSubmission);
        if (!writeSubmissions(submissions)) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error saving data' 
            });
        }
        
        // Automatically update CSV and Excel files on server
        updateCSVFile(submissions);
        updateExcelFile(submissions);
        
        console.log(`New submission received: ${name}`);
        console.log(`✅ Data saved to: JSON, CSV, and Excel files`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Data saved successfully' 
        });
    } catch (error) {
        console.error('Error saving submission:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving data' 
        });
    }
});

// Endpoint to get all submissions (with pagination)
app.get('/api/submissions', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;
        
        const allSubmissions = readSubmissions();
        const total = allSubmissions.length;
        
        // Sort by created_at descending and paginate
        const sorted = allSubmissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        const submissions = sorted.slice(offset, offset + limit);
        
        res.json({
            success: true,
            data: submissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching data' 
        });
    }
});

// Middleware to protect download endpoint
function requireDownloadKey(req, res, next) {
    const providedKey = req.query.key || req.headers['x-download-key'];
    
    // Debug logging (remove in production if desired)
    console.log('Download attempt - Provided key:', providedKey ? '***' + providedKey.slice(-3) : 'NONE');
    console.log('Expected key:', DOWNLOAD_KEY === 'change-this-in-production' ? 'DEFAULT (CHANGE THIS!)' : '***' + DOWNLOAD_KEY.slice(-3));
    
    if (!providedKey) {
        console.log('❌ Access denied: No key provided');
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Download key required. Use ?key=your-secret-key or set X-Download-Key header.'
        });
    }
    
    if (providedKey !== DOWNLOAD_KEY) {
        console.log('❌ Access denied: Invalid key');
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Invalid download key.'
        });
    }
    
    console.log('✅ Access granted: Valid key');
    next();
}

// Endpoint to download all submissions as CSV/Excel (PROTECTED)
app.get('/api/download', requireDownloadKey, (req, res) => {
    try {
        const format = req.query.format || 'csv'; // csv or xlsx
        const allSubmissions = readSubmissions();
        const submissions = allSubmissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        if (submissions.length === 0) {
            return res.status(404).json({ message: 'No submissions found' });
        }
        
        // Column headers with descriptive names
        const headers = [
            'ID',
            'Name', 
            'Age', 
            'Gender', 
            'City', 
            'Contact (Email/Mobile)',
            'Perfect First Date', 
            'Random Thing That Makes You Laugh',
            'Describe Your Vibe', 
            'Biggest Ick', 
            'Submission Date',
            'Created At'
        ];
        
        if (format === 'xlsx') {
            // Excel export
            const worksheetData = submissions.map(sub => ({
                'ID': sub.id,
                'Name': sub.name || '',
                'Age': sub.age || '',
                'Gender': sub.gender || '',
                'City': sub.city || '',
                'Contact (Email/Mobile)': sub.contact || '',
                'Perfect First Date': sub.answer1 || '',
                'Random Thing That Makes You Laugh': sub.answer2 || '',
                'Describe Your Vibe': sub.answer3 || '',
                'Biggest Ick': sub.answer4 || '',
                'Submission Date': sub.submission_date || '',
                'Created At': sub.created_at || ''
            }));
            
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
            
            // Set column widths
            const colWidths = [
                { wch: 5 },   // ID
                { wch: 20 },  // Name
                { wch: 5 },   // Age
                { wch: 10 },  // Gender
                { wch: 15 },  // City
                { wch: 30 },  // Contact
                { wch: 40 },  // Answer 1
                { wch: 40 },  // Answer 2
                { wch: 40 },  // Answer 3
                { wch: 40 },  // Answer 4
                { wch: 25 },  // Submission Date
                { wch: 25 }   // Created At
            ];
            worksheet['!cols'] = colWidths;
            
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=wingmann_all_submissions.xlsx');
            res.send(excelBuffer);
        } else {
            // CSV export
            const csvHeaders = headers.join(',');
            
            const rows = submissions.map(sub => {
                return [
                    escapeCSV(sub.id),
                    escapeCSV(sub.name),
                    escapeCSV(sub.age),
                    escapeCSV(sub.gender),
                    escapeCSV(sub.city),
                    escapeCSV(sub.contact),
                    escapeCSV(sub.answer1),
                    escapeCSV(sub.answer2),
                    escapeCSV(sub.answer3),
                    escapeCSV(sub.answer4),
                    escapeCSV(sub.submission_date),
                    escapeCSV(sub.created_at)
                ].join(',');
            });
            
            const csvContent = [csvHeaders, ...rows].join('\n');
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=wingmann_all_submissions.csv');
            // Add BOM for Excel UTF-8 compatibility
            res.send('\ufeff' + csvContent);
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Error downloading file' });
    }
});

// Helper function to escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

// Function to update CSV file on server
function updateCSVFile(submissions) {
    try {
        const sorted = submissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        const headers = [
            'ID',
            'Name', 
            'Age', 
            'Gender', 
            'City', 
            'Contact (Email/Mobile)',
            'Perfect First Date', 
            'Random Thing That Makes You Laugh',
            'Describe Your Vibe', 
            'Biggest Ick', 
            'Submission Date',
            'Created At'
        ];
        
        const csvHeaders = headers.join(',');
        const rows = sorted.map(sub => {
            return [
                escapeCSV(sub.id),
                escapeCSV(sub.name),
                escapeCSV(sub.age),
                escapeCSV(sub.gender),
                escapeCSV(sub.city),
                escapeCSV(sub.contact),
                escapeCSV(sub.answer1),
                escapeCSV(sub.answer2),
                escapeCSV(sub.answer3),
                escapeCSV(sub.answer4),
                escapeCSV(sub.submission_date),
                escapeCSV(sub.created_at)
            ].join(',');
        });
        
        const csvContent = [csvHeaders, ...rows].join('\n');
        // Add BOM for Excel UTF-8 compatibility
        fs.writeFileSync(CSV_FILE, '\ufeff' + csvContent, 'utf8');
        console.log(`CSV file updated: ${CSV_FILE}`);
        return true;
    } catch (error) {
        console.error('Error updating CSV file:', error);
        return false;
    }
}

// Function to update Excel file on server
function updateExcelFile(submissions) {
    try {
        const sorted = submissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        const worksheetData = sorted.map(sub => ({
            'ID': sub.id,
            'Name': sub.name || '',
            'Age': sub.age || '',
            'Gender': sub.gender || '',
            'City': sub.city || '',
            'Contact (Email/Mobile)': sub.contact || '',
            'Perfect First Date': sub.answer1 || '',
            'Random Thing That Makes You Laugh': sub.answer2 || '',
            'Describe Your Vibe': sub.answer3 || '',
            'Biggest Ick': sub.answer4 || '',
            'Submission Date': sub.submission_date || '',
            'Created At': sub.created_at || ''
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
        
        // Set column widths
        const colWidths = [
            { wch: 5 },   // ID
            { wch: 20 },  // Name
            { wch: 5 },   // Age
            { wch: 10 },  // Gender
            { wch: 15 },  // City
            { wch: 30 },  // Contact
            { wch: 40 },  // Answer 1
            { wch: 40 },  // Answer 2
            { wch: 40 },  // Answer 3
            { wch: 40 },  // Answer 4
            { wch: 25 },  // Submission Date
            { wch: 25 }   // Created At
        ];
        worksheet['!cols'] = colWidths;
        
        XLSX.writeFile(workbook, EXCEL_FILE);
        console.log(`Excel file updated: ${EXCEL_FILE}`);
        return true;
    } catch (error) {
        console.error('Error updating Excel file:', error);
        return false;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    try {
        const submissions = readSubmissions();
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            totalSubmissions: submissions.length
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Initialize CSV and Excel files on server start (after all functions are defined)
initializeDataFiles();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`\n📁 Data files (auto-updated on each submission):`);
    console.log(`   JSON: ${DATA_FILE}`);
    console.log(`   CSV:  ${CSV_FILE}`);
    console.log(`   Excel: ${EXCEL_FILE}`);
    console.log(`\nAPI endpoint: http://localhost:${PORT}/api/submit`);
    console.log(`\n⚠️  SECURITY: Download endpoints are protected!`);
    console.log(`Download CSV: http://localhost:${PORT}/api/download?format=csv&key=YOUR_SECRET_KEY`);
    console.log(`Download Excel: http://localhost:${PORT}/api/download?format=xlsx&key=YOUR_SECRET_KEY`);
    console.log(`\nSet DOWNLOAD_KEY environment variable in production!`);
    console.log(`Current key: ${DOWNLOAD_KEY === 'change-this-in-production' ? '⚠️ DEFAULT (CHANGE THIS!)' : '✅ Set via environment'}`);
});
