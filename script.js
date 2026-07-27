// ==========================================
// 1. FIREBASE INITIALIZATION (`edna-gallery`)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBcHe1cyKD2kTERXzgAV9Eyoq4B6z0LWW4",
    authDomain: "edna-gallery.firebaseapp.com",
    projectId: "edna-gallery",
    storageBucket: "edna-gallery.firebasestorage.app",
    messagingSenderId: "295843509001",
    appId: "1:295843509001:web:1fbeeae4a51b73f5a419d8",
    measurementId: "G-42SJ3X8R2R"
};

// Initialize Firebase App & Firestore Database
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


// ==========================================
// 2. DOM CONTENT LOADED & AUTH STATE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const authNavLink = document.getElementById('auth-nav-link');
    const adminUploadSection = document.querySelector('.admin-upload-section');
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';

    if (isLoggedIn) {
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

    // Mobile Hamburger Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Load gallery dynamically from Firestore Database
    loadGalleryFromFirestore();
});


// ==========================================
// 3. FETCH & RENDER GALLERY FROM FIRESTORE
// ==========================================
async function loadGalleryFromFirestore() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    try {
        const querySnapshot = await db.collection("photos").orderBy("createdAt", "desc").get();
        
        galleryGrid.innerHTML = ''; // Clear default static elements to pull cleanly from DB

        querySnapshot.forEach((docSnapshot) => {
            const photoData = docSnapshot.data();
            appendPhotoToDOM(docSnapshot.id, photoData.title, photoData.category, photoData.imageUrl);
        });

        updateGalleryListeners();
    } catch (error) {
        console.error("Error loading gallery from Firestore:", error);
    }
}

function appendPhotoToDOM(id, title, category, imageUrl) {
    const galleryGrid = document.querySelector('.gallery-grid');
    
    const newItem = document.createElement('div');
    newItem.classList.add('gallery-item');
    newItem.setAttribute('data-category', category);
    newItem.setAttribute('data-id', id);

    newItem.innerHTML = `
        <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
        <img src="${imageUrl}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80'">
        <div class="overlay"><span>${title}</span></div>
    `;

    galleryGrid.appendChild(newItem);
}


// ==========================================
// 4. GALLERY LISTENERS, LIGHTBOX & DELETE
// ==========================================
const filterButtons = document.querySelectorAll('.filter-btn');

function updateGalleryListeners() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close');

    galleryItems.forEach(item => {
        item.removeEventListener('click', item._lightboxHandler);
        
        item._lightboxHandler = (e) => {
            if (e.target.closest('.delete-btn')) return;

            const img = item.querySelector('img');
            const captionText = item.querySelector('.overlay span').innerText;
            
            lightbox.style.display = 'block';
            lightboxImg.src = img.src;
            lightboxCaption.innerText = captionText;
        };
        
        item.addEventListener('click', item._lightboxHandler);

        // --- Handle Delete Functionality from Firestore ---
        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this picture record?')) {
                    const docId = deleteBtn.getAttribute('data-id');
                    try {
                        if (docId) {
                            await db.collection("photos").doc(docId).delete();
                        }
                        item.remove();
                        alert('Photo deleted successfully!');
                    } catch (error) {
                        console.error("Error deleting document from Firestore:", error);
                        alert('Failed to delete photo record.');
                    }
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

// Filter button logic
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


// ==========================================
// 5. ADMIN IMAGE URL SUBMISSION TO FIRESTORE
// ==========================================
const uploadForm = document.getElementById('upload-form');

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('photo-title');
        const categorySelect = document.getElementById('photo-category');
        const urlInput = document.getElementById('photo-url');

        const imageUrl = urlInput.value.trim();
        if (!imageUrl) return;

        try {
            // Save metadata and image URL directly to Firestore database
            const docRef = await db.collection("photos").add({
                title: titleInput.value,
                category: categorySelect.value,
                imageUrl: imageUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Append instantly to the DOM
            appendPhotoToDOM(docRef.id, titleInput.value, categorySelect.value, imageUrl);
            updateGalleryListeners();

            uploadForm.reset();
            alert('Photo URL added to Firestore successfully!');
        } catch (error) {
            console.error("Error adding document:", error);
            alert('Failed to save photo URL. Check console for details.');
        }
    });
}


// ==========================================
// 6. CONTACT FORM SUBMISSION HANDLER
// ==========================================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! I will get back to you soon.');
        contactForm.reset();
    });
}