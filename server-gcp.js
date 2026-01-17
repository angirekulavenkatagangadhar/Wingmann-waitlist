// Backend server optimized for Google Cloud Platform
// Uses Cloud Storage for persistent file storage (required for Cloud Run)
// Run with: node server-gcp.js
// Make sure to install dependencies: npm install express cors xlsx @google-cloud/storage dotenv

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// Google Cloud Storage with Authentication
let storage = null;
let bucket = null;
const USE_CLOUD_STORAGE = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

if (USE_CLOUD_STORAGE) {
    try {
        const { Storage } = require('@google-cloud/storage');
        
        // Initialize with proper authentication
        const storageOptions = {};
        
        // Use service account key file if provided
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            console.log('🔑 Using service account key:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        } else {
            console.log('🔑 Using Application Default Credentials (ADC)');
        }
        
        // Set project ID explicitly
        if (process.env.GOOGLE_CLOUD_PROJECT) {
            storageOptions.projectId = process.env.GOOGLE_CLOUD_PROJECT;
        }
        
        storage = new Storage(storageOptions);
        
        const bucketName = process.env.GCS_BUCKET_NAME || 'wingmann-submissions';
        bucket = storage.bucket(bucketName);
        
        console.log('✅ Google Cloud Storage initialized');
        console.log('📦 Bucket:', bucketName);
        console.log('🏢 Project:', process.env.GOOGLE_CLOUD_PROJECT || 'auto-detected');
        
    } catch (error) {
        console.error('❌ Cloud Storage initialization failed:', error.message);
        console.warn('⚠️ Falling back to local file storage');
    }
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security: Secret key for data export
const DOWNLOAD_KEY = process.env.DOWNLOAD_KEY;

// Validate critical environment variables in production
if (NODE_ENV === 'production') {
    if (!DOWNLOAD_KEY || DOWNLOAD_KEY === 'YOUR_SECRET_KEY_HERE') {
        console.error(' CRITICAL: DOWNLOAD_KEY not set or using default value!');
        console.error(' Set a strong DOWNLOAD_KEY environment variable before deploying to production');
        process.exit(1);
    }
    
    if (!process.env.GCS_BUCKET_NAME) {
        console.warn('⚠️ WARNING: GCS_BUCKET_NAME not set, using default "wingmann-submissions"');
    }
    
    console.log('✅ Production environment variables validated');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// File-based storage
const DATA_FILE = 'wingmann_submissions.json';
const CSV_FILE = 'wingmann_submissions.csv';
const EXCEL_FILE = 'wingmann_submissions.xlsx';

// Helper: Read file from Cloud Storage or local
async function readFile(filename) {
    if (bucket) {
        try {
            const file = bucket.file(filename);
            const [exists] = await file.exists();
            if (!exists) return null;
            const [contents] = await file.download();
            return contents.toString('utf8');
        } catch (error) {
            console.error(`Error reading ${filename} from Cloud Storage:`, error);
            return null;
        }
    } else {
        const filepath = path.join(__dirname, filename);
        if (!fs.existsSync(filepath)) return null;
        return fs.readFileSync(filepath, 'utf8');
    }
}

// Helper: Write file to Cloud Storage or local
async function writeFile(filename, content) {
    if (bucket) {
        try {
            const file = bucket.file(filename);
            await file.save(content, { contentType: 'text/plain' });
            return true;
        } catch (error) {
            console.error(`Error writing ${filename} to Cloud Storage:`, error);
            return false;
        }
    } else {
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, content, 'utf8');
        return true;
    }
}

// Helper: Write binary file (for Excel)
async function writeBinaryFile(filename, buffer) {
    if (bucket) {
        try {
            const file = bucket.file(filename);
            await file.save(buffer, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return true;
        } catch (error) {
            console.error(`Error writing ${filename} to Cloud Storage:`, error);
            return false;
        }
    } else {
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, buffer);
        return true;
    }
}

// Initialize data file if it doesn't exist
async function initializeDataFile() {
    const existing = await readFile(DATA_FILE);
    if (!existing) {
        await writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }
}

// Helper functions for file operations
async function readSubmissions() {
    try {
        const data = await readFile(DATA_FILE);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading submissions:', error);
        return [];
    }
}

async function writeSubmissions(submissions) {
    try {
        await writeFile(DATA_FILE, JSON.stringify(submissions, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing submissions:', error);
        return false;
    }
}

// API endpoint to receive submissions
app.post('/api/submit', async (req, res) => {
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
        const submissions = await readSubmissions();
        
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
        if (!(await writeSubmissions(submissions))) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error saving data' 
            });
        }
        
        // Automatically update CSV and Excel files
        await updateCSVFile(submissions);
        await updateExcelFile(submissions);
        
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
app.get('/api/submissions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;
        
        const allSubmissions = await readSubmissions();
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
    
    if (!providedKey) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Download key required. Use ?key=your-secret-key or set X-Download-Key header.'
        });
    }
    
    if (providedKey !== DOWNLOAD_KEY) {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Invalid download key.'
        });
    }
    
    next();
}

