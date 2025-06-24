// Flora Plant Identifier - Modern Frontend with 3D Effects

class FloraApp {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.setupFormValidation();
        this.init3DBackground();
        this.initAnimations();
    }

    initializeElements() {
        // Form elements
        this.uploadForm = document.getElementById('upload-form');
        this.imageInput = document.getElementById('image-input');
        this.identifyBtn = document.getElementById('identify-btn');
        this.newScanBtn = document.getElementById('new-scan-btn');
        this.uploadZone = document.getElementById('upload-zone');

        // Display elements
        this.imagePreviewContainer = document.getElementById('image-preview-container');
        this.imagePreview = document.getElementById('image-preview');
        this.uploadSection = document.getElementById('upload-section');
        this.loadingState = document.getElementById('loading-state');
        this.resultsSection = document.getElementById('results-section');
        this.errorSection = document.getElementById('error-section');

        // Result elements
        this.plantName = document.getElementById('plant-name');
        this.confidenceScore = document.getElementById('confidence-score');
        this.confidenceCircle = document.getElementById('confidence-circle');
        this.plantDescription = document.getElementById('plant-description');
        this.errorMessage = document.getElementById('error-message');

        // 3D elements
        this.bgCanvas = document.getElementById('bg-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
    }

    attachEventListeners() {
        // Image input change event
        this.imageInput.addEventListener('change', (e) => {
            this.handleImageSelection(e);
        });

        // Upload zone click
        this.uploadZone.addEventListener('click', () => {
            this.imageInput.click();
        });

        // Form submission
        this.uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitImage();
        });

        // New scan button
        this.newScanBtn.addEventListener('click', () => {
            this.resetApp();
        });

        // Drag and drop functionality
        this.setupDragAndDrop();

        // Scroll animations
        this.setupScrollAnimations();

        // Window resize for 3D canvas
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }

    setupDragAndDrop() {
        const uploadArea = this.uploadZone;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                this.imageInput.files = files;
                this.handleImageSelection({ target: { files: files } });
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    setupFormValidation() {
        // Real-time validation
        this.imageInput.addEventListener('change', () => {
            this.validateForm();
        });
    }

    validateForm() {
        const hasFile = this.imageInput.files && this.imageInput.files.length > 0;
        this.identifyBtn.disabled = !hasFile;
        
        if (hasFile) {
            this.identifyBtn.classList.remove('btn-disabled');
            this.identifyBtn.classList.add('btn-identify');
        } else {
            this.identifyBtn.classList.remove('btn-identify');
            this.identifyBtn.classList.add('btn-disabled');
        }
    }

    handleImageSelection(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.hideImagePreview();
            return;
        }

        // Validate file type
        if (!this.isValidImageType(file)) {
            this.showError('Please select a valid image file (PNG, JPG, JPEG, GIF, WEBP).');
            this.imageInput.value = '';
            return;
        }

        // Validate file size (16MB limit)
        if (file.size > 16 * 1024 * 1024) {
            this.showError('File size must be less than 16MB.');
            this.imageInput.value = '';
            return;
        }

        // Show image preview
        this.showImagePreview(file);
        this.hideError();
    }

    isValidImageType(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
            this.imagePreviewContainer.style.display = 'block';
            
            // Animate the preview appearance
            gsap.fromTo(this.imagePreviewContainer, 
                { opacity: 0, scale: 0.8, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
            );
        };
        reader.readAsDataURL(file);
    }

    hideImagePreview() {
        this.imagePreviewContainer.style.display = 'none';
        this.imagePreview.src = '';
    }

    async submitImage() {
        if (!this.imageInput.files || this.imageInput.files.length === 0) {
            this.showError('Please select an image first.');
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            const formData = new FormData();
            formData.append('image', this.imageInput.files[0]);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to identify plant');
            }

            // Show results
            this.showResults(data);

        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'An error occurred while identifying the plant. Please try again.');
            this.hideLoading();
        }
    }

    showLoading() {
        // Animate transition to loading state
        gsap.to(this.uploadSection, {
            opacity: 0,
            y: -30,
            duration: 0.3,
            onComplete: () => {
                this.uploadSection.style.display = 'none';
                this.loadingState.style.display = 'block';
                gsap.fromTo(this.loadingState,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.5 }
                );
            }
        });
        
        this.hideError();
        this.hideResults();
    }

    hideLoading() {
        this.loadingState.style.display = 'none';
        this.uploadSection.style.display = 'block';
    }

    showResults(data) {
        // Update result content
        this.plantName.textContent = data.plant || 'Unknown Plant';
        this.confidenceScore.textContent = data.confidence || '0';
        this.plantDescription.textContent = data.description || 'No description available.';

        // Animate confidence circle
        const confidence = data.confidence || 0;
        const circumference = 2 * Math.PI * 25; // radius = 25
        const offset = circumference - (confidence / 100) * circumference;
        
        if (this.confidenceCircle) {
            this.confidenceCircle.style.strokeDashoffset = offset;
        }

        // Hide loading and show results with animation
        gsap.to(this.loadingState, {
            opacity: 0,
            y: -30,
            duration: 0.3,
            onComplete: () => {
                this.loadingState.style.display = 'none';
                this.resultsSection.style.display = 'block';
                
                // Animate results appearance
                gsap.timeline()
                    .fromTo(this.resultsSection,
                        { opacity: 0, y: 50, scale: 0.9 },
                        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
                    )
                    .fromTo(this.plantName,
                        { opacity: 0, x: -30 },
                        { opacity: 1, x: 0, duration: 0.4 }, "-=0.3"
                    )
                    .fromTo(this.plantDescription,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.4 }, "-=0.2"
                    );
            }
        });

        // Scroll to results smoothly
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
        
        // Animate error appearance
        gsap.fromTo(this.errorSection,
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorSection.style.display = 'none';
    }

    resetApp() {
        // Reset form
        this.uploadForm.reset();
        this.imageInput.value = '';
        
        // Animate reset
        const timeline = gsap.timeline();
        
        timeline
            .to([this.resultsSection, this.errorSection, this.loadingState], {
                opacity: 0,
                y: 30,
                duration: 0.3,
                onComplete: () => {
                    this.hideResults();
                    this.hideError();
                    this.hideLoading();
                    this.hideImagePreview();
                }
            })
            .set(this.uploadSection, { display: 'block' })
            .fromTo(this.uploadSection,
                { opacity: 0, y: -30 },
                { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
            );
        
        // Reset button state
        this.validateForm();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 3D Background initialization
    init3DBackground() {
        if (!window.THREE) return; // Fallback if Three.js doesn't load
        
        try {
            // Scene setup
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ canvas: this.bgCanvas, alpha: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0x000000, 0);

            // Create floating geometric shapes
            this.createFloatingGeometry();
            
            // Position camera
            this.camera.position.z = 5;
            
            // Start animation loop
            this.animate3D();
        } catch (error) {
            console.log('3D background initialization failed, continuing without 3D effects');
        }
    }

    createFloatingGeometry() {
        const geometries = [
            new THREE.TetrahedronGeometry(0.5),
            new THREE.OctahedronGeometry(0.3),
            new THREE.IcosahedronGeometry(0.4)
        ];
        
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x10b981, 
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        for (let i = 0; i < 15; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const mesh = new THREE.Mesh(geometry, material);
            
            // Random positioning
            mesh.position.x = (Math.random() - 0.5) * 20;
            mesh.position.y = (Math.random() - 0.5) * 20;
            mesh.position.z = (Math.random() - 0.5) * 10;
            
            // Random rotation speeds
            mesh.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            };
            
            this.particles.push(mesh);
            this.scene.add(mesh);
        }
    }

    animate3D() {
        if (!this.renderer) return;
        
        requestAnimationFrame(() => this.animate3D());
        
        // Rotate particles
        this.particles.forEach(particle => {
            particle.rotation.x += particle.rotationSpeed.x;
            particle.rotation.y += particle.rotationSpeed.y;
            particle.rotation.z += particle.rotationSpeed.z;
            
            // Gentle floating motion
            particle.position.y += Math.sin(Date.now() * 0.001 + particle.position.x) * 0.001;
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Animation utilities
    initAnimations() {
        // Stagger animation for floating particles
        gsap.to('.particle', {
            y: '20px',
            duration: 2,
            ease: 'power2.inOut',
            stagger: 0.2,
            repeat: -1,
            yoyo: true
        });

        // Logo 3D rotation enhancement
        gsap.to('.logo-3d', {
            rotationY: 360,
            duration: 10,
            ease: 'none',
            repeat: -1
        });
    }

    setupScrollAnimations() {
        // Smooth reveal animations on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    gsap.fromTo(entry.target,
                        { opacity: 0, y: 50 },
                        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
                    );
                }
            });
        }, observerOptions);

        // Observe elements for scroll animations
        document.querySelectorAll('.glass-card').forEach(card => {
            observer.observe(card);
        });
    }

    // Utility method to show toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <span>${message}</span>
        `;
        
        // Add toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px 20px',
            color: 'white',
            zIndex: '10000',
            transform: 'translateX(100%)',
            opacity: '0'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        gsap.to(toast, {
            x: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.7)'
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            gsap.to(toast, {
                x: '100%',
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }
            });
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.floraApp = new FloraApp();
    
    // Add smooth page load animation
    gsap.fromTo('body', 
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.out' }
    );
    
    // Staggered animation for hero content
    gsap.timeline()
        .fromTo('.logo-3d', 
            { scale: 0, rotation: 180 },
            { scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.7)' }
        )
        .fromTo('.hero-title',
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5'
        )
        .fromTo('.hero-subtitle',
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3'
        );
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + U to upload new image
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            window.floraApp.resetApp();
            window.floraApp.imageInput.click();
        }
        
        // Escape to reset app
        if (e.key === 'Escape') {
            window.floraApp.resetApp();
        }
        
        // Space to scroll to upload section
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            document.querySelector('#upload-section').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // Add touch gesture support for mobile
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        // Swipe up to go to upload section
        if (diff > 50 && window.scrollY < 100) {
            document.querySelector('#upload-section').scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.floraApp) {
        window.floraApp.showError('An unexpected error occurred. Please refresh the page and try again.');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.floraApp) {
        window.floraApp.showToast('Connection restored', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.floraApp) {
        window.floraApp.showToast('You are offline. Some features may not work.', 'warning');
    }
});
