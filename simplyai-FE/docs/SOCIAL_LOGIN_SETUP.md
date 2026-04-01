# Social Login Setup Guide

## 📋 Overview
This guide explains how to set up Google and Facebook OAuth authentication for your application.

## 🔧 Google OAuth Setup

### 1. Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen first if prompted
6. Select "Web application" as the application type
7. Add these authorized redirect URIs:
   - `http://localhost:4000/api/auth/google/callback`
   - `https://yourdomain.com/api/auth/google/callback` (for production)

### 2. Configure Environment Variables
Copy the Client ID and Client Secret from Google Cloud Console and update your `.env` file:

```env
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
```

## 🔧 Facebook OAuth Setup

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Build Connected Experiences"
4. Fill in your app details
5. Add "Facebook Login" product to your app
6. In Facebook Login settings, add these Valid OAuth Redirect URIs:
   - `http://localhost:4000/api/auth/facebook/callback`
   - `https://yourdomain.com/api/auth/facebook/callback` (for production)

### 2. Configure Environment Variables
Copy the App ID and App Secret from Facebook Developers and update your `.env` file:

```env
FACEBOOK_APP_ID=your_actual_facebook_app_id
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret
```

## 🚀 Testing Social Login

### 1. Start Your Servers
Make sure both backend and frontend servers are running:
```bash
# Backend (port 4000)
cd backend
node index.js

# Frontend (port 8081)
npm run dev
```

### 2. Test OAuth Flow
1. Navigate to `http://localhost:8081/login`
2. Click "Continua con Google" or "Continua con Facebook"
3. Complete the OAuth authorization
4. You should be redirected back and automatically logged in

## 🔍 Troubleshooting

### Common Issues:

1. **"OAuth Error: redirect_uri_mismatch"**
   - Make sure the redirect URI in your OAuth app matches exactly
   - Check for trailing slashes and http vs https

2. **"Invalid OAuth Client"**
   - Verify your Client ID and Client Secret are correct
   - Make sure the OAuth app is published (not in testing mode)

3. **"App Not Found"**
   - Check that your Facebook App ID is correct
   - Ensure the Facebook app is in "Live" mode for production

### Environment Variables Template:
```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FRONTEND_URL=http://localhost:8081
```

## 🎯 Features Implemented

✅ **Google OAuth Login**
✅ **Facebook OAuth Login** 
✅ **Automatic User Creation**
✅ **JWT Token Generation**
✅ **Database Integration**
✅ **Error Handling**
✅ **Redirect Management**

## 🔒 Security Notes

- OAuth secrets should never be committed to version control
- Use environment variables for all sensitive configuration
- Set up proper CORS policies for production
- Use HTTPS in production environments
- Regularly rotate your OAuth secrets

## 📱 Frontend Integration

The social login buttons are now available on the login page with:
- Google OAuth button with Google branding
- Facebook OAuth button with Facebook branding  
- Seamless integration with existing authentication flow
- Automatic redirect to dashboard after successful login
