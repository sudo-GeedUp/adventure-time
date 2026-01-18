# AI Virtual Guide Documentation

Complete guide for implementing and using the AI-powered personal virtual guide in Adventure Time app.

## 🎯 Overview

The AI Virtual Guide ("Trail Buddy") is an intelligent assistant that provides:
- **Personalized trail recommendations**
- **Real-time safety advice**
- **Trip planning assistance**
- **Emergency guidance**
- **Context-aware suggestions**
- **Natural conversation interface**

---

## 🏗️ Architecture

### Components

```
services/
  └── aiGuideService.ts       # Core AI logic and OpenAI integration
screens/
  └── AIGuideScreen.tsx       # Chat interface UI
navigation/
  └── AIGuideStackNavigator.tsx  # Navigation stack
```

### Integration Points

- **OpenAI API** - GPT-4o-mini for natural language processing
- **Location Services** - Real-time user location context
- **Weather API** - Current conditions for safety advice
- **Trail Database** - Trail information for recommendations
- **User Profile** - Vehicle type, experience level, preferences

---

## 🤖 AI Guide Service

### Core Features

#### 1. **Context-Aware Conversations**
The AI Guide maintains context about:
- User's current location
- Active trail information
- Weather conditions
- Vehicle type and specifications
- Experience level
- User preferences
- Recent activities

#### 2. **Smart Suggestions**
Automatically generates relevant suggestions based on:
- Current conditions
- User context
- Safety priorities
- Trail availability

#### 3. **Trail Recommendations**
AI-powered trail selection considering:
- User skill level
- Vehicle capabilities
- Weather conditions
- Distance preferences
- Terrain type

#### 4. **Safety Analysis**
Evaluates trail safety with:
- Safety score (1-10)
- Specific warnings
- Actionable recommendations
- Risk assessment

#### 5. **Emergency Assistance**
Provides step-by-step guidance for:
- Vehicle breakdowns
- Medical emergencies
- Getting lost
- Severe weather
- Equipment failures

---

## 💬 Using the AI Guide

### Basic Chat

```typescript
import { aiGuideService } from '@/services/aiGuideService';

// Send a message
const response = await aiGuideService.chat('What trails are good for beginners?');
console.log(response);
```

### Update Context

```typescript
// Update user location
aiGuideService.updateContext({
  userLocation: {
    latitude: 38.5729,
    longitude: -109.5898,
  },
});

// Update current trail
aiGuideService.updateContext({
  currentTrail: selectedTrail,
});

// Update weather
aiGuideService.updateContext({
  weather: weatherData,
});

// Update vehicle info
aiGuideService.updateContext({
  vehicleType: 'Jeep Wrangler',
});
```

### Get Smart Suggestions

```typescript
const suggestions = await aiGuideService.getSmartSuggestions();

suggestions.forEach(suggestion => {
  console.log(suggestion.type);      // 'trail', 'safety', 'tip', etc.
  console.log(suggestion.title);     // Short title
  console.log(suggestion.message);   // Brief message
  console.log(suggestion.priority);  // 'low', 'medium', 'high', 'critical'
});
```

### Get Trail Recommendations

```typescript
const allTrails = await getTrailsNearLocation(userLocation);
const recommended = await aiGuideService.getTrailRecommendations(allTrails, 3);

// Returns top 3 trails best suited for the user
```

### Analyze Trail Safety

```typescript
const safety = await aiGuideService.analyzeTrailSafety(trail);

console.log(safety.safetyScore);        // 1-10
console.log(safety.warnings);           // Array of warnings
console.log(safety.recommendations);    // Array of recommendations
```

### Get Quick Tip

```typescript
const tip = await aiGuideService.getQuickTip();
// Returns: "💡 Always carry extra water in desert conditions"
```

### Emergency Guidance

```typescript
const guidance = await aiGuideService.getEmergencyGuidance(
  'My vehicle is stuck in mud'
);

// Returns detailed step-by-step instructions
```

### Generate Trip Plan

```typescript
const plan = await aiGuideService.generateTripPlan(
  'Moab, Utah',
  '3 days',
  ['moderate trails', 'scenic views', 'camping']
);

// Returns comprehensive trip plan
```

---

## 🎨 UI Components

### AI Guide Screen

The main chat interface includes:

#### **Header**
- Trail Buddy avatar
- Status indicator
- Clear conversation button

#### **Quick Tip Card**
- Daily rotating tips
- Context-aware advice
- Actionable information

#### **Quick Actions**
- Find Trails
- Safety Tips
- Plan Trip
- Emergency Help

#### **Smart Suggestions**
- Automatically generated
- Priority-based
- Tappable to send as message

#### **Chat Messages**
- User messages (right-aligned, primary color)
- AI responses (left-aligned, secondary color)
- Timestamps
- Avatars

#### **Input Area**
- Multi-line text input
- Send button
- Loading indicator
- Character limit (500)

---

