# AI Recovery Scan Setup Guide

The AI Recovery Scan feature uses OpenAI's GPT-4o Vision API to analyze photos of stuck or disabled vehicles and provide intelligent recovery recommendations.

## Features

- **Photo Analysis**: Take or upload photos of recovery situations
- **AI-Powered Recommendations**: Get step-by-step recovery instructions
- **Equipment Suggestions**: See what tools you'll need
- **Severity Assessment**: Understand the risk level (Low, Moderate, High, Critical)
- **Recoverability Score**: Know your chances of successful recovery
- **Safety Warnings**: Get important safety considerations

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again!)

### 2. Add API Key to Your Project

Add your OpenAI API key to the `.env` file:

```bash
# OpenAI API Key
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-key-here
```

**Important**: Never commit your `.env` file to git! It's already in `.gitignore`.

### 3. API Costs

The AI Scan feature uses **GPT-4o-mini** which is very affordable:

- **Input**: $0.150 per 1M tokens (~$0.0001 per image)
- **Output**: $0.600 per 1M tokens (~$0.0002 per analysis)
- **Total**: ~$0.0003 per scan (less than a penny!)

For 1000 scans, you'd spend about $0.30.

### 4. Test the Feature

1. Start your app: `npx expo start`
2. Navigate to the AI Scan tab
3. Take or upload a photo of a vehicle recovery situation
4. Wait for AI analysis (usually 3-5 seconds)
5. Review the recommendations!

## How It Works

1. **Photo Capture**: User takes/uploads photo via AI Scan screen
2. **Image Processing**: Photo is converted to base64 format
3. **API Request**: Sent to OpenAI GPT-4o-mini with vision capabilities
4. **AI Analysis**: GPT-4o analyzes the situation and generates:
   - Situation description
   - Severity level (low/moderate/high/critical)
   - Step-by-step recovery recommendations
   - Required equipment list
   - Safety warnings
   - Estimated difficulty
5. **Display Results**: Formatted recommendations shown to user
6. **Save History**: Analysis saved to scan history for future reference

## Example Analysis Output

```json
{
  "situation": "Vehicle high-centered on rock with front wheels off ground",
  "severity": "moderate",
  "recommendations": [
    "Clear area around vehicle and assess undercarriage damage",
    "Use high-lift jack on frame rail to lift vehicle",
    "Stack rocks under tires to create ramp",
    "Slowly drive forward while spotting"
  ],
  "requiredEquipment": [
    "High-lift jack",
    "Jack base plate",
    "Rocks or recovery boards",
    "Spotter"
  ],
  "safetyWarnings": [
    "Ensure jack is on solid frame point",
    "Never work under unsupported vehicle",
    "Have spotter guide driver"
  ],
  "estimatedDifficulty": "Moderate"
}
```

## Premium Feature

AI Recovery Scan is a **premium-only feature**. Users must subscribe to access it.

Free users will see:
- Lock icon on AI Scan tab
- Premium upgrade prompt when attempting to use
- Option to subscribe via in-app purchase

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you added `EXPO_PUBLIC_OPENAI_API_KEY` to your `.env` file
- Restart your development server after adding the key

### "Failed to analyze image"
- Check your internet connection
- Verify your API key is valid
- Check OpenAI API status: [https://status.openai.com](https://status.openai.com)
- Ensure you have API credits available

### "Invalid response format from AI"
- This is rare but can happen if the AI doesn't follow the JSON format
- The app will show a fallback error message
- Try taking a clearer photo with better lighting

## Best Practices

### For Best AI Analysis Results:
1. **Good Lighting**: Take photos in daylight when possible
2. **Multiple Angles**: Show the vehicle from different perspectives
3. **Context**: Include surrounding terrain in the frame
4. **Clear View**: Avoid blurry or obstructed photos
5. **Full Vehicle**: Show the entire vehicle and its position

### Photo Examples That Work Well:
- ✅ Vehicle stuck in mud with wheels visible
- ✅ High-centered vehicle showing undercarriage
- ✅ Vehicle on steep incline with terrain visible
- ✅ Vehicle with flat tire in rocky terrain

### Photos That May Not Work:
- ❌ Too dark or blurry
- ❌ Only showing a small part of vehicle
- ❌ Taken from inside the vehicle
- ❌ No context of surrounding terrain

## Privacy & Data

- Photos are sent to OpenAI's API for analysis
- OpenAI's data usage policy applies
- Photos are not stored on OpenAI's servers after analysis
- Analysis results are saved locally on the device
- No personal information is sent with photos

## Support

If you encounter issues:
1. Check this guide first
2. Verify your API key is correct
3. Check OpenAI API status
4. Review console logs for error messages
5. Contact support with error details

## Future Enhancements

Potential improvements:
- Support for GPT-4o (more powerful but more expensive)
- Multi-photo analysis for better context
- Video analysis for dynamic situations
- Offline mode with cached common scenarios
- Integration with equipment inventory
- Share analysis with nearby offroaders

---

**Note**: This feature requires an active internet connection and valid OpenAI API key to function.
