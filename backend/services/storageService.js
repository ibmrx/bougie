const supabase = require('../config/database');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class StorageService {
  async uploadDocument(file, applicationNumber, documentType) {
    try {
      let fileBuffer = file.buffer;
      let contentType = file.mimetype;
      
      // Compress images if they're photos
      if (file.mimetype.startsWith('image/')) {
        fileBuffer = await sharp(fileBuffer)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        contentType = 'image/jpeg';
      }
      
      // Generate unique filename
      const extension = file.originalname.split('.').pop();
      const filename = `${applicationNumber}/${documentType}_${uuidv4()}.${extension}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filename, fileBuffer, {
          contentType: contentType,
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);
      
      return {
        url: publicUrl,
        path: data.path,
        documentType: documentType
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
  
  async uploadMultipleDocuments(files, applicationNumber, documentTypes) {
    const uploadPromises = [];
    
    for (const [index, file] of files.entries()) {
      const documentType = documentTypes[index];
      uploadPromises.push(this.uploadDocument(file, applicationNumber, documentType));
    }
    
    const results = await Promise.all(uploadPromises);
    return results;
  }
  
  async deleteDocuments(applicationNumber) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list(applicationNumber);
      
      if (data && data.length > 0) {
        const filesToDelete = data.map(file => `${applicationNumber}/${file.name}`);
        await supabase.storage
          .from('documents')
          .remove(filesToDelete);
      }
      
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
}

module.exports = new StorageService();
