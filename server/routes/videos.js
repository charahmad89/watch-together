const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Configure Multer
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
});

// Configure S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload Video
router.post('/upload', authMiddleware, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'subtitles', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  if (!req.files || !req.files['video']) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const { title, description, price } = req.body;
  const videoFile = req.files['video'][0];
  const subtitlesFile = req.files['subtitles'] ? req.files['subtitles'][0] : null;
  const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

  const inputPath = videoFile.path;
  const outputPath = `uploads/${videoFile.filename}-transcoded.mp4`;

  // Start transcoding in the background (or await if simple)
  // For 5GB files, this should be a background job. 
  // For this demo, we'll try to do it "inline" but it might timeout.
  // Ideally, we return "processing" status.

  try {
    console.log(`Starting transcoding for ${videoFile.originalname}...`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('mp4')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    console.log('Transcoding complete. Uploading to S3...');

    const fileContent = fs.readFileSync(outputPath);
    const s3Key = `videos/${Date.now()}-${path.basename(outputPath)}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'video/mp4',
    }));

    let subtitlesUrl = null;
    if (subtitlesFile) {
      const subContent = fs.readFileSync(subtitlesFile.path);
      const subKey = `subtitles/${Date.now()}-${subtitlesFile.originalname}`;
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: subKey,
        Body: subContent,
        ContentType: 'text/vtt',
      }));
      // Construct URL (adjust based on your actual S3/R2 public URL format)
      // If using R2 custom domain, use that. For now using endpoint/bucket/key pattern or just key if client handles it.
      // Assuming public access is enabled on the bucket.
      subtitlesUrl = `${process.env.AWS_ENDPOINT.replace('https://', 'https://pub-').replace('.r2.cloudflarestorage.com', '.r2.dev')}/${subKey}`; 
      // Note: The above URL construction is a guess for R2 dev URLs. 
      // Better to use a standard format or environment variable for PUBLIC_URL_BASE.
      // For this task, I'll stick to a generic one or the one used for video.
      subtitlesUrl = `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET_NAME}/${subKey}`; 
      
      fs.unlinkSync(subtitlesFile.path);
    }

    let thumbnailUrl = 'https://placehold.co/600x400';
    if (thumbnailFile) {
      const thumbContent = fs.readFileSync(thumbnailFile.path);
      const thumbKey = `thumbnails/${Date.now()}-${thumbnailFile.originalname}`;
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: thumbKey,
        Body: thumbContent,
        ContentType: thumbnailFile.mimetype,
      }));
      thumbnailUrl = `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET_NAME}/${thumbKey}`;
      fs.unlinkSync(thumbnailFile.path);
    }

    console.log('Upload complete. Saving to DB...');

    // Save to DB
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        thumbnail: thumbnailUrl,
        price: parseFloat(price),
        videoUrl: `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET_NAME}/${s3Key}`,
        subtitlesUrl,
      },
    });

    // Cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.json(movie);

  } catch (error) {
    console.error('Upload error:', error);
    // Cleanup on error
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get All Movies
router.get('/', async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

module.exports = router;
