const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const port = 3000;

app.use(cors());

// Uploads और Converted Files के लिए फोल्डर बनाओ
const uploadDir = path.join(__dirname, "uploads");
const filesDir = path.join(__dirname, "converted");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir);

// File Upload करने का System
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ✅ LibreOffice का पूरा Path सेट करें (Windows के लिए)
const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

// File Convert करने का API
app.post("/convert", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "कोई फाइल अपलोड नहीं हुई" });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(filesDir, `${path.parse(req.file.originalname).name}.pdf`);

    // ✅ अब सही Command Windows पर चलेगी!
    const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${filesDir}" "${inputPath}"`;

    exec(command, (err) => {
        if (err) {
            console.error("Error converting file:", err);
            return res.status(500).json({ message: "फाइल कन्वर्शन में दिक्कत हुई" });
        }

        res.download(outputPath, (err) => {
            if (err) console.error("Download Error:", err);
            fs.unlinkSync(inputPath);  // Upload की गई फाइल Delete करो
            fs.unlinkSync(outputPath); // Converted फाइल Delete करो
        });
    });
});

app.listen(port, () => {
    console.log(`🚀 Server चल रहा है: http://localhost:${port}`);
});