// Endpoint to download all submissions as CSV/Excel (PROTECTED)
app.get('/api/download', requireDownloadKey, async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const allSubmissions = await readSubmissions();
        const submissions = allSubmissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        if (submissions.length === 0) {
            return res.status(404).json({ message: 'No submissions found' });
        }
        
        const headers = [
            'ID', 'Name', 'Age', 'Gender', 'City', 'Contact (Email/Mobile)',
            'Perfect First Date', 'Random Thing That Makes You Laugh',
            'Describe Your Vibe', 'Biggest Ick', 'Submission Date', 'Created At'
        ];
        
        if (format === 'xlsx') {
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
            
            const colWidths = [
                { wch: 5 }, { wch: 20 }, { wch: 5 }, { wch: 10 }, { wch: 15 },
                { wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
                { wch: 25 }, { wch: 25 }
            ];
            worksheet['!cols'] = colWidths;
            
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=wingmann_all_submissions.xlsx');
            res.send(excelBuffer);
        } else {
            const csvHeaders = headers.join(',');
            const rows = submissions.map(sub => [
                escapeCSV(sub.id), escapeCSV(sub.name), escapeCSV(sub.age),
                escapeCSV(sub.gender), escapeCSV(sub.city), escapeCSV(sub.contact),
                escapeCSV(sub.answer1), escapeCSV(sub.answer2), escapeCSV(sub.answer3),
                escapeCSV(sub.answer4), escapeCSV(sub.submission_date), escapeCSV(sub.created_at)
            ].join(','));
            
            const csvContent = [csvHeaders, ...rows].join('\n');
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=wingmann_all_submissions.csv');
            res.send('\ufeff' + csvContent);
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Error downloading file' });
    }
});

function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

async function updateCSVFile(submissions) {
    try {
        const sorted = submissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        const headers = [
            'ID', 'Name', 'Age', 'Gender', 'City', 'Contact (Email/Mobile)',
            'Perfect First Date', 'Random Thing That Makes You Laugh',
            'Describe Your Vibe', 'Biggest Ick', 'Submission Date', 'Created At'
        ];
        
        const csvHeaders = headers.join(',');
        const rows = sorted.map(sub => [
            escapeCSV(sub.id), escapeCSV(sub.name), escapeCSV(sub.age),
            escapeCSV(sub.gender), escapeCSV(sub.city), escapeCSV(sub.contact),
            escapeCSV(sub.answer1), escapeCSV(sub.answer2), escapeCSV(sub.answer3),
            escapeCSV(sub.answer4), escapeCSV(sub.submission_date), escapeCSV(sub.created_at)
        ].join(','));
        
        const csvContent = [csvHeaders, ...rows].join('\n');
        await writeFile(CSV_FILE, '\ufeff' + csvContent);
        console.log(`CSV file updated: ${CSV_FILE}`);
        return true;
    } catch (error) {
        console.error('Error updating CSV file:', error);
        return false;
    }
}

async function updateExcelFile(submissions) {
    try {
        const sorted = submissions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        const worksheetData = sorted.map(sub => ({
            'ID': sub.id, 'Name': sub.name || '', 'Age': sub.age || '',
            'Gender': sub.gender || '', 'City': sub.city || '',
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
        
        const colWidths = [
            { wch: 5 }, { wch: 20 }, { wch: 5 }, { wch: 10 }, { wch: 15 },
            { wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
            { wch: 25 }, { wch: 25 }
        ];
        worksheet['!cols'] = colWidths;
        
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        await writeBinaryFile(EXCEL_FILE, excelBuffer);
        console.log(`Excel file updated: ${EXCEL_FILE}`);
        return true;
    } catch (error) {
        console.error('Error updating Excel file:', error);
        return false;
    }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const submissions = await readSubmissions();
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            totalSubmissions: submissions.length,
            storage: USE_CLOUD_STORAGE ? 'Cloud Storage' : 'Local'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Initialize on startup
initializeDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Storage: ${USE_CLOUD_STORAGE ? 'Google Cloud Storage' : 'Local filesystem'}`);
        console.log(`\nAPI endpoint: http://localhost:${PORT}/api/submit`);
        console.log(`\n⚠️  SECURITY: Download endpoints are protected!`);
        console.log(`Set DOWNLOAD_KEY environment variable in production!`);
    });
});
