import pkg from 'pg';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import axios from 'axios';
import xml2js from 'xml2js'

const { Client } = pkg;

const db = new Client({
    user: "postgres",
    host: "localhost",
    database: "user_auth_db",
    password: "Merlyn",
    port: 5432,
});

await db.connect();



// Function to create the notes table if it doesn't exist
const ensureNotesTableExists = async (userId) => {
    const query = `
        CREATE TABLE IF NOT EXISTS notes_${userId} (
            note_id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await db.query(query);
        console.log(`Notes table for user ${userId} ensured.`);
    } catch (err) {
        console.error('Error ensuring notes table:', err);
    }
};

const registerUser = async (name, email, password) => {
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    const result = await db.query(checkUserQuery, values);

    if (result.rows.length > 0) {
        console.log('User already registered.');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUserQuery = `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id;
    `;
    const insertValues = [name, email, hashedPassword];
    const userResult = await db.query(insertUserQuery, insertValues);
    const userId = userResult.rows[0].id;

    console.log(`User ${name} registered successfully with ID ${userId}.`);
    await ensureNotesTableExists(userId);
};

const app = express();
app.use(express.json());
app.use(cors());

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).send('User already registered');
        }
                
        await db.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('Signup error:', err);  // <-- Log the full error
        res.status(500).send('Error registering user')
    }
});



// Improved PubMed Central API endpoint that handles XML response
app.get('/api/research-articles', async (req, res) => {
    try {
        const { query = 'medicine', maxResults = 10 } = req.query;
        
        const response = await axios.get('https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi', {
            params: {
                q: query,
                retmax: maxResults,
                format: 'pdf'
            },
            responseType: 'text' // Get raw response to handle both XML and JSON
        });

        let articles = [];
        
        // Check if response is XML
        if (response.data.startsWith('<')) {
            // Parse XML to JSON
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(response.data);
            
            // Extract records from XML structure
            if (result.OA && result.OA.records && result.OA.records.record) {
                const records = Array.isArray(result.OA.records.record) 
                    ? result.OA.records.record 
                    : [result.OA.records.record];
                
                articles = records.map(record => ({
                    id: record.$.id || '',
                    title: record.$.citation || 'No title available',
                    journal: record.$.citation ? record.$.citation.split('.')[0] : 'Unknown journal',
                    publicationDate: record.link ? record.link.$.updated : 'Unknown date',
                    link: record.link ? record.link.$.href : null,
                    license: record.$.license || 'Unknown license',
                    format: record.link ? record.link.$.format : null
                })).slice(0, maxResults);
            }
        } 
        // If response is JSON (fallback)
        else if (typeof response.data === 'object' && response.data.list) {
            articles = response.data.list
                .filter(item => item.pmid && item.title)
                .map(item => ({
                    id: item.pmid,
                    title: item.title || 'No title available',
                    authors: item.authors || 'Unknown authors',
                    journal: item.journal || 'Unknown journal',
                    publicationDate: item.pubdate || 'Unknown date',
                    link: item.pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${item.pmcid}/` : null
                }))
                .slice(0, maxResults);
        }

        if (articles.length === 0) {
            return res.status(404).json({ 
                message: 'No articles found matching your criteria',
                details: 'The API returned no valid articles' 
            });
        }

        res.json(articles);
    } catch (error) {
        console.error('PubMed Central Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch research articles',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).send('Invalid email or password');
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).send('Invalid email or password');
        }

        const token = jwt.sign({ id: user.rows[0].id }, 'your_jwt_secret');
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

app.get('/notes', async (req, res) => {
    const token = req.headers['authorization'];
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const notes = await db.query(`SELECT * FROM notes_${decoded.id}`);
        res.status(200).json(notes.rows);
    } catch (error) {
        res.status(401).send('Invalid token');
    }
});

app.post('/notes', async (req, res) => {
    const token = req.headers['authorization'];
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const { title, content } = req.body;

        await ensureNotesTableExists(decoded.id); // Ensure table exists before inserting
        await db.query(`INSERT INTO notes_${decoded.id} (title, content) VALUES ($1, $2)`, [title, content]);
        res.status(201).send('Note added');
    } catch (error) {
        res.status(401).send('Invalid token');
    }
});

//drugs

app.get('/api/drugs/fda', async (req, res) => {
    try {
        const { drugName } = req.query;
        const response = await axios.get('https://api.fda.gov/drug/label.json', {
            params: {
                search: `openfda.generic_name:"${drugName}"`,
                limit: 1
            }
        });

        const drugData = response.data.results[0];
        
        res.json({
            brandName: drugData.openfda?.brand_name?.[0],
            genericName: drugData.openfda?.generic_name?.[0],
            manufacturer: drugData.openfda?.manufacturer_name?.[0],
            indications: drugData.indications_and_usage?.[0],
            warnings: drugData.warnings?.[0],
            dosageForms: drugData.openfda?.dosage_form,
            clinicalPharmacology: drugData.clinical_pharmacology?.[0],
            adverseReactions: drugData.adverse_reactions?.[0],
            fdaLabelLink: `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${drugData.id}`
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to fetch FDA data",
            details: error.response?.data?.error?.message || error.message 
        });
    }
});

app.listen(4000, () => {
    console.log('Server running on port 4000');
});
