# Glicelivre - Glucose Monitoring PWA

## Overview

Glicelivre is a Progressive Web Application (PWA) for glucose monitoring designed for diabetic patients. The application allows users to track their blood glucose levels, view historical data, and receive alerts for abnormal readings. It's built as an offline-first application that can be installed on mobile devices and works without internet connectivity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a client-heavy architecture with minimal backend infrastructure:

### Frontend Architecture
- **Framework**: Vanilla JavaScript with Bootstrap 5 for UI components
- **PWA Implementation**: Service Worker for offline functionality and caching
- **Charts**: Chart.js for data visualization
- **Storage**: Browser LocalStorage for data persistence
- **Language**: Portuguese (Brazil) - targeting Brazilian users

### Backend Architecture
- **Framework**: Flask (Python) - minimal server setup
- **Purpose**: Static file serving and PWA manifest delivery
- **Sessions**: Basic Flask session management with secret key
- **Deployment**: Simple WSGI application

### Data Storage Strategy
- **Primary Storage**: Browser LocalStorage (client-side)
- **Data Format**: JSON objects stored locally
- **Offline-First**: No database dependency, works entirely offline
- **Data Categories**: 
  - Glucose readings with timestamps
  - User settings and preferences
  - Historical data for charts and statistics

## Key Components

### Core Application Logic (`static/js/app.js`)
- **GlicelivreApp**: Main application controller
- **Data Management**: CRUD operations for glucose readings
- **Threshold Management**: Categorizes readings (low, normal, high, critical)
- **Notifications**: Browser notifications for abnormal readings
- **PWA Installation**: Handles app installation prompts

### Visualization (`static/js/charts.js`)
- **GlicelivreCharts**: Chart management module
- **Chart.js Integration**: Line charts for glucose trends
- **Color Coding**: Visual indicators for glucose levels
- **Interactive Features**: Tooltips and hover effects

### Progressive Web App Features
- **Service Worker** (`static/sw.js`): Offline caching and background sync
- **Manifest** (`static/manifest.json`): App metadata and installation config
- **Icons**: SVG icons for various screen sizes
- **Offline Support**: Full functionality without internet

### User Interface
- **Responsive Design**: Bootstrap 5 grid system
- **Dark Theme**: Default dark mode optimized for medical use
- **Accessibility**: Proper form labels and semantic HTML
- **Mobile-First**: Optimized for smartphone usage

## Data Flow

1. **User Input**: Glucose readings entered through web form
2. **Validation**: Client-side validation for reasonable glucose values
3. **Storage**: Data saved to browser LocalStorage immediately
4. **Visualization**: Charts updated in real-time with new data
5. **Analysis**: Automatic categorization of readings (normal/abnormal)
6. **Notifications**: Browser alerts for concerning readings
7. **Historical View**: Past readings displayed in chronological order

### Offline Behavior
- All functionality works without internet connectivity
- Service Worker caches all necessary assets
- Data persistence through LocalStorage survives browser restarts
- Background sync capabilities for future server integration

## External Dependencies

### CDN Resources
- **Chart.js**: `cdn.jsdelivr.net/npm/chart.js` - Data visualization
- **Bootstrap 5**: `cdn.jsdelivr.net/npm/bootstrap@5.3.0` - UI framework
- **Feather Icons**: `cdn.jsdelivr.net/npm/feather-icons` - Icon library

### Python Dependencies
- **Flask**: Web framework for minimal server functionality
- **Standard Library**: os, logging modules for basic operations

### Browser APIs
- **LocalStorage**: Client-side data persistence
- **Service Worker**: PWA offline functionality
- **Notifications API**: User alerts for glucose levels
- **Web App Manifest**: Installation and app metadata

## Deployment Strategy

### Development Setup
- **Entry Point**: `main.py` or `app.py`
- **Port**: 5000 (configurable)
- **Debug Mode**: Enabled for development
- **Host**: `0.0.0.0` for external access

### Production Considerations
- **Static Serving**: Flask serves static assets directly
- **Session Security**: Environment-based secret key configuration
- **HTTPS**: Required for PWA features and notifications
- **Caching**: Service Worker handles client-side caching

### Scalability Notes
- Current architecture is client-heavy with minimal server load
- Future database integration would require backend API expansion
- Data export/import features could be added for cloud backup
- Multi-user support would need authentication system

### Key Architectural Decisions

**Client-Side Storage**: LocalStorage chosen over server database to ensure offline functionality and reduce infrastructure complexity. This makes the app immediately usable without account creation.

**PWA Architecture**: Service Worker implementation prioritizes offline-first experience, critical for medical applications where connectivity might be unreliable.

**Minimal Backend**: Flask serves only static files and PWA manifest, keeping server requirements minimal while allowing for future API expansion.

**Portuguese Localization**: Application specifically targets Brazilian Portuguese speakers, with date formats and terminology adapted for local medical practices.