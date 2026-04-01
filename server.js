// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Make sure videos directory exists
const videosDir = path.join(__dirname, "videos");
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);

// POST /generate-text-video
app.post("/generate-text-video", async (req, res) => {
  try {
    let { text } = req.body;

    if (!text) return res.status(400).json({ error: "No text provided" });

    // Sanitize text for FFmpeg
    const safeText = text.substring(0, 300).replace(/['":]/g, "");

    const timestamp = Date.now();
    const outputFile = path.join(videosDir, `movie_${timestamp}.mp4`);

    // FFmpeg command: black background, draw text
    const ffmpegCmd = `ffmpeg -y -f lavfi -i color=c=black:s=1280x720:d=6 -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${safeText}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2" ${outputFile}`;

    exec(ffmpegCmd, (error) => {
      if (error) {
        console.error("FFmpeg error:", error);
        return res.status(500).json({ error: "Video generation failed" });
      }

      // Return public URL of video
      const videoUrl = `${req.protocol}://${req.get("host")}/videos/movie_${timestamp}.mp4`;
      res.json({ videoUrl });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Serve videos statically
app.use("/videos", express.static(videosDir));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
