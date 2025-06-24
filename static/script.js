// Flora Plant Identifier - Frontend JavaScript

class FloraApp {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.setupFormValidation();
    }

    initializeElements() {
        // Form elements
        this.uploadForm = document.getElementById('upload-form');
        this.imageInput = document.getElementById('image-input');
        this.identifyBtn = document.getElementById('identify-btn');
        this.newScanBtn = document.getElementById('new-scan-btn');

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
        this.plantDescription = document.getElementById('plant-description');
        this.errorMessage = document.getElementById('error-message');
    }

    attachEventListeners() {
        // Image input change event
        this.imageInput.addEventListener('change', (e) => {
            this.handleImageSelection(e);
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
    }

    setupDragAndDrop() {
        const uploadArea = this.uploadForm;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('border-success');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('border-success');
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
            this.identifyBtn.classList.remove('btn-secondary');
            this.identifyBtn.classList.add('btn-success');
        } else {
            this.identifyBtn.classList.remove('btn-success');
            this.identifyBtn.classList.add('btn-secondary');
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
            this.imagePreviewContainer.classList.add('fade-in');
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
        this.uploadSection.style.display = 'none';
        this.loadingState.style.display = 'block';
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

        // Update confidence badge color based on score
        const confidenceBadge = this.confidenceScore.parentElement;
        if (data.confidence >= 80) {
            confidenceBadge.className = 'badge bg-success me-2';
        } else if (data.confidence >= 60) {
            confidenceBadge.className = 'badge bg-warning me-2';
        } else {
            confidenceBadge.className = 'badge bg-secondary me-2';
        }

        // Hide loading and show results
        this.hideLoading();
        this.resultsSection.style.display = 'block';
        this.resultsSection.classList.add('fade-in');

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
        this.errorSection.classList.add('fade-in');
        
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
        
        // Hide all sections except upload
        this.hideImagePreview();
        this.hideResults();
        this.hideError();
        this.hideLoading();
        
        // Show upload section
        this.uploadSection.style.display = 'block';
        
        // Reset button state
        this.validateForm();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Utility method to show toast notifications
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.floraApp = new FloraApp();
    
    // Service worker registration for PWA capabilities (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
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
