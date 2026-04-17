const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// ENV
// =========================
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.warn("⚠️ Missing PEXELS_API_KEY in environment variables");
}

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("Faceless AI Video Generator Running 🚀");
});

// =========================
// BREAK TEXT INTO SCENES
// =========================
function createScenes(text) {
  const sentences = text
    .split(".")
    .map(s => s.trim())
    .filter(Boolean);

  return sentences.slice(0, 5).map(sentence => ({
    scene: sentence
  }));
}

// =========================
// GET STOCK VIDEO (PEXELS)
// =========================
async function getVideo(query) {
  try {
    const res = await axios.get(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      }
    );

    const video = res.data.videos?.[0];

    if (!video || !video.video_files?.length) return null;

    return video.video_files[0].link;

  } catch (err) {
    console.error("Pexels error:", err.message);
    return null;
  }
}

// =========================
// MAIN API
// =========================
app.post("/generate-video", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 5) {
      return res.status(400).json({
        error: "Please provide valid text"
      });
    }

    // 1. Create scenes
    const scenes = createScenes(text);

    // 2. Fetch videos for each scene
    const results = [];

    for (let s of scenes) {
      // better keyword extraction
      const keyword = s.scene.split(" ").slice(0, 3).join(" ");

      const video = await getVideo(keyword);

      results.push({
        text: s.scene,
        keyword,
        video: video || "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
      });
    }

    // 3. Return response
    res.json({
      success: true,
      scenes: results
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
