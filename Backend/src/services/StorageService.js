const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
// StorageService — S3-ready abstraction
// Currently implements LocalStorageService.
// Swap to S3StorageService later without touching any other code.
// ─────────────────────────────────────────────

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

const uploadFile = (file) => {
  // File already saved by Multer — just return the path
  return `/${UPLOAD_DIR}/${file.filename}`;
};

const deleteFile = (fileUrl) => {
  const filePath = path.join(__dirname, '../../', fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getFileUrl = (filename) => {
  return `/${UPLOAD_DIR}/${filename}`;
};

module.exports = { uploadFile, deleteFile, getFileUrl };
