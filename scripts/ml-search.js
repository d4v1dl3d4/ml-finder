#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');



// Load environment variables from .env file
function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found. Please create one with ML_ACCESS_TOKEN variable.');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return envVars;
}

// Make the API request
function makeApiRequest(accessToken) {
    const url = 'https://api.mercadolibre.com/products/search?status=active&site_id=MLA&q=iphone';
    
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    const req = https.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
            } catch (error) {
                console.error('Error parsing JSON response:', error.message);
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('Request error:', error.message);
        process.exit(1);
    });
    
    req.end();
}

// Main execution
function main() {
    const env = loadEnv();
    
    if (!env.ML_ACCESS_TOKEN) {
        console.error('Error: ML_ACCESS_TOKEN is not set in .env file');
        process.exit(1);
    }
    
    console.log('Making request to MercadoLibre API...');
    makeApiRequest(env.ML_ACCESS_TOKEN);
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { loadEnv, makeApiRequest };
