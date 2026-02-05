# Untranslatable Words Installation

A gesture-controlled web installation comparing **literal translation** vs **speculative translation** through three embodied rooms.

## Quick Start

1. Open a terminal in this folder
2. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Or Node.js
   npx serve
   ```
3. Open `http://localhost:8000/literal.html` in Chrome or Firefox
4. Allow webcam access when prompted

## User Flow

1. **Phase 1 (literal.html)** — Read three dictionary definitions, rate your emotional response
2. **Phase 2 (speculative.html)** — Experience three gesture-controlled rooms:
   - **Hygge**: Bring hands together for warmth, apart to scatter
   - **Komorebi**: Hand height controls brightness, movement creates breeze
   - **Fernweh**: Reach toward camera to pull horizon closer
   - Hold open palm 2 seconds to advance
3. **Phase 3 (dashboard.html)** — See your before/after emotional comparison

## Requirements

- Modern browser (Chrome/Firefox recommended)
- Webcam access
- Local server (due to MediaPipe CORS requirements)

## Files

```
installation/
├── literal.html      # Phase 1: definitions + SAM rating
├── speculative.html  # Phase 2: gesture rooms
├── dashboard.html    # Phase 3: results visualization
├── css/
│   └── installation.css
└── js/
    ├── sam.js        # SAM rating logic
    └── sketch.js     # p5.js + MediaPipe hand tracking
```
