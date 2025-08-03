import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { processDropboxImages } from './lib/processor-dropbox';
import { DropboxService } from './lib/dropbox';

const app: express.Application = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

// Middleware to parse raw body for webhook signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

/**
 * Verify Dropbox webhook signature
 */
function verifyDropboxSignature(body: Buffer, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.DROPBOX_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Check if the changed file is an image in our monitored folder
 */
function isRelevantImageChange(delta: any): boolean {
  const monitoredFolder = process.env.DROPBOX_FOLDER || '';
  
  if (delta['.tag'] !== 'file') return false;
  
  const filePath = delta.path_lower;
  const fileName = delta.name;
  
  // Check if file is in our monitored folder
  if (monitoredFolder && !filePath.startsWith(monitoredFolder.toLowerCase())) {
    return false;
  }
  
  // Check if file is an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

/**
 * Process new images when detected
 */
async function processNewImages() {
  try {
    console.log('🔄 Processing new images from Dropbox...');
    const dropboxFolder = process.env.DROPBOX_FOLDER || '';
    await processDropboxImages(dropboxFolder);
    console.log('✅ Image processing completed');
  } catch (error) {
    console.error('❌ Error processing new images:', error);
  }
}

// Webhook verification endpoint (GET)
app.get('/webhook', (req: Request, res: Response): void => {
  const challenge = req.query.challenge;
  
  if (!challenge) {
    res.status(400).send('Missing challenge parameter');
    return;
  }
  
  console.log('📡 Webhook verification received');
  res.send(challenge);
});

// Webhook notification endpoint (POST)
app.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-dropbox-signature'] as string;
    
    if (!signature) {
      res.status(400).send('Missing signature header');
      return;
    }
    
    // Verify webhook signature
    if (!verifyDropboxSignature(req.body, signature)) {
      res.status(403).send('Invalid signature');
      return;
    }
    
    const notification = JSON.parse(req.body.toString());
    console.log('📡 Webhook notification received:', JSON.stringify(notification, null, 2));
    
    // Check if we have file changes
    if (notification.list_folder && notification.list_folder.accounts) {
      let hasRelevantChanges = false;
      
      for (const account of notification.list_folder.accounts) {
        console.log(`🔍 Checking changes for account: ${account.account_id}`);
        
        // Get the actual changes using the cursor
        const dropboxService = new DropboxService();
        try {
          const changes = await (dropboxService as any).dbx.filesListFolderContinue({
            cursor: account.cursor
          });
          
          // Check if any changes are relevant (new images in our folder)
          for (const entry of changes.result.entries) {
            if (isRelevantImageChange(entry)) {
              console.log(`📸 New image detected: ${entry.name}`);
              hasRelevantChanges = true;
              break;
            }
          }
        } catch (error) {
          console.error('❌ Error fetching changes:', error);
        }
      }
      
      if (hasRelevantChanges) {
        // Process images in the background
        setTimeout(() => processNewImages(), 2000);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    dropboxFolder: process.env.DROPBOX_FOLDER || 'root'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.DROPBOX_WEBHOOK_SECRET) {
    console.warn('⚠️ DROPBOX_WEBHOOK_SECRET not set! Webhook verification will fail.');
  }
});

export default app;
