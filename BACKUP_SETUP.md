# Google Drive Backup Setup

This document explains how to set up automatic and manual database backups to Google Drive.

## Prerequisites

1. A Google Cloud Project with Google Drive API enabled
2. A service account with Google Drive API access
3. A Google Drive folder for storing backups

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 4. Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for backups (e.g., "MicroPOS Backups")
3. Right-click the folder and select "Share"
4. Add the service account email (from the JSON file) with "Editor" permissions
5. Copy the folder ID from the URL (the long string after `/folders/`)

### 5. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Google Drive API
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="your-google-drive-folder-id"
```

**Important Notes:**
- Replace the values with your actual service account details
- The `GOOGLE_PRIVATE_KEY` should include the `\n` characters for line breaks
- The `GOOGLE_DRIVE_FOLDER_ID` is the ID from the folder URL

### 6. Install Dependencies

The required dependencies are already installed:
- `googleapis` - Google APIs client library
- `node-cron` - For scheduling automatic backups

## Features

### Manual Backup
- Click "النسخ الاحتياطي للبيانات" in the sidebar menu
- The system will create a database backup and upload it to Google Drive
- You'll see a loading state while the backup is being created

### Automatic Backup
- Backups run automatically every day at 2:00 AM (Riyadh timezone)
- Old backups are automatically cleaned up (keeps last 10 backups)
- Backups are stored in your specified Google Drive folder

## Backup File Format

- Files are named: `micropos-backup-YYYY-MM-DDTHH-mm-ss.sssZ.json`
- Files are in JSON format containing all database data
- Files include all tables with relationships preserved
- Files are human-readable and can be easily inspected

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check that your service account email and private key are correct
2. **Permission Denied**: Ensure the service account has access to the Google Drive folder
3. **Backup Creation Failed**: Check database connection and Prisma configuration
4. **Upload Failed**: Check your internet connection and Google Drive API quotas
5. **Service Account Storage Quota Error**: Service accounts don't have storage quota by default

#### Service Account Storage Quota Solutions

If you get the error "Service Accounts do not have storage quota", you have several options:

**Option 1: Use Shared Drives (Recommended)**
1. Create a shared drive in Google Drive
2. Add your service account as a member with "Content Manager" role
3. Update `GOOGLE_DRIVE_FOLDER_ID` to point to the shared drive folder

**Option 2: Use OAuth Delegation**
1. Set up OAuth 2.0 credentials instead of service account
2. Use domain-wide delegation for your Google Workspace domain

**Option 3: Use Local Storage (Fallback)**
- The system automatically falls back to local storage when Google Drive fails
- Backups are saved in the `./backups/` directory
- This is the default behavior when Google Drive is not properly configured

### Logs

Check the console logs for detailed error messages. The backup service logs all operations.

## Security Notes

- Keep your service account credentials secure
- Never commit the `.env.local` file to version control
- Regularly rotate your service account keys
- Monitor your Google Drive storage usage

## Restoring from Backup

To restore from a backup:

1. Download the backup file from Google Drive
2. Use the built-in restore function in the backup service
3. Or manually import the JSON data using Prisma

**Note**: The backup service includes a `restoreFromBackup()` method that can restore data from JSON backup files.

## Monitoring

- Check the Google Drive folder regularly to ensure backups are being created
- Monitor the application logs for any backup failures
- Set up alerts if needed for critical backup failures
