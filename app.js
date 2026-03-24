const supabaseUrl = 'https://qpprzcckolmdyabnmgol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So'; // Use Anon Key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentStep = 1;
const urlParams = new URLSearchParams(window.location.search);
const destination = urlParams.get('dest');

// 1. Navigation Logic
function nextStep() {
    document.getElementById(`step-${currentStep}`).classList.add('step-hidden');
    currentStep++;
    document.getElementById(`step-${currentStep}`).classList.remove('step-hidden');
}

// 2. File Upload Function
async function uploadFile(file, studentName, folder) {
    const fileName = `${studentName}/${file.name}`;
    const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
    
    if (error) throw error;
    return data.path;
}

// 3. Final Submission
async function submitApplication(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const appNumber = 'BI-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const studentName = `${formData.get('first_name')}_${formData.get('last_name')}`;

    try {
        // Handle File Uploads
        const files = document.querySelectorAll('input[type="file"]');
        let uploadedUrls = {};
        
        for (let input of files) {
            if (input.files[0]) {
                const path = await uploadFile(input.files[0], studentName, 'docs');
                uploadedUrls[input.name] = path;
            }
        }

        // Insert into Database
        const { error } = await supabase.from('applications').insert([{
            application_number: appNumber,
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            destination: destination,
            documents_urls: uploadedUrls,
            payment_status: 'Pending',
            application_status: 'Pending',
            created_at: new Date()
        }]);

        if (error) throw error;

        // Send Email via Resend (Using a simple fetch to a backend edge function or direct API)
        sendConfirmationEmail(formData.get('email'), appNumber);

        alert(`Application Submitted! Your Number: ${appNumber}`);
        window.location.href = `status.html?id=${appNumber}`;

    } catch (err) {
        console.error(err);
        alert('Error submitting application. Please check file sizes (Max 5MB).');
    }
}