## 🔧 Configuration

### OpenAI API Setup

1. **Get API Key**
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Copy the key

2. **Add to Environment**
   ```bash
   # .env file
   EXPO_PUBLIC_OPENAI_API_KEY=sk-...your-key-here
   ```

3. **Verify Setup**
   ```typescript
   if (aiGuideService.isAvailable()) {
     console.log('AI Guide is ready!');
   } else {
     console.log('OpenAI API key not configured');
   }
   ```

### Model Configuration

Currently using: **gpt-4o-mini**
- Fast responses
- Cost-effective
- Good for conversational AI
- 128k context window

To change model:
```typescript
// In aiGuideService.ts
model: 'gpt-4o-mini'  // Change to 'gpt-4' for more advanced reasoning
```

---

## 🎭 AI Personality

### "Trail Buddy" Character

**Role**: Expert off-road adventure guide and safety advisor

**Personality Traits**:
- Friendly and encouraging
- Safety-conscious
- Knowledgeable
- Supportive
- Engaging

**Communication Style**:
- Concise and actionable
- Uses bullet points
- Includes emojis (🚙 🏔️ ⚠️ 🧭)
- Asks follow-up questions
- Provides context-aware advice

**Safety First**:
- Always prioritizes user safety
- Warns about dangerous conditions
- Recommends proper equipment
- Suggests turning back when unsafe
- Provides emergency contacts

---

## 📊 Context System

### What Context Includes

```typescript
interface GuideContext {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTrail?: Trail;
  weather?: WeatherData;
  vehicleType?: string;
  experienceLevel?: string;
  recentActivities?: string[];
  userPreferences?: {
    difficulty?: string;
    terrain?: string;
    distance?: string;
  };
}
```

### How Context is Used

The AI Guide uses context to:
1. **Personalize recommendations** based on vehicle and experience
2. **Assess safety** considering weather and location
3. **Suggest appropriate trails** matching preferences
4. **Provide relevant tips** for current conditions
5. **Prioritize warnings** based on real-time data

---

## 🚨 Safety Features

### Emergency Situations

The AI Guide can help with:
- **Vehicle Issues**: Stuck, breakdown, flat tire
- **Medical**: Injuries, dehydration, heat exhaustion
- **Navigation**: Lost, off-trail, wrong turn
- **Weather**: Storms, flash floods, extreme heat
- **Equipment**: Broken winch, damaged suspension

### Safety Priorities

1. **Immediate Danger**: Call 911 first
2. **Assessment**: Evaluate situation
3. **Communication**: Contact emergency contacts
4. **Shelter**: Stay with vehicle if safe
5. **Resources**: Use emergency supplies

### When to Call 911

The AI Guide will recommend calling 911 for:
- Serious injuries
- Life-threatening situations
- Vehicle fires
- Severe weather danger
- Complete vehicle failure in remote areas

---

## 💡 Example Conversations

### Trail Recommendation

**User**: "I'm looking for a moderate trail near Moab"

**Trail Buddy**: "🏔️ Great choice! Based on your location and Jeep Wrangler, I'd recommend:

• **Hell's Revenge** - Moderate, 6.5 miles, iconic slickrock
• **Fins & Things** - Moderate, 4 miles, scenic views
• **Poison Spider Mesa** - Moderate-Hard, 8 miles, technical sections

All three are perfect for your skill level. Hell's Revenge is the most popular and has great photo spots!

Which one sounds interesting? I can give you more details about any of them. 🚙"

### Safety Advice

**User**: "Is it safe to go out today?"

**Trail Buddy**: "⚠️ Let me check current conditions for you:

**Weather**: Clear, 85°F, low humidity
**Wind**: 5 mph - excellent conditions
**Forecast**: Stable through evening

✅ **Safe to go!** Conditions are ideal for off-roading.

**Quick tips for today**:
• Bring extra water (hot temps)
• Apply sunscreen
• Start early to avoid afternoon heat
• Check trail conditions before heading out

What trail are you thinking about? 🌤️"

### Emergency Help

**User**: "My Jeep is stuck in sand"

**Trail Buddy**: "🚙 Don't worry, I'll help you get unstuck! Here's what to do:

**Immediate Steps**:
1. Stop trying to drive - you'll dig deeper
2. Assess the situation safely
3. Check all four wheels

**Recovery Process**:
1. **Lower tire pressure** to 15-18 PSI for better traction
2. **Clear sand** from around tires
3. **Place traction aids** (boards, rocks, or mats) under tires
4. **Rock the vehicle** - gentle forward/reverse
5. **Use recovery boards** if you have them

**If still stuck**:
• Call for help (tow service or fellow off-roaders)
• Share your location
• Stay with vehicle

Do you have recovery boards or a shovel? I can give specific advice based on your equipment. 🛠️"

---

## 🎯 Best Practices

### For Users

