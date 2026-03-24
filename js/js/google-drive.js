// In your application form
async function uploadDocuments() {
    const files = [
        { file: passportFile, documentType: 'passport' },
        { file: photoFile, documentType: 'photo' },
        // ... more files
    ];
    
    const results = await GoogleDrive.uploadMultiple(
        files, 
        applicationNumber,
        (completed, total, docType, result) => {
            console.log(`Uploaded ${docType}: ${completed}/${total}`);
        }
    );
    
    // Store file URLs in application data
    applicationData.documentUrls = results;
}
