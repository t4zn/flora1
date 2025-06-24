# Flora - Plant Identifier App

## Overview

Flora is a production-ready, mobile-first web application that allows users to identify plants by uploading or capturing images. The app uses AI-powered image classification to identify plants and provides descriptions fetched from Wikipedia. It's built with Flask as the backend and a modern JavaScript frontend, designed as a single-use utility app with no authentication or user accounts required.

## System Architecture

### Frontend Architecture
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5 with dark theme
- **Design Pattern**: Mobile-first responsive design with progressive enhancement
- **Styling**: Custom CSS variables with Bootstrap integration, backdrop-filter effects for modern UI
- **Image Handling**: Client-side image preview, drag-and-drop functionality, file validation

### Backend Architecture
- **Framework**: Flask (Python 3.11+)
- **Deployment**: Gunicorn WSGI server with autoscale deployment target
- **Image Processing**: PIL (Python Imaging Library) for image manipulation
- **AI Integration**: Hugging Face Transformers pipeline for plant classification
- **External APIs**: Wikipedia REST API for plant descriptions

## Key Components

### Core Flask Application (`app.py`)
- **Image Upload Handler**: Processes uploaded images with file validation and size limits
- **AI Classification Pipeline**: Uses Microsoft ResNet-50 model via Hugging Face Transformers
- **Wikipedia Integration**: Fetches plant descriptions using Wikipedia's REST API
- **Error Handling**: Comprehensive logging and graceful error management

### Frontend Components
- **Upload Interface**: Camera/gallery integration with real-time image preview
- **Results Display**: Clean presentation of plant identification and description
- **Loading States**: Visual feedback during processing
- **Responsive Design**: Mobile-optimized with touch-friendly interactions

### File Management
- **Upload Directory**: Temporary storage in `/uploads` folder with automatic cleanup
- **Security**: Secure filename handling and file type validation
- **Size Limits**: 16MB maximum file size with allowed extensions (png, jpg, jpeg, gif, webp)

## Data Flow

1. **Image Capture/Upload**: User selects image through file input or camera
2. **Client Validation**: JavaScript validates file type and size before upload
3. **Form Submission**: Image sent via FormData to Flask `/predict` endpoint
4. **Backend Processing**: 
   - Image validation and processing with PIL
   - AI classification using Hugging Face pipeline
   - Wikipedia API call for plant description
5. **Response Generation**: JSON response with plant name and description
6. **Frontend Update**: Results displayed with smooth transitions

## External Dependencies

### Python Packages
- **Flask**: Web framework and routing
- **Transformers**: Hugging Face library for AI model integration
- **PIL**: Image processing and manipulation
- **Requests**: HTTP client for Wikipedia API calls
- **Gunicorn**: Production WSGI server

### Frontend Libraries
- **Bootstrap 5**: UI framework with dark theme support
- **Font Awesome**: Icon library for enhanced UI
- **Native APIs**: File API, Camera API for image capture

### External Services
- **Hugging Face**: AI model hosting and inference
- **Wikipedia REST API**: Plant description and information retrieval

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit's Python 3.11 environment
- **Hot Reload**: Gunicorn with `--reload` flag for development
- **Port Configuration**: Bound to 0.0.0.0:5000 with port reuse

### Production Configuration
- **WSGI Server**: Gunicorn with autoscale deployment
- **Proxy Support**: ProxyFix middleware for proper header handling
- **Environment Variables**: Configurable secrets for API tokens
- **Static Assets**: Served through Flask with CDN fallbacks

### Security Considerations
- **File Validation**: Strict file type and size validation
- **Secure Uploads**: Werkzeug secure_filename for path traversal protection
- **Error Handling**: No sensitive information exposure in error responses

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 24, 2025**: Complete 3D botanical experience with scientific accuracy
  - Created immersive 3D landing page with floating botanical elements
  - Enhanced plant identification to return scientific names and detailed descriptions
  - Implemented expert-level botanical chatbot with scientific knowledge
  - Fixed auto-hide functionality for camera/gallery dropdown
  - Added comprehensive plant database with 50+ scientifically accurate species
  - Built fallback animations for environments without 3D support
  - Improved identification algorithm with texture and color analysis
  - Added smooth transitions between landing page and main app
  - Enhanced botanical responses covering plant biology, taxonomy, and care
  - Fixed dependency management for reliable plant identification

## Changelog

- June 24, 2025: Initial setup and modern UI enhancement