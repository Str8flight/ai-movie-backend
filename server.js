// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.send("AI Movie Backend Running 🚀");
});

// =======================
// TEMP STORAGE (RAILWAY SAFE)
// =======================
const tmpDir = "/tmp";
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// =======================
// TEST FFmpeg
// =======================
app.get("/test-ffmpeg", (req, res) => {
  exec("ffmpeg -version", (err, stdout, stderr) => {
    if (err) return res.status(500).send("FFmpeg not working");
    res.send(stdout);
  });
});

// =======================
// MAIN VIDEO GENERATOR
// =======================
app.post("/generate-text-video", (req, res) => {
  try {
    let { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Clean text (VERY IMPORTANT for FFmpeg safety)
    const safeText = text
      .substring(0, 500)
      .replace(/['":]/g, "")
      .replace(/\n/g, " ");

    const fileName = `movie_${Date.now()}.mp4`;
    const outputFile = path.join(tmpDir, fileName);

    // =======================
    // FFmpeg COMMAND (CLEAN + RAILWAY SAFE)
    // =======================
    const ffmpegCmd = `
      ffmpeg -y
      -f lavfi -i color=c=black:s=1280x720:d=6
      -vf "drawtext=text='${safeText}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2"
      ${outputFile}
    `;

    console.log("Running FFmpeg...");

    exec(ffmpegCmd, (error, stdout, stderr) => {
      if (error) {
        console.error("FFMPEG ERROR:", error);
        console.error(stderr);

        return res.status(500).json({
          error: "Video generation failed",
          details: stderr
        });
      }

      console.log("Video created:", outputFile);

      const videoUrl = `${req.protocol}://${req.get("host")}/video/${fileName}`;

      return res.json({
        success: true,
        videoUrl
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crash" });
  }
});

// =======================
// SERVE GENERATED VIDEOS
// =======================
app.use("/video", express.static(tmpDir));

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
