# Google Drive OAuth Setup (Free Method)

This guide shows you how to set up free Google Drive backups using your personal Google account.

## 🆓 Why OAuth is Better

- **Completely Free**: Uses your personal Google account
- **No Storage Quota**: Your personal Google Drive has 15GB free storage
- **No Service Account**: No complex service account setup
- **Easy Setup**: Simple OAuth flow
- **Secure**: Uses standard OAuth 2.0 authentication

## 📋 Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Click "Create"
6. Download the JSON file or copy the credentials

### 3. Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for backups (e.g., "MicroPOS Backups")
3. Right-click the folder and select "Share"
4. Copy the folder ID from the URL (the long string after `/folders/`)

### 4. Environment Variables

Add these to your `.env.local` file:

```env
# Google Drive OAuth (Free Method)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
GOOGLE_DRIVE_FOLDER_ID="your-google-drive-folder-id"

# Optional: Store tokens for automatic authentication
GOOGLE_ACCESS_TOKEN=""
GOOGLE_REFRESH_TOKEN=""
```

### 5. Complete OAuth Setup

1. Start your application: `npm run dev`
2. Go to `/setup/google-drive` in your browser
3. Click "الحصول على رابط التفويض" (Get Authorization URL)
4. Click the generated link and sign in to your Google account
5. Grant the requested permissions
6. Copy the authorization code from the page
7. Paste it in the setup page and click "إكمال المصادقة" (Complete Authentication)

## 🎯 How It Works

1. **First Time**: You need to complete the OAuth flow once
2. **Automatic**: After setup, backups work automatically
3. **Secure**: Uses your personal Google account with proper permissions
4. **Free**: No costs, uses your free Google Drive storage

## 🔧 Features

- **Automatic Backups**: Daily backups at 2:00 AM
- **Manual Backups**: Click backup button in sidebar
- **Local Fallback**: If Google Drive fails, saves locally
- **Cleanup**: Automatically removes old backups (keeps last 10)

## 🚨 Troubleshooting

### Common Issues

1. **"Not authenticated"**: Complete the OAuth setup first
2. **"Invalid credentials"**: Check your CLIENT_ID and CLIENT_SECRET
3. **"Folder not found"**: Verify your GOOGLE_DRIVE_FOLDER_ID
4. **"Permission denied"**: Make sure you granted all requested permissions

### Getting Help

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure the Google Drive API is enabled
4. Ensure the redirect URI matches exactly

## 🔄 Switching Between Methods

You can use either OAuth (free) or Service Account methods:

- **OAuth (Recommended)**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **Service Account**: Set `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`

The system will automatically detect which method is configured and use it.

## 📊 Benefits

✅ **Completely Free**: No costs whatsoever
✅ **15GB Storage**: Your personal Google Drive space
✅ **Easy Setup**: Simple OAuth flow
✅ **Secure**: Standard OAuth 2.0 authentication
✅ **Automatic**: Works without manual intervention
✅ **Reliable**: No service account quota limitations
