#!/usr/bin/env ts-node

import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

/**
 * Script to set up Dropbox webhook for automatic image processing
 */

async function setupDropboxWebhook() {
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  const webhookUrl = process.env.WEBHOOK_URL;
  const dropboxFolder = process.env.DROPBOX_FOLDER || '';

  if (!accessToken) {
    console.error('❌ DROPBOX_ACCESS_TOKEN is required');
    process.exit(1);
  }

  if (!webhookUrl) {
    console.error('❌ WEBHOOK_URL is required (e.g., https://yourdomain.com/webhook)');
    process.exit(1);
  }

  const dbx = new Dropbox({ 
    accessToken,
    fetch: fetch as any
  });

  try {
    console.log('🚀 Setting up Dropbox webhook...');
    
    // First, we need to create a cursor for the folder we want to monitor
    console.log(`📂 Creating cursor for folder: ${dropboxFolder || '/'}`);
    
    const listResponse = await dbx.filesListFolder({
      path: dropboxFolder,
      recursive: true
    });

    console.log(`📄 Found ${listResponse.result.entries.length} existing files`);
    
    // Note: The actual webhook setup requires a Dropbox Business account
    // and needs to be done through the Dropbox App Console or Business API
    console.log('📡 Webhook setup information:');
    console.log('1. Go to your Dropbox App Console: https://www.dropbox.com/developers/apps');
    console.log('2. Select your app');
    console.log('3. Go to the "Webhooks" tab');
    console.log(`4. Add webhook URL: ${webhookUrl}`);
    console.log('5. Save the configuration');
    
    console.log('\n🔧 Environment variables needed:');
    console.log(`WEBHOOK_URL=${webhookUrl}`);
    console.log('DROPBOX_WEBHOOK_SECRET=<secret_from_app_console>');
    console.log('WEBHOOK_PORT=3000');
    
    console.log('\n✅ Setup information provided. Please configure webhook manually in Dropbox App Console.');
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

setupDropboxWebhook();
