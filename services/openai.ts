import { Alert } from "react-native";
import { OpenAIProxyError, requestOpenAIProxy } from "@/services/openaiProxy";

export interface RecoveryAnalysis {
  situation: string;
  severity: "low" | "moderate" | "high" | "critical";
  recommendations: string[];
  requiredEquipment: string[];
  safetyWarnings: string[];
  estimatedDifficulty: string;
}

export async function analyzeRecoverySituation(
  imageUri: string,
): Promise<RecoveryAnalysis> {
  try {
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);
    const response = await requestOpenAIProxy<{
      analysis: RecoveryAnalysis;
    }>({
      operation: "recovery",
      imageBase64: base64Image,
    });
    const analysis = response.analysis;

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
    console.error("AI scan error:", error);
    if (
      error instanceof OpenAIProxyError &&
      (error.status === 401 || error.status === 403)
    ) {
      Alert.alert(
        "Premium Feature",
        "AI Recovery Analysis requires an active premium subscription.",
      );
    } else if (error instanceof OpenAIProxyError && error.status === 429) {
      Alert.alert(
        "AI Scan Busy",
        "Too many AI requests right now. Please try again later.",
      );
    }
    throw new Error(
      error.message || "Failed to analyze image. Please try again.",
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