1. **Be Specific**: "Recommend trails for my stock Jeep Wrangler" vs "Find trails"
2. **Provide Context**: Mention weather, time, experience level
3. **Ask Follow-ups**: Get detailed information about recommendations
4. **Use for Planning**: Trip planning, route selection, timing
5. **Emergency Ready**: Know how to access emergency guidance

### For Developers

1. **Update Context**: Keep location, weather, and trail info current
2. **Handle Errors**: Graceful fallbacks when API is unavailable
3. **Rate Limiting**: Implement request throttling
4. **Cache Responses**: Store common answers locally
5. **Monitor Usage**: Track API costs and usage patterns

---

## 🔒 Privacy & Security

### Data Handling

- **No Personal Data Stored**: Conversations are not saved long-term
- **Context Only**: Only current session context is sent to API
- **Location Privacy**: Location data used only for recommendations
- **API Security**: API key secured in environment variables

### User Control

- **Clear Conversation**: Users can reset chat anytime
- **Opt-out**: AI Guide is optional feature
- **Offline Mode**: App works without AI Guide
- **Data Transparency**: Users know what data is shared

---

## 💰 Cost Management

### OpenAI Pricing (gpt-4o-mini)

- **Input**: $0.150 per 1M tokens
- **Output**: $0.600 per 1M tokens

### Estimated Costs

- **Average conversation**: ~500 tokens = $0.0004
- **100 users/day**: ~$0.04/day = $1.20/month
- **1000 users/day**: ~$0.40/day = $12/month

### Optimization Tips

1. **Limit context**: Only send relevant information
2. **Cache suggestions**: Reuse common recommendations
3. **Shorter responses**: Set max_tokens appropriately
4. **Rate limiting**: Prevent abuse
5. **Monitor usage**: Track costs in OpenAI dashboard

---

## 🐛 Troubleshooting

### AI Guide Not Available

**Problem**: `aiGuideService.isAvailable()` returns false

**Solutions**:
- Check OpenAI API key in `.env`
- Verify API key is valid
- Check internet connection
- Review API quota/billing

### Slow Responses

**Problem**: AI takes too long to respond

**Solutions**:
- Check network speed
- Reduce context size
- Lower max_tokens
- Use gpt-4o-mini instead of gpt-4

### Poor Recommendations

**Problem**: AI gives irrelevant suggestions

**Solutions**:
- Update context with current data
- Provide more specific questions
- Include user preferences
- Update system prompt

### API Errors

**Problem**: Getting 429 or 500 errors

**Solutions**:
- Check API quota
- Implement retry logic
- Add rate limiting
- Verify API key permissions

---

## 🚀 Future Enhancements

### Planned Features

1. **Voice Input/Output** - Hands-free operation
2. **Offline Mode** - Cached responses for common questions
3. **Multi-language** - Support for Spanish, French, etc.
4. **Image Analysis** - Analyze trail photos for conditions
5. **Group Planning** - Coordinate convoy trips
6. **Learning** - Improve based on user feedback
7. **Integration** - Connect with more data sources
8. **Proactive Alerts** - Send warnings before issues

### Advanced Capabilities

- **Real-time tracking** during adventures
- **Predictive maintenance** warnings
- **Social features** - Share AI recommendations
- **Custom personalities** - Different guide styles
- **Expert mode** - Technical off-road advice

---

## 📚 API Reference

### aiGuideService Methods

```typescript
// Check availability
isAvailable(): boolean

// Update context
updateContext(context: Partial<GuideContext>): void

// Get current context
getContext(): GuideContext

// Clear conversation history
clearConversation(): void

// Send chat message
chat(userMessage: string): Promise<string>

// Get smart suggestions
getSmartSuggestions(): Promise<GuideSuggestion[]>

// Get trail recommendations
getTrailRecommendations(trails: Trail[], limit?: number): Promise<Trail[]>

// Analyze trail safety
analyzeTrailSafety(trail: Trail): Promise<{
  safetyScore: number;
  warnings: string[];
  recommendations: string[];
}>

// Get quick tip
getQuickTip(): Promise<string>

// Get emergency guidance
getEmergencyGuidance(situation: string): Promise<string>

// Generate trip plan
generateTripPlan(
  destination: string,
  duration: string,
  preferences: string[]
): Promise<string>
```

---

## 📖 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-4 Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [React Native Chat UI](https://reactnative.dev/docs/flatlist)

---

## ✅ Implementation Checklist

- [x] Create AI Guide service
- [x] Build chat interface
- [x] Add to navigation
- [x] Implement context system
- [x] Add smart suggestions
- [x] Create quick actions
- [x] Add emergency guidance
- [x] Write documentation
- [ ] Add voice input (future)
- [ ] Add offline mode (future)
- [ ] Implement analytics (future)

---

**Last Updated**: AI Guide v1.0
**Status**: ✅ Ready for use with OpenAI API key
**Model**: gpt-4o-mini
**Features**: Chat, Recommendations, Safety Analysis, Emergency Guidance
