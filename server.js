const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("Faceless AI Video Generator Running 🚀");
});

// =========================
// 1. SIMPLE SCRIPT BREAKDOWN
// =========================
function createScenes(text) {
  const sentences = text.split(".").filter(s => s.trim().length > 0);

  return sentences.slice(0, 5).map(s => ({
    scene: s.trim()
  }));
}

// =========================
// 2. GET STOCK VIDEO
// =========================
async function getVideo(query) {
  try {
    const res = await axios.get(
      `https://api.pexels.com/videos/search?query=${query}&per_page=1`,
      {
        headers: {
          Authorization: G49eaKSng9cfPcACHhRSi794clGA6iWOKaD5CIaCjnEJvJFlIFEnRE7I
        }
      }
    );

    const video = res.data.videos[0];
    return video?.video_files[0]?.link || null;

  } catch (err) {
    console.error(err);
    return null;
  }
}

// =========================
// MAIN API
// =========================
app.post("/generate-video", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "No text" });

    // 1. Create scenes
    const scenes = createScenes(text);

    // 2. Get stock videos for each scene
    const results = [];

    for (let s of scenes) {
      const video = await getVideo(s.scene);

      results.push({
        text: s.scene,
        video: video
      });
    }

    // 3. Return scene-based video list
    res.json({
      success: true,
      scenes: results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server running on", PORT));
