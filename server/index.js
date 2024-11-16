import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import YouTube from "youtube-sr";
import ytdl from "ytdl-core";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hi from Opattu!");
});

app.post("/fetchSongURL", async (req, res) => {
  try {
    const { title, artistsName } = req.body;

    if (!title || !artistsName) {
      return res
        .status(400)
        .json({ error: "Title and artist name are required." });
    }

    const searchData = await YouTube.default.search(
      `${title}, ${artistsName}`,
      {
        type: "video",
        limit: 7,
      }
    );

    if (!searchData || searchData.length === 0) {
      return res.status(404).json({ error: "No matching video found." });
    }

    const dataObj = searchData.find(
      (data) => data.duration <= 450000 && data.duration >= 180000
    );

    if (!dataObj) {
      return res
        .status(404)
        .json({ error: "No video within the desired duration found." });
    }

    const songInfo = await ytdl.getInfo(dataObj.url);
    const format = ytdl.chooseFormat(songInfo.formats, { filter: "audioonly" });

    if (!format || !format.url) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve audio format." });
    }

    res.json({ url: format.url });
  } catch (error) {
    console.error("fetchSongURL Error", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the song URL." });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
