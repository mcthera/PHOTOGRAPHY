// --- Check Admin Auth State on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    const authNavLink = document.getElementById('auth-nav-link');
    const adminUploadSection = document.querySelector('.admin-upload-section');
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';

    if (isLoggedIn) {
        // Activate admin mode class on body to reveal delete buttons
        document.body.classList.add('admin-mode');
        
        if (adminUploadSection) adminUploadSection.classList.add('visible');
        if (authNavLink) {
            authNavLink.textContent = 'Logout';
            authNavLink.href = '#';
            authNavLink.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.removeItem('isAdminLoggedIn');
                alert('Logged out successfully.');
                window.location.reload();
            });
        }
    }
});

// --- Gallery Filtering & Listeners ---
const filterButtons = document.querySelectorAll('.filter-btn');

function updateGalleryListeners() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close');

    galleryItems.forEach(item => {
        // Prevent duplicate event binding
        item.removeEventListener('click', item._lightboxHandler);
        
        item._lightboxHandler = (e) => {
            // Prevent opening lightbox if the delete button was clicked
            if (e.target.classList.contains('delete-btn')) return;

            const img = item.querySelector('img');
            const captionText = item.querySelector('.overlay span').innerText;
            
            lightbox.style.display = 'block';
            lightboxImg.src = img.src;
            lightboxCaption.innerText = captionText;
        };
        
        item.addEventListener('click', item._lightboxHandler);

        // --- Handle Delete Functionality ---
        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Stop lightbox from triggering
                if (confirm('Are you sure you want to delete this picture?')) {
                    item.remove();
                }
            };
        }
    });

    if (closeBtn) {
        closeBtn.onclick = () => { lightbox.style.display = 'none'; };
    }
    
    if (lightbox) {
        lightbox.onclick = (e) => {
            if (e.target !== lightboxImg && e.target !== closeBtn) {
                lightbox.style.display = 'none';
            }
        };
    }
}

// Ensure default gallery items have delete buttons built-in if you want them deletable too
document.querySelectorAll('.gallery-item').forEach(item => {
    if (!item.querySelector('.delete-btn')) {
        const delBtn = document.createElement('button');
        delBtn.classList.add('delete-btn');
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
        item.appendChild(delBtn);
    }
});

updateGalleryListeners();

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');
        const galleryItems = document.querySelectorAll('.gallery-item');

        galleryItems.forEach(item => {
            if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// --- Admin Image Upload Functionality ---
const uploadForm = document.getElementById('upload-form');
const galleryGrid = document.querySelector('.gallery-grid');

if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('photo-title');
        const categorySelect = document.getElementById('photo-category');
        const fileInput = document.getElementById('photo-file');

        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const imageUrl = event.target.result;

            const newItem = document.createElement('div');
            newItem.classList.add('gallery-item');
            newItem.setAttribute('data-category', categorySelect.value);

            newItem.innerHTML = `
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                <img src="${imageUrl}" alt="${titleInput.value}">
                <div class="overlay"><span>${titleInput.value}</span></div>
            `;

            galleryGrid.appendChild(newItem);

            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            if (activeFilter !== 'all' && activeFilter !== categorySelect.value) {
                newItem.style.display = 'none';
            }

            updateGalleryListeners();
            uploadForm.reset();
            alert('Photo uploaded successfully!');
        };

        reader.readAsDataURL(file);
    });
}

// --- Contact Form Submission Handler ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! I will get back to you soon.');
        contactForm.reset();
    });
}