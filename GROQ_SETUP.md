# 🚀 Groq AI Setup Guide

## Current Status
❌ **AI is NOT using Groq API** - It's using fallback responses only.

## Why AI isn't working with Groq:
1. **Missing API Key**: No `VITE_GROQ_API_KEY` in environment variables
2. **No .env file**: Environment variables not configured

## ✅ How to Fix:

### Step 1: Get Groq API Key
1. Go to https://console.groq.com/
2. Sign up/Login
3. Create a new API key
4. Copy the key (starts with `gsk_`)

### Step 2: Create Environment File
Create a file called `.env` in the `insurance-broker-app` directory:

```bash
# Groq AI Configuration
VITE_GROQ_API_KEY=gsk_your_actual_api_key_here
VITE_GROQ_API_URL=https://api.groq.com/openai/v1
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

## 🔍 How to Verify It's Working:

1. **Console Logs**: Look for these messages:
   - ✅ `Groq AI service initialized with API key`
   - 🚀 `Calling real Groq API...`
   - ✅ `Groq API response received`

2. **Without API Key**: You'll see:
   - ⚠️ `Groq API key not found in environment variables`
   - 🤖 `Using fallback response (no API key)`

## 🎯 Testing:
1. Open AI chat (click AI button in header)
2. Type: "Tell me about insurance"
3. **With Groq**: You'll get detailed, contextual AI responses
4. **Without Groq**: You'll get basic template responses

## 🔐 Important Notes:
- Never commit `.env` file to git
- Keep your API key secure
- The app works without Groq (fallback mode) but AI features are limited

---

**Current Mode**: 🤖 **Fallback Mode** (Template responses only)
**Target Mode**: 🚀 **Full AI Mode** (Real Groq responses) 