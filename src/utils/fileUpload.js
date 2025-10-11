const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');

// Initialize S3 client for DigitalOcean Spaces
// Use path-style URLs for buckets with dots (SSL compatibility)
const bucketName = process.env.SPACES_BUCKET || 'uee';
const usePathStyle = bucketName.includes('.');

const s3Client = new S3Client({
  endpoint: `https://${process.env.SPACES_ENDPOINT || 'sfo3.digitaloceanspaces.com'}`,
  region: process.env.SPACES_REGION || 'sfo3',
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
  },
  forcePathStyle: usePathStyle
});

// Configure storage
const storage = multerS3({
  s3: s3Client,
  bucket: bucketName,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const projectId = req.body.projectId || 'default';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.originalname;
    const key = `${projectId}/${filename}`;
    cb(null, key);
  },
  metadata: function (req, file, cb) {
    cb(null, {
      originalName: file.originalname,
      uploadedBy: req.user?.uid || 'anonymous'
    });
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;

