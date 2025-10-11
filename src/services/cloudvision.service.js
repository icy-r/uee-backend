/**
 * Tesseract OCR Service
 * Free, open-source fallback OCR service when Gemini Vision fails or quota is exceeded
 * No API keys or billing required - runs locally
 */

class TesseractOCRService {
  constructor() {
    this.enabled = false;
    this.tesseract = null;
    
    // Try to initialize Tesseract
    try {
      this.tesseract = require('tesseract.js');
      this.enabled = true;
      console.log('✅ Tesseract OCR initialized as free fallback');
    } catch (error) {
      console.log('ℹ️  Tesseract OCR not available (npm install tesseract.js to enable)');
    }
  }

  /**
   * Check if Tesseract is available
   */
  isAvailable() {
    return this.enabled && this.tesseract !== null;
  }

  /**
   * Extract text from image using Tesseract OCR
   * Free, open-source fallback for Gemini Vision failures
   */
  async extractTextFromImage(imageData) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Tesseract OCR not available (run: npm install tesseract.js)',
        extractedText: '',
        confidence: 0,
        method: 'tesseract-unavailable'
      };
    }

    try {
      const { filePath, filename, documentId } = imageData;

      if (!filePath) {
        throw new Error('File path is required for text extraction');
      }

      console.log(`🔍 Tesseract OCR processing: ${filename}...`);

      // Perform OCR using Tesseract
      const { data } = await this.tesseract.recognize(
        filePath,
        'eng', // English language (can be configured for multiple languages: 'eng+spa+fra')
        {
          logger: info => {
            // Optional: log progress
            if (info.status === 'recognizing text') {
              console.log(`Tesseract progress: ${Math.round(info.progress * 100)}%`);
            }
          }
        }
      );

      const extractedText = data.text;
      const confidence = data.confidence / 100; // Tesseract returns 0-100, normalize to 0-1

      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: true,
          extractedText: '',
          confidence: 0,
          method: 'tesseract-ocr',
          message: 'No text detected in image',
          documentId
        };
      }

      console.log(`✅ Tesseract OCR extracted text from ${filename}: ${extractedText.length} characters (confidence: ${Math.round(confidence * 100)}%)`);

      return {
        success: true,
        extractedText: extractedText.trim(),
        confidence: confidence,
        method: 'tesseract-ocr',
        processedAt: new Date(),
        documentId
      };
    } catch (error) {
      console.error('Tesseract OCR text extraction error:', error.message);
      
      return {
        success: false,
        error: error.message,
        extractedText: '',
        confidence: 0,
        method: 'tesseract-ocr'
      };
    }
  }

  /**
   * Extract text with language detection
   * Tesseract supports 100+ languages
   */
  async extractTextWithLanguages(imageData, languages = 'eng') {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Tesseract OCR not available'
      };
    }

    try {
      const { filePath, filename } = imageData;

      const { data } = await this.tesseract.recognize(
        filePath,
        languages, // e.g., 'eng+spa+fra' for English, Spanish, French
        {}
      );

      return {
        success: true,
        extractedText: data.text.trim(),
        confidence: data.confidence / 100,
        language: languages,
        method: 'tesseract-ocr'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TesseractOCRService();

