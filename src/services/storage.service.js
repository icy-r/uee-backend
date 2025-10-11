const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Storage Service for DigitalOcean Spaces
 * Handles file operations in S3-compatible object storage
 */
class StorageService {
  constructor() {
    this.spacesEndpoint = process.env.SPACES_ENDPOINT || 'sfo3.digitaloceanspaces.com';
    this.bucketName = process.env.SPACES_BUCKET || 'uee';
    this.region = process.env.SPACES_REGION || 'sfo3';
    this.cdnEnabled = process.env.SPACES_CDN_ENABLED === 'true';
    this.cdnEndpoint = process.env.SPACES_CDN_ENDPOINT || 'https://uee.sfo3.cdn.digitaloceanspaces.com';
    
    // Initialize S3 client for DigitalOcean Spaces
    // Use path-style URLs for buckets with dots (SSL compatibility)
    const usePathStyle = this.bucketName.includes('.');
    
    this.s3Client = new S3Client({
      endpoint: `https://${this.spacesEndpoint}`,
      region: this.region,
      credentials: {
        accessKeyId: process.env.SPACES_KEY,
        secretAccessKey: process.env.SPACES_SECRET
      },
      forcePathStyle: usePathStyle
    });
  }

  /**
   * Check if storage service is properly configured
   */
  isConfigured() {
    return !!(process.env.SPACES_KEY && process.env.SPACES_SECRET);
  }

  /**
   * Upload file to Spaces
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} key - File path/key in the bucket
   * @param {string} contentType - MIME type of the file
   * @param {boolean} isPublic - Whether file should be publicly accessible
   */
  async uploadFile(fileBuffer, key, contentType, isPublic = true) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : 'private'
    });

    await this.s3Client.send(command);
    return this.getFileUrl(key);
  }

  /**
   * Delete file from Spaces
   * @param {string} key - File path/key in the bucket
   */
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    await this.s3Client.send(command);
    return true;
  }

  /**
   * Get public URL for a file
   * @param {string} key - File path/key in the bucket
   */
  getFileUrl(key) {
    if (this.cdnEnabled && this.cdnEndpoint) {
      return `${this.cdnEndpoint}/${key}`;
    }
    
    // Use path-style URLs for buckets with dots (SSL compatibility)
    if (this.bucketName.includes('.')) {
      return `https://${this.spacesEndpoint}/${this.bucketName}/${key}`;
    }
    
    // Use virtual-hosted-style URLs for simple bucket names
    return `https://${this.bucketName}.${this.spacesEndpoint}/${key}`;
  }

  /**
   * Get signed URL for private file access
   * @param {string} key - File path/key in the bucket
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Extract key from full URL
   * @param {string} url - Full Spaces URL
   */
  extractKeyFromUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch (error) {
      // If URL parsing fails, assume it's already a key
      return url;
    }
  }
}

module.exports = new StorageService();

