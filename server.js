const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { exec } = require("child_process");

const app = express();
app.use(cors());

// create folders
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("videos")) fs.mkdirSync("videos");

app.use("/videos", express.static("videos"));

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);

    const text = data.text.substring(0, 200).replace(/:/g, "");

    const output = `videos/movie_${Date.now()}.mp4`;

    const cmd = `ffmpeg -f lavfi -i color=c=black:s=1280x720:d=6 -vf "drawtext=text='${text}':fontcolor=white:x=50:y=300" ${output}`;

    exec(cmd, (err) => {
      if (err) return res.status(500).send("Error");

      res.json({
        videoUrl: `${req.protocol}://${req.get("host")}/${output}`,
      });
    });

  } catch (err) {
    res.status(500).send("Processing error");
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running...");
});
