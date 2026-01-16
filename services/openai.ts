import { Alert } from "react-native";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface RecoveryAnalysis {
  situation: string;
  severity: "low" | "moderate" | "high" | "critical";
  recommendations: string[];
  requiredEquipment: string[];
  safetyWarnings: string[];
  estimatedDifficulty: string;
}

export async function analyzeRecoverySituation(
  imageUri: string
): Promise<RecoveryAnalysis> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file."
    );
  }

  try {
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert off-road vehicle recovery specialist. Analyze images of stuck or disabled vehicles and provide detailed recovery recommendations. 

Your response must be in JSON format with this exact structure:
{
  "situation": "Brief description of what you see",
  "severity": "low|moderate|high|critical",
  "recommendations": ["Step 1", "Step 2", "Step 3"],
  "requiredEquipment": ["Equipment item 1", "Equipment item 2"],
  "safetyWarnings": ["Warning 1", "Warning 2"],
  "estimatedDifficulty": "Easy|Moderate|Difficult|Expert"
}

Focus on:
- Vehicle position and angle
- Terrain type (mud, sand, rock, snow)
- Obstacles and hazards
- Best recovery approach
- Safety considerations`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this off-road recovery situation and provide detailed recommendations.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `OpenAI API error: ${response.status}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI API");
    }

    // Parse JSON response
    const analysis: RecoveryAnalysis = JSON.parse(content);

    // Validate response structure
    if (
      !analysis.situation ||
      !analysis.severity ||
      !analysis.recommendations ||
      !analysis.requiredEquipment
    ) {
      throw new Error("Invalid response format from AI");
    }

    return analysis;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(
      error.message || "Failed to analyze image. Please try again."
    );
  }
}

async function convertImageToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64data.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process image");
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "low":
      return "#10b981"; // green
    case "moderate":
      return "#f59e0b"; // yellow
    case "high":
      return "#ef4444"; // red
    case "critical":
      return "#dc2626"; // dark red
    default:
      return "#6b7280"; // gray
  }
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "low":
      return "Low Risk";
    case "moderate":
      return "Moderate Risk";
    case "high":
      return "High Risk";
    case "critical":
      return "Critical - Professional Help Recommended";
    default:
      return "Unknown";
  }
}
