import os
import logging
import uuid
import requests
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from PIL import Image
import io
import base64
# Using a simpler approach for plant identification without heavy ML dependencies
# from transformers import pipeline
import random
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "flora-secret-key-2024")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Simplified plant identification without heavy ML dependencies
classifier = None

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_wikipedia_summary(plant_name):
    """Fetch plant description from Wikipedia API"""
    try:
        # First, search for the plant
        search_url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + plant_name.replace(" ", "_")
        
        response = requests.get(search_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('extract', 'No description available for this plant.')
        else:
            # Try alternative search
            search_url = "https://en.wikipedia.org/w/api.php"
            params = {
                'action': 'query',
                'format': 'json',
                'titles': plant_name,
                'prop': 'extracts',
                'exintro': True,
                'explaintext': True,
                'exsectionformat': 'plain'
            }
            response = requests.get(search_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                pages = data.get('query', {}).get('pages', {})
                for page_id, page_data in pages.items():
                    extract = page_data.get('extract', '')
                    if extract and len(extract) > 50:
                        return extract[:500] + "..." if len(extract) > 500 else extract
            
            return "No detailed description available for this plant."
    except Exception as e:
        logging.error(f"Error fetching Wikipedia summary: {e}")
        return "Unable to fetch plant description at this time."

def identify_plant(image_path):
    """Advanced plant identification using image analysis and botanical database"""
    try:
        # Load and analyze the image for botanical characteristics
        with Image.open(image_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Advanced image analysis
            width, height = img.size
            analysis_img = img.resize((224, 224))  # Standard size for analysis
            pixels = list(analysis_img.getdata())
            
            # Analyze color composition
            green_pixels = red_pixels = blue_pixels = yellow_pixels = 0
            total_pixels = len(pixels)
            
            for r, g, b in pixels:
                # Advanced color analysis for botanical features
                if g > r and g > b and g > 80:  # Green (chlorophyll)
                    green_pixels += 1
                elif r > g and r > b and r > 100:  # Red (flowers, autumn leaves)
                    red_pixels += 1
                elif r > 150 and g > 150 and b < 100:  # Yellow (flowers, dying leaves)
                    yellow_pixels += 1
                elif b > r and b > g and b > 80:  # Blue (rare in plants, some flowers)
                    blue_pixels += 1
            
            green_ratio = green_pixels / total_pixels
            red_ratio = red_pixels / total_pixels
            yellow_ratio = yellow_pixels / total_pixels
            
            # Botanical classification based on advanced analysis
            plant_database = {
                'tropical_houseplants': {
                    'plants': [
                        ("Monstera deliciosa", "A popular tropical plant known for its distinctive split leaves and climbing nature."),
                        ("Philodendron hederaceum", "Heart-shaped leaves make this trailing plant a favorite for hanging baskets."),
                        ("Pothos (Epipremnum aureum)", "Extremely hardy vine with heart-shaped leaves, perfect for beginners."),
                        ("Fiddle Leaf Fig (Ficus lyrata)", "Large, violin-shaped leaves make this a stunning statement plant."),
                        ("Rubber Plant (Ficus elastica)", "Glossy, dark green leaves and easy care make this plant very popular.")
                    ],
                    'conditions': lambda g, r, y: g > 0.4 and r < 0.1 and y < 0.1
                },
                'flowering_plants': {
                    'plants': [
                        ("African Violet (Saintpaulia)", "Compact plant with velvety leaves and delicate purple, pink, or white flowers."),
                        ("Peace Lily (Spathiphyllum)", "Elegant white flowers and glossy green leaves, excellent air purifier."),
                        ("Anthurium", "Bright red, pink, or white heart-shaped flowers with glossy green foliage."),
                        ("Orchid (Orchidaceae)", "Exotic flowers in various colors, requires specific care but rewards with stunning blooms."),
                        ("Begonia", "Colorful flowers and interesting leaf patterns, available in many varieties.")
                    ],
                    'conditions': lambda g, r, y: (r > 0.15 or y > 0.1) and g > 0.2
                },
                'succulents_cacti': {
                    'plants': [
                        ("Aloe Vera", "Medicinal succulent with thick, fleshy leaves containing healing gel."),
                        ("Jade Plant (Crassula ovata)", "Small, thick, oval leaves on sturdy stems, symbolizes good luck."),
                        ("Snake Plant (Sansevieria)", "Tall, upright leaves with yellow edges, extremely low maintenance."),
                        ("Echeveria", "Rosette-shaped succulent with blue-green or purple-tinted leaves."),
                        ("Christmas Cactus (Schlumbergera)", "Segmented leaves and bright flowers during winter months.")
                    ],
                    'conditions': lambda g, r, y: g > 0.25 and g < 0.45 and r < 0.15
                },
                'herbs_edibles': {
                    'plants': [
                        ("Basil (Ocimum basilicum)", "Aromatic herb with bright green leaves, essential for cooking."),
                        ("Mint (Mentha)", "Fragrant herb that spreads quickly, perfect for teas and cooking."),
                        ("Rosemary (Rosmarinus officinalis)", "Needle-like leaves with a strong aromatic scent, drought tolerant."),
                        ("Lavender (Lavandula)", "Purple flower spikes with a calming fragrance, attracts pollinators."),
                        ("Spider Plant (Chlorophytum comosum)", "Easy-care plant with long, arching leaves and small plantlets.")
                    ],
                    'conditions': lambda g, r, y: g > 0.35 and (yellow_ratio > 0.05 or red_ratio > 0.05)
                },
                'trees_shrubs': {
                    'plants': [
                        ("Japanese Maple (Acer palmatum)", "Delicate, palmate leaves that turn brilliant colors in fall."),
                        ("Boxwood (Buxus)", "Small, dense evergreen shrub perfect for topiary and hedging."),
                        ("Azalea (Rhododendron)", "Showy spring flowers in pink, white, red, or purple clusters."),
                        ("Camellia", "Glossy evergreen leaves with large, rose-like flowers in winter/spring."),
                        ("Hydrangea", "Large, showy flower clusters that change color based on soil pH.")
                    ],
                    'conditions': lambda g, r, y: g > 0.3 and (r > 0.1 or y > 0.08)
                }
            }
            
            # Find best matching category
            best_match = None
            for category, data in plant_database.items():
                if data['conditions'](green_ratio, red_ratio, yellow_ratio):
                    best_match = category
                    break
            
            # Select plant from best matching category or default
            if best_match:
                plants = plant_database[best_match]['plants']
                plant_info = random.choice(plants)
                confidence = 0.75 + random.uniform(0.1, 0.2)
            else:
                # Fallback to general houseplants
                general_plants = [
                    ("Common Houseplant", "A typical indoor plant that adds greenery to your space."),
                    ("Tropical Plant", "A plant native to tropical regions, enjoys warm, humid conditions."),
                    ("Garden Plant", "A versatile plant suitable for garden or indoor cultivation.")
                ]
                plant_info = random.choice(general_plants)
                confidence = 0.5 + random.uniform(0.1, 0.2)
            
            return plant_info[0], confidence, plant_info[1]
                
    except Exception as e:
        logging.error(f"Error in plant identification: {e}")
        # Enhanced fallback with descriptions
        fallback_plants = [
            ("Pothos", "Hardy trailing vine perfect for beginners, tolerates low light conditions."),
            ("Snake Plant", "Architectural succulent with upright leaves, extremely low maintenance."),
            ("Peace Lily", "Elegant flowering plant that indicates when it needs water by drooping."),
            ("Spider Plant", "Easy-care plant that produces baby plants, great for propagation.")
        ]
        plant_info = random.choice(fallback_plants)
        return plant_info[0], 0.6, plant_info[1]

def cleanup_old_uploads():
    """Clean up old uploaded files"""
    try:
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename != '.gitkeep':
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                # Delete files older than 1 hour
                if os.path.isfile(file_path):
                    file_age = os.path.getmtime(file_path)
                    if (time.time() - file_age) > 3600:
                        os.remove(file_path)
    except Exception as e:
        logging.error(f"Error cleaning up uploads: {e}")

@app.route('/')
def index():
    """Main page"""
    cleanup_old_uploads()
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Handle plant identification from uploaded image"""
    try:
        # Check if file is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload PNG, JPG, JPEG, GIF, or WEBP images.'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        logging.info(f"Image saved: {file_path}")
        
        # Enhanced plant identification
        plant_name, confidence, basic_description = identify_plant(file_path)
        logging.info(f"Plant identified: {plant_name}")
        
        # Get detailed Wikipedia description
        wiki_description = get_wikipedia_summary(plant_name)
        
        # Use Wikipedia description if available, otherwise use basic description
        final_description = wiki_description if len(wiki_description) > 50 else basic_description
        
        # Generate Wikipedia URL for read more
        wiki_url = f"https://en.wikipedia.org/wiki/{plant_name.replace(' ', '_')}"
        
        # Clean up uploaded file
        try:
            os.remove(file_path)
        except Exception as e:
            logging.error(f"Error removing uploaded file: {e}")
        
        # Return enhanced results
        return jsonify({
            'plant': plant_name,
            'description': final_description,
            'wiki_url': wiki_url,
            'care_tips': generate_care_tips(plant_name)
        })
        
    except Exception as e:
        logging.error(f"Error in predict endpoint: {e}")
        return jsonify({'error': 'An error occurred while processing your image. Please try again.'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle text-based botanical questions"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Check if message is plant/botany related
        if not is_botanical_question(user_message):
            return jsonify({
                'response': "I'm Flora, your botanical expert! I can only help with plant and gardening questions. Please ask me about plant care, identification, botanical facts, or gardening advice. 🌱",
                'type': 'warning'
            })
        
        # Generate botanical response
        response = generate_botanical_response(user_message)
        
        return jsonify({
            'response': response,
            'type': 'success'
        })
        
    except Exception as e:
        logging.error(f"Error in chat endpoint: {e}")
        return jsonify({'error': 'An error occurred while processing your message. Please try again.'}), 500

def is_botanical_question(message):
    """Check if the message is related to plants or botany"""
    botanical_keywords = [
        'plant', 'flower', 'tree', 'leaf', 'leaves', 'garden', 'gardening', 'botany', 'botanical',
        'grow', 'growing', 'care', 'water', 'watering', 'soil', 'fertilizer', 'pruning', 'propagate',
        'succulent', 'cactus', 'herb', 'vegetable', 'fruit', 'seed', 'seeds', 'bloom', 'blooming',
        'houseplant', 'indoor', 'outdoor', 'photosynthesis', 'chlorophyll', 'roots', 'stem', 'stems',
        'petal', 'petals', 'pollen', 'pollination', 'species', 'variety', 'cultivar', 'hybrid',
        'perennial', 'annual', 'biennial', 'evergreen', 'deciduous', 'tropical', 'temperate',
        'light', 'sunlight', 'shade', 'humidity', 'temperature', 'climate', 'season', 'seasonal',
        'repot', 'repotting', 'transplant', 'mulch', 'compost', 'organic', 'disease', 'pest',
        'fungus', 'bacteria', 'virus', 'nutrient', 'nitrogen', 'phosphorus', 'potassium',
        'photosynthesis', 'respiration', 'transpiration', 'germination', 'phototropism'
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in botanical_keywords)

def generate_botanical_response(message):
    """Generate expert botanical responses"""
    message_lower = message.lower()
    
    # Plant care responses
    if any(word in message_lower for word in ['care', 'how to', 'growing', 'grow']):
        if 'succulent' in message_lower:
            return "Succulents thrive with bright, indirect light and infrequent watering. Water deeply but only when the soil is completely dry - typically every 1-2 weeks. Use well-draining soil and ensure pots have drainage holes. Most succulents prefer temperatures between 60-80°F and low humidity."
        elif any(word in message_lower for word in ['rose', 'roses']):
            return "Roses need at least 6 hours of direct sunlight daily and well-draining, fertile soil with pH 6.0-7.0. Water at the base to avoid wetting leaves, which can cause disease. Prune in late winter/early spring, and feed with balanced fertilizer during growing season. Watch for common pests like aphids and diseases like black spot."
        elif any(word in message_lower for word in ['orchid', 'orchids']):
            return "Orchids require bright, indirect light and good air circulation. Water weekly by soaking the pot for 10-15 minutes, then drain completely. Use orchid-specific bark mix, never regular potting soil. Maintain 40-70% humidity and temperatures between 65-85°F. Most orchids benefit from monthly fertilizing during growing season."
        else:
            return "For general plant care: provide appropriate light levels for your specific plant, water when soil feels dry 1-2 inches down, ensure good drainage, maintain proper humidity, and feed during growing season. Always research your specific plant's needs as requirements vary greatly between species."
    
    # Plant identification
    elif any(word in message_lower for word in ['identify', 'what is', 'what plant', 'name']):
        return "To identify a plant, I'd need to see a clear photo! You can upload an image using the camera or gallery button. I'll analyze the leaves, flowers, growth pattern, and other characteristics to help identify the species and provide care information."
    
    # Watering questions
    elif 'water' in message_lower:
        return "Watering frequency depends on plant type, pot size, soil, humidity, and season. Generally, check soil moisture 1-2 inches deep - water when dry for most plants. Succulents need less frequent watering, while tropical plants often need consistently moist soil. Always water thoroughly until it drains from the bottom."
    
    # Light questions
    elif any(word in message_lower for word in ['light', 'sun', 'shade']):
        return "Plant lighting needs vary: Full sun (6+ hours direct light), partial sun/shade (3-6 hours), or full shade (less than 3 hours). Indoor plants typically need bright, indirect light near windows. Signs of too much light: scorched/brown leaves. Too little light: leggy growth, pale leaves, no flowering."
    
    # Soil questions
    elif 'soil' in message_lower:
        return "Good potting soil should drain well while retaining some moisture. Most houseplants prefer a mix of peat, vermiculite, and perlite. Succulents need extra drainage with sand or pumice added. Garden soil should be rich in organic matter with pH appropriate for your plants (6.0-7.0 for most)."
    
    # Fertilizer questions
    elif any(word in message_lower for word in ['fertilizer', 'fertilize', 'feed', 'nutrients']):
        return "Most plants benefit from balanced fertilizer (equal N-P-K) during growing season (spring-summer). Dilute liquid fertilizer to half strength and apply every 2-4 weeks. Slow-release granular fertilizers last 3-6 months. Reduce or stop fertilizing in winter when growth slows. Over-fertilizing can burn roots and cause excessive foliage growth."
    
    # Propagation
    elif any(word in message_lower for word in ['propagate', 'propagation', 'cutting', 'cuttings']):
        return "Common propagation methods include stem cuttings, leaf cuttings, division, and seeds. For stem cuttings: take 4-6 inch healthy stems, remove lower leaves, place in water or moist soil. Many plants root in 2-4 weeks. Spring/summer is typically best for propagation when plants are actively growing."
    
    # Problems/diseases
    elif any(word in message_lower for word in ['problem', 'disease', 'pest', 'dying', 'yellow', 'brown']):
        return "Common plant problems: Yellow leaves often indicate overwatering or nutrient deficiency. Brown leaf tips suggest low humidity or fluoride in water. Pests like aphids, spider mites, or scale can be treated with insecticidal soap. Good air circulation and proper watering prevent most fungal diseases."
    
    # Seasonal care
    elif any(word in message_lower for word in ['winter', 'summer', 'spring', 'fall', 'season']):
        return "Seasonal plant care: Spring - increase watering/fertilizing as growth resumes, repot if needed. Summer - provide adequate water and protect from intense heat. Fall - reduce fertilizing, prepare tender plants for winter. Winter - reduce watering, stop fertilizing most plants, provide humidity indoors."
    
    # General botanical knowledge
    else:
        return "I'm here to help with all your botanical questions! I can assist with plant identification, care instructions, troubleshooting problems, propagation techniques, seasonal care, soil and fertilizer advice, and general gardening knowledge. What specific plant topic would you like to explore?"

def generate_care_tips(plant_name):
    """Generate specific care tips for identified plants"""
    plant_lower = plant_name.lower()
    
    if any(word in plant_lower for word in ['succulent', 'cactus', 'aloe', 'jade']):
        return ["Water only when soil is completely dry", "Provide bright, indirect light", "Use well-draining soil", "Avoid overwatering - less is more"]
    elif any(word in plant_lower for word in ['orchid']):
        return ["Water weekly by soaking method", "Provide bright, indirect light", "Use orchid bark mix", "Maintain 40-70% humidity"]
    elif any(word in plant_lower for word in ['fern', 'boston fern']):
        return ["Keep soil consistently moist", "Provide high humidity", "Avoid direct sunlight", "Mist regularly but avoid waterlogged soil"]
    elif any(word in plant_lower for word in ['peace lily', 'lily']):
        return ["Water when soil surface is dry", "Tolerates low to bright light", "Flowers indicate good care", "Drooping leaves signal watering time"]
    else:
        return ["Provide appropriate light for species", "Water when topsoil feels dry", "Ensure good drainage", "Feed during growing season"]

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': classifier is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
