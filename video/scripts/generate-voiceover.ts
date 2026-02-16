import { ElevenLabsClient } from "elevenlabs";
import * as fs from "fs";
import * as path from "path";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("Error: ELEVENLABS_API_KEY environment variable is required");
  console.error("Get your API key from: https://elevenlabs.io/");
  process.exit(1);
}

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

// Voiceover script synced to video scenes
const voiceoverScript = `
ChatGPT Upload Guard.
Protect your AI conversations from hidden threats.
When you upload a document, we scan it in real-time for prompt injections and malicious content.
One hundred percent local. AI-powered. Real-time. Privacy first.
Stay protected. Install free on Chrome today.
`.trim();

async function generateVoiceover() {
  console.log("Generating voiceover with ElevenLabs...");

  const audioStream = await client.textToSpeech.convert("21m00Tcm4TlvDq8ikWAM", {
    text: voiceoverScript,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
    },
  });

  const outputDir = path.join(__dirname, "../public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "voiceover.mp3");
  const writeStream = fs.createWriteStream(outputPath);

  for await (const chunk of audioStream) {
    writeStream.write(chunk);
  }

  writeStream.end();

  console.log(`Voiceover saved to: ${outputPath}`);
  console.log("\nNext steps:");
  console.log("1. Preview the video: npm run dev");
  console.log("2. Render final video: npm run build");
}

generateVoiceover().catch(console.error);
