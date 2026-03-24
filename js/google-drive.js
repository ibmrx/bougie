<script>
    // Make sure Google Drive functions are globally available
    window.ensureGoogleDrive = function() {
        if (!window.GoogleDrive) {
            console.log('Waiting for Google Drive to load...');
            setTimeout(window.ensureGoogleDrive, 500);
            return;
        }
        
        if (!window.GoogleDrive.isSignedIn()) {
            window.GoogleDrive.signIn();
        } else {
            alert('Already connected to Google Drive');
        }
    };
    
    // Add a manual trigger if needed
    document.addEventListener('click', function(e) {
        if (e.target.closest('.google-drive-connect')) {
            e.preventDefault();
            if (window.GoogleDrive) {
                window.GoogleDrive.signIn();
            } else {
                alert('Google Drive is loading, please wait...');
            }
        }
    });
</script>
