# BoldTake Extension - Changelog

## [1.0.11] - 2025-09-15

### 🐛 Fixed
- **Modal Handling**: Fixed issue where X.com opens replies in new windows instead of modals
- **Service Worker**: Removed `config.js` import that was causing service worker to crash
- **Authentication**: Fixed token extraction from storage for API calls
- **Timeout**: Improved timeout handling with better error messages

### 🔧 Technical Changes
- Added new window detection for `/compose/post` and `/intent/post` URLs
- Hardcoded configuration directly in background.js to avoid import issues
- Added debug logging for authentication flow
- Improved modal recovery with multiple fallback methods

### 📝 Documentation
- Added comprehensive debugging guide
- Created known issues tracker
- Established development rules and patterns

---

## [1.0.10] - 2025-09-15

### 🐛 Fixed
- **debugLog Conflict**: Resolved duplicate identifier error by removing config.js from content_scripts
- **API Timeout**: Added 30-second timeout to prevent infinite hanging

### 📚 Added
- `.cursorrules` for AI assistant guidance
- `KNOWN_ISSUES.md` for tracking bugs and solutions
- `DEBUGGING_GUIDE.md` for troubleshooting procedures
- `DEVELOPMENT_RULES.md` for coding standards

---

## [1.0.9] - 2025-09-15

### 🏗️ Architecture
- Implemented centralized configuration system
- Established service/action patterns
- Created comprehensive documentation structure

### 🐛 Fixed
- Configuration management issues
- Import conflicts in content scripts

---

## Previous Versions

### [1.0.8] - Initial Release
- Core automation functionality
- AI-powered reply generation
- Multi-language support
- Authentication system
- Session management
