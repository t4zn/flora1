// Flora Plant Identifier - Mobile Chatbot Interface

class FloraApp {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeTime();
        this.initializeTheme();
        this.setupCamera();
        this.messageCounter = 0;
    }

    initializeElements() {
        // Helper function to safely get elements
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with id '${id}' not found`);
            }
            return element;
        };

        // Chat elements
        this.chatContainer = safeGetElement('chat-container');
        this.welcomeMessage = safeGetElement('welcome-message');
        
        // Camera elements
        this.cameraInterface = safeGetElement('camera-interface');
        this.cameraVideo = safeGetElement('camera-video');
        this.cameraCanvas = safeGetElement('camera-canvas');
        this.focusRing = safeGetElement('focus-ring');
        
        // Control buttons
        this.cameraTriggerBtn = safeGetElement('camera-trigger-btn');
        this.galleryTriggerBtn = safeGetElement('gallery-trigger-btn');
        this.cameraCloseBtn = safeGetElement('camera-close');
        this.cameraDoneBtn = safeGetElement('camera-done');
        this.captureBtn = safeGetElement('capture-btn');
        this.galleryBtn = safeGetElement('gallery-btn');
        this.flashBtn = safeGetElement('flash-btn');
        
        // Theme and settings
        this.themeToggle = safeGetElement('theme-toggle');
        this.settingsBtn = safeGetElement('settings-btn');
        this.settingsModal = safeGetElement('settings-modal');
        this.settingsClose = safeGetElement('settings-close');
        
        // Form and loading
        this.uploadForm = safeGetElement('upload-form');
        this.imageInput = safeGetElement('image-input');
        this.loadingOverlay = safeGetElement('loading-overlay');
        
        // Status bar
        this.currentTime = safeGetElement('current-time');
        
        // Camera stream
        this.cameraStream = null;
        this.flashEnabled = false;
    }

    attachEventListeners() {
        // Helper function to safely add event listeners
        const safeAddListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Camera trigger buttons
        safeAddListener(this.cameraTriggerBtn, 'click', () => {
            this.openCamera();
        });
        
        safeAddListener(this.galleryTriggerBtn, 'click', () => {
            if (this.imageInput) this.imageInput.click();
        });
        
        // Camera interface controls
        safeAddListener(this.cameraCloseBtn, 'click', () => {
            this.closeCamera();
        });
        
        safeAddListener(this.cameraDoneBtn, 'click', () => {
            this.closeCamera();
        });
        
        safeAddListener(this.captureBtn, 'click', () => {
            this.capturePhoto();
        });
        
        safeAddListener(this.galleryBtn, 'click', () => {
            this.closeCamera();
            if (this.imageInput) this.imageInput.click();
        });
        
        safeAddListener(this.flashBtn, 'click', () => {
            this.toggleFlash();
        });
        
        // Theme toggle
        safeAddListener(this.themeToggle, 'click', () => {
            this.toggleTheme();
        });
        
        // Settings
        safeAddListener(this.settingsBtn, 'click', () => {
            this.openSettings();
        });
        
        safeAddListener(this.settingsClose, 'click', () => {
            this.closeSettings();
        });
        
        // Theme options in settings
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTheme(e.target.dataset.theme);
            });
        });
        
        // File input change
        safeAddListener(this.imageInput, 'change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleImageSelection(e.target.files[0]);
            }
        });
        
        // Camera viewfinder tap to focus
        safeAddListener(this.cameraVideo, 'click', (e) => {
            this.focusCamera(e);
        });
        
        // Form submission
        safeAddListener(this.uploadForm, 'submit', (e) => {
            e.preventDefault();
        });
    }

    initializeTime() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }
    
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
        });
        if (this.currentTime) {
            this.currentTime.textContent = timeString;
        }
    }
    
    initializeTheme() {
        const savedTheme = localStorage.getItem('flora-theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    changeTheme(theme) {
        this.setTheme(theme);
        this.closeSettings();
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('flora-theme', theme);
        
        // Update active theme option
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
            }
        });
    }
    
    openSettings() {
        if (!this.settingsModal) return;
        this.settingsModal.style.display = 'flex';
        if (window.gsap) {
            gsap.fromTo(this.settingsModal, 
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
        }
    }
    
    closeSettings() {
        if (!this.settingsModal) return;
        if (window.gsap) {
            gsap.to(this.settingsModal, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    this.settingsModal.style.display = 'none';
                }
            });
        } else {
            this.settingsModal.style.display = 'none';
        }
    }

    setupCamera() {
        this.cameraSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
        
        if (!this.cameraSupported) {
            console.log('Camera not supported');
            this.cameraTriggerBtn.style.opacity = '0.5';
        }
    }
    
    async openCamera() {
        if (!this.cameraSupported) {
            this.addBotMessage('Camera is not supported on this device. Please use the gallery option instead.');
            return;
        }
        
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            this.cameraVideo.srcObject = this.cameraStream;
            this.cameraInterface.style.display = 'flex';
            
            // Animate camera interface
            gsap.fromTo(this.cameraInterface,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
            );
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.addBotMessage('Unable to access camera. Please check permissions and try again.');
        }
    }
    
    closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        gsap.to(this.cameraInterface, {
            opacity: 0,
            scale: 0.9,
            duration: 0.3,
            onComplete: () => {
                this.cameraInterface.style.display = 'none';
            }
        });
    }
    
    capturePhoto() {
        if (!this.cameraStream) return;
        
        const canvas = this.cameraCanvas;
        const video = this.cameraVideo;
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        // Convert to blob and process
        canvas.toBlob((blob) => {
            this.closeCamera();
            this.handleImageSelection(blob);
        }, 'image/jpeg', 0.8);
        
        // Visual feedback
        this.focusRing.classList.add('active');
        setTimeout(() => {
            this.focusRing.classList.remove('active');
        }, 1000);
    }
    
    focusCamera(event) {
        const rect = this.cameraVideo.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.focusRing.style.left = `${x - 50}px`;
        this.focusRing.style.top = `${y - 50}px`;
        this.focusRing.classList.add('active');
        
        setTimeout(() => {
            this.focusRing.classList.remove('active');
        }, 1000);
    }
    
    toggleFlash() {
        this.flashEnabled = !this.flashEnabled;
        this.flashBtn.style.color = this.flashEnabled ? '#fbbf24' : '';
        
        // Flash functionality would require advanced camera API
        // This is a visual toggle for now
    }
    
    handleImageSelection(file) {
        if (!file) return;
        
        // Validate file type for uploaded files
        if (file.type && !this.isValidImageType(file)) {
            this.addBotMessage('Please select a valid image file (PNG, JPG, JPEG, GIF, WEBP).');
            return;
        }
        
        // Validate file size (16MB limit)
        if (file.size > 16 * 1024 * 1024) {
            this.addBotMessage('File size must be less than 16MB. Please choose a smaller image.');
            return;
        }
        
        // Add user message with image
        this.addUserMessage(file);
        
        // Process the image
        this.processImage(file);
    }
    
    isValidImageType(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    addUserMessage(file) {
        if (!this.chatContainer) return;
        
        const messageId = `user-msg-${++this.messageCounter}`;
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        
        const messageHtml = `
            <div class="chat-message user-message" id="${messageId}">
                <div class="message-content">
                    <div class="message-bubble">
                        <img src="${URL.createObjectURL(file)}" alt="Plant image" class="plant-image">
                        <p>Can you identify this plant?</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            </div>
        `;
        
        this.chatContainer.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }
    
    addBotMessage(text, plantResult = null) {
        if (!this.chatContainer) return;
        
        const messageId = `bot-msg-${++this.messageCounter}`;
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        
        let resultHtml = '';
        if (plantResult) {
            resultHtml = `
                <div class="plant-result">
                    <div class="plant-name">${plantResult.plant}</div>
                    <div class="plant-confidence">Confidence: ${plantResult.confidence}%</div>
                    <div class="plant-description">${plantResult.description}</div>
                </div>
            `;
        }
        
        const messageHtml = `
            <div class="chat-message bot-message" id="${messageId}">
                <div class="message-avatar">
                    <i class="fas fa-seedling"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${text}</p>
                        ${resultHtml}
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
        
        this.chatContainer.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        if (!this.chatContainer) return;
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
    
    async processImage(file) {
        // Show loading
        this.showLoading();
        
        // Add bot typing message
        this.addBotMessage('Analyzing your plant image...');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to identify plant');
            }

            // Hide loading
            this.hideLoading();
            
            // Remove typing message
            const lastMessage = this.chatContainer.lastElementChild;
            if (lastMessage && lastMessage.textContent.includes('Analyzing')) {
                lastMessage.remove();
            }

            // Show results
            this.addBotMessage('Great! I was able to identify your plant:', data);

        } catch (error) {
            console.error('Error:', error);
            this.hideLoading();
            
            // Remove typing message
            const lastMessage = this.chatContainer.lastElementChild;
            if (lastMessage && lastMessage.textContent.includes('Analyzing')) {
                lastMessage.remove();
            }
            
            this.addBotMessage('Sorry, I had trouble identifying this plant. Please try another image or make sure the plant is clearly visible.');
        }
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
        gsap.fromTo(this.loadingOverlay,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 }
        );
    }

    hideLoading() {
        gsap.to(this.loadingOverlay, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.loadingOverlay.style.display = 'none';
            }
        });
    }

    // Helper methods for transitions and animations
    fadeIn(element, duration = 0.3) {
        gsap.fromTo(element,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: duration }
        );
    }
    
    fadeOut(element, duration = 0.3) {
        return new Promise(resolve => {
            gsap.to(element, {
                opacity: 0,
                y: -20,
                duration: duration,
                onComplete: resolve
            });
        });
    }
    
    // Utility method for showing notifications
    showNotification(message, type = 'info') {
        // This could be expanded to show toast notifications
        console.log(`${type}: ${message}`);
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
    
    // Smooth page load animation
    gsap.fromTo('.mobile-app', 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
    );
    
    // Animate welcome message
    setTimeout(() => {
        gsap.fromTo('#welcome-message',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }, 300);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close camera or settings
        if (e.key === 'Escape') {
            if (window.floraApp.cameraInterface.style.display === 'flex') {
                window.floraApp.closeCamera();
            }
            if (window.floraApp.settingsModal.style.display === 'flex') {
                window.floraApp.closeSettings();
            }
        }
        
        // Space or Enter to open camera
        if ((e.key === ' ' || e.key === 'Enter') && e.target === document.body) {
            e.preventDefault();
            window.floraApp.openCamera();
        }
    });
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Handle back button for camera
    window.addEventListener('popstate', () => {
        if (window.floraApp.cameraInterface.style.display === 'flex') {
            window.floraApp.closeCamera();
        }
    });
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.floraApp) {
        window.floraApp.addBotMessage('Sorry, something went wrong. Please try again.');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.floraApp) {
        window.floraApp.showNotification('Connection restored', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.floraApp) {
        window.floraApp.addBotMessage('You appear to be offline. Please check your connection.');
    }
});

// Prevent zoom on inputs
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// Add visual feedback for touch interactions
document.addEventListener('touchstart', (e) => {
    const target = e.target.closest('button');
    if (target) {
        target.style.transform = 'scale(0.95)';
    }
});

document.addEventListener('touchend', (e) => {
    const target = e.target.closest('button');
    if (target) {
        target.style.transform = '';
    }
});
