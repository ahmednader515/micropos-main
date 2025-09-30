# Service Account Setup (Alternative to OAuth)

If OAuth continues to have issues, you can use a service account instead.

## 🔧 Service Account Setup

### Step 1: Create Service Account

1. **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. **Select your project**: `micropos-drive-backup`
3. **Navigate to**: "APIs & Services" > "Credentials"
4. **Click "Create Credentials"** > "Service Account"
5. **Fill in details**:
   - Name: `micropos-backup-service`
   - Description: `Service account for MicroPOS backup system`
6. **Click "Create and Continue"**
7. **Skip the optional steps** and click "Done"

### Step 2: Create Service Account Key

1. **Click on the created service account**
2. **Go to "Keys" tab**
3. **Click "Add Key"** > "Create new key"
4. **Choose "JSON" format**
5. **Click "Create"**
6. **Download the JSON file**

### Step 3: Create Shared Drive (Important!)

Service accounts don't have storage quota, so we need to use a shared drive:

1. **Go to Google Drive**: [https://drive.google.com/](https://drive.google.com/)
2. **Click "New"** > "Folder"
3. **Name it**: "MicroPOS Backups"
4. **Right-click the folder** > "Share"
5. **Add the service account email** (from the JSON file) with "Content Manager" role
6. **Copy the folder ID** from the URL

### Step 4: Environment Variables

Add these to your `.env.local` file:

```env
# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@micropos-drive-backup.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key from JSON file\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="your-shared-drive-folder-id"

# Remove or comment out OAuth variables
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

### Step 5: Test the Setup

1. **Restart your application**: `npm run dev`
2. **Go to the backup page** and try creating a backup
3. **Check if it uploads to Google Drive successfully**

## 🎯 Benefits of Service Account

✅ **No OAuth consent issues**
✅ **Works immediately**
✅ **No user interaction required**
✅ **Automatic authentication**

## ⚠️ Important Notes

- **Service accounts need shared drives** (not personal Google Drive)
- **Make sure to share the folder** with the service account
- **The service account email** is in the downloaded JSON file
- **Use the folder ID** from the shared drive, not personal drive

This method bypasses all OAuth consent issues and works immediately!
