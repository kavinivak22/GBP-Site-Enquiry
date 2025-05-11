# Guberaan Builders Contact Form - Deployment Guide

This guide explains how to deploy the Guberaan Builders Contact Form as a Progressive Web App (PWA) with offline capabilities.

## Table of Contents
1. [Setting Up Google Apps Script](#setting-up-google-apps-script)
2. [Deploying the PWA](#deploying-the-pwa)
3. [Testing the PWA](#testing-the-pwa)
4. [Troubleshooting](#troubleshooting)

## Setting Up Google Apps Script

### Step A: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Rename it to "Guberaan Builders - Contact Form Responses" or any name you prefer
3. Copy the Sheet ID from the URL (it's the long string between `/d/` and `/edit` in the URL)

### Step B: Set Up Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/home) and click "New Project"
2. Replace the default content with the code from `Code.gs.pwa`
3. Update the `SHEET_ID` constant at the top with your actual Google Sheet ID
4. Click File > Save and name your project (e.g., "Guberaan Contact Form")
5. Click Deploy > New deployment
6. Set the following options:
   - Type: Web app
   - Description: Guberaan Builders Contact Form API
   - Execute as: Me
   - Who has access: Anyone (for public access) or "Anyone with Google Account" (more secure)
7. Click "Deploy" and authorize when prompted
8. Copy the Web app URL that's displayed after deployment

## Deploying the PWA

### Step A: Prepare the Files
1. In your `app.js` file, find and update line 3 with your Google Apps Script URL:
   ```js
   const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```
   Replace 'YOUR_DEPLOYMENT_ID' with the actual ID from your deployment URL

2. In your `service-worker.js` file, update line 120 with the same URL:
   ```js
   const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

3. Rename `index.html.pwa` to `index.html` if you want to use the PWA version as your main version

### Step B: Upload to Web Hosting

You have several options for hosting your PWA:

#### Option 1: Standard Web Hosting
Upload all these files to your web hosting service:
- index.html
- style.css
- app.js
- service-worker.js
- manifest.json
- offline.html
- logo.png
- icon-192.png
- icon-512.png

#### Option 2: GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all the PWA files 
3. Enable GitHub Pages in repository settings
4. Your site will be available at `https://yourusername.github.io/reponame/`

#### Option 3: Netlify or Vercel (Free Options)
1. Create an account on [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/)
2. Upload your files or connect to a GitHub repository
3. Deploy your site with a few clicks

## Testing the PWA

1. Visit your deployed website in a browser
2. Test the form by filling out information and submitting
3. Test offline functionality:
   - Open Chrome DevTools (F12)
   - Go to Network tab and enable "Offline" mode
   - Refresh the page (it should still load)
   - Submit a form (it should say it's saved offline)
   - Turn off offline mode and refresh (your submission should sync)

4. Test PWA installation:
   - On Chrome, you should see an install icon in the address bar
   - On mobile, you should be prompted to add to home screen

## Troubleshooting

### CORS Issues
If you get CORS errors, you need to enable CORS in your Google Apps Script:

1. Go back to your Google Apps Script project
2. Run the `setupCORS()` function manually:
   - Select it from the function dropdown
   - Click the play button
   - Authorize access when prompted

### PWA Not Working Offline
Make sure:
1. Your service worker is correctly registered
2. All required files are listed in the service worker's cache list
3. Your site is being served over HTTPS (PWAs require secure connections)

### Form Submissions Not Saving
1. Check that the API_URL in app.js points to your correct Google Apps Script URL
2. Verify the Google Sheet ID in Code.gs is correct
3. Make sure you've deployed the Google Apps Script as a web app
4. Check permissions on your Google Sheet

## Need Additional Help?
If you encounter issues, please contact the developer for support.