const postNewJobBtn = document.getElementById('postNewJobBtn');
// const jobsContent = document.getElementById('jobsContent');
const postJobForm = document.getElementById('postJobForm');
const cancelBtn = document.getElementById('cancelBtn');

// Show form for new job
postNewJobBtn.addEventListener('click', () => {
    document.getElementById('formHeader').innerText = 'Post New Job';
    document.getElementById('jobForm').reset();
    document.getElementById('jobId').value = '';

    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('latitude').value = position.coords.latitude;
            document.getElementById('longitude').value = position.coords.longitude;
        }, (err) => {
            console.warn("Geolocation failed: ", err);
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
        });
    }

    // jobsContent.classList.add('hidden');
    postJobForm.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Cancel button
cancelBtn.addEventListener('click', () => {
    postJobForm.classList.add('hidden');
    // jobsContent.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Handle Edit Job
document.querySelectorAll('.editJobBtn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    document.getElementById('formHeader').innerText = 'Edit Job';
    
    // Fill form with existing job data
    document.getElementById('jobId').value = row.dataset.id;
    document.getElementById('title').value = row.dataset.title;
    document.getElementById('description').value = row.dataset.description;
    document.getElementById('salary').value = row.dataset.pay;
    document.getElementById('contact').value = row.dataset.contact;

    // City (optional, not part of form but just in case you want to show)
    // document.getElementById('city').value = row.dataset.city;

    jobsContent.classList.add('hidden');
    postJobForm.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

