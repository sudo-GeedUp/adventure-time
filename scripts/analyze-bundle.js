#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorLog(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

// Bundle size thresholds (in bytes)
const THRESHOLDS = {
  warning: 5 * 1024 * 1024, // 5MB
  error: 10 * 1024 * 1024, // 10MB
};

async function analyzeBundle(platform = "all") {
  colorLog("bright", "\n🔍 Analyzing Bundle Size...\n");

  try {
    // Clean previous builds
    colorLog("yellow", "Cleaning previous builds...");
    execSync("npx expo export --platform web --clear", { stdio: "inherit" });

    const platforms =
      platform === "all" ? ["web", "ios", "android"] : [platform];
    const results = {};

    for (const p of platforms) {
      colorLog("cyan", `\nAnalyzing ${p.toUpperCase()} bundle...`);

      if (p === "web") {
        // Analyze web bundle
        const distPath = path.join(__dirname, "../dist");
        const mainBundle = path.join(distPath, "index.html");

        if (fs.existsSync(mainBundle)) {
          const stats = fs.statSync(mainBundle);
          const bundleSize = stats.size;

          // Find JS bundles
          const jsFiles = fs
            .readdirSync(distPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".map"))
            .map((file) => {
              const filePath = path.join(distPath, file);
              const fileStats = fs.statSync(filePath);
              return {
                name: file,
                size: fileStats.size,
                sizeFormatted: formatBytes(fileStats.size),
              };
            })
            .sort((a, b) => b.size - a.size);

          results[p] = {
            totalSize: bundleSize,
            totalSizeFormatted: formatBytes(bundleSize),
            files: jsFiles,
          };

          // Display results
          colorLog("bright", `\n${p.toUpperCase()} Bundle Results:`);
          colorLog("blue", `Total bundle size: ${formatBytes(bundleSize)}`);

          // Check thresholds
          if (bundleSize > THRESHOLDS.error) {
            colorLog(
              "red",
              `⚠️  Bundle size exceeds recommended limit (${formatBytes(
                THRESHOLDS.error,
              )})`,
            );
          } else if (bundleSize > THRESHOLDS.warning) {
            colorLog(
              "yellow",
              `⚠️  Bundle size is large (${formatBytes(THRESHOLDS.warning)})`,
            );
          } else {
            colorLog("green", "✅ Bundle size is within recommended limits");
          }

          // Show largest files
          colorLog("\ncyan", "Largest files:");
          jsFiles.slice(0, 5).forEach((file) => {
            const percentage = ((file.size / bundleSize) * 100).toFixed(1);
            colorLog(
              "bright",
              `  ${file.name}: ${file.sizeFormatted} (${percentage}%)`,
            );
          });
        }
      } else {
        // For native platforms, we'd need to build and analyze the APK/IPA
        colorLog(
          "yellow",
          `Native bundle analysis for ${p} requires full build. Run:`,
        );
        colorLog("cyan", `  eas build --platform ${p} --profile production`);
      }
    }

    // Generate report
    generateReport(results);
  } catch (error) {
    colorLog("red", `Error analyzing bundle: ${error.message}`);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function generateReport(results) {
  const reportPath = path.join(__dirname, "../bundle-analysis-report.json");
  const report = {
    timestamp: new Date().toISOString(),
    thresholds: THRESHOLDS,
    results,
    recommendations: generateRecommendations(results),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  colorLog("\ngreen", `\n📊 Report saved to: bundle-analysis-report.json`);
}

function generateRecommendations(results) {
  const recommendations = [];

  for (const [platform, data] of Object.entries(results)) {
    if (data.totalSize > THRESHOLDS.error) {
      recommendations.push({
        platform,
        priority: "high",
        message: "Consider code splitting and lazy loading for large modules",
        details: `Bundle size (${formatBytes(
          data.totalSize,
        )}) significantly exceeds recommended limit`,
      });
    }

    // Check for large files
    if (data.files) {
      const largeFiles = data.files.filter((file) => file.size > 1024 * 1024); // > 1MB
      if (largeFiles.length > 0) {
        recommendations.push({
          platform,
          priority: "medium",
          message: "Found large files that could be optimized",
          details: largeFiles
            .map((f) => `${f.name}: ${f.sizeFormatted}`)
            .join(", "),
        });
      }
    }
  }

  // General recommendations
  recommendations.push(
    {
      platform: "all",
      priority: "low",
      message: "Consider using image optimization for better performance",
      details: "Optimize images and consider using WebP format",
    },
    {
      platform: "all",
      priority: "low",
      message: "Enable gzip compression on your server",
      details: "Can reduce bundle size by up to 70%",
    },
  );

  return recommendations;
}

// CLI interface
const args = process.argv.slice(2);
const platform =
  args.find((arg) => arg.startsWith("--platform="))?.split("=")[1] || "all";

analyzeBundle(platform);
