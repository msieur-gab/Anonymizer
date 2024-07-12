# Changelog
All notable changes to this project will be documented in this file.

## [0.5.0] - 2024-07-12
### Added
- Option to detect and remove empty columns
- User interface for choosing to remove empty columns when detected

### Changed
- Improved empty column detection logic
- Enhanced user experience by only showing empty column removal option when relevant

## [0.4.0] - 2024-07-12
### Added
- Support for TSV (Tab-Separated Values) file parsing
- Multiple export formats: CSV, JSON, and XLSX
- Export dropdown menu in the user interface

### Changed
- Modified parsing function to handle both CSV and TSV files
- Updated export functionality to include all columns, even if hidden in the UI

### Fixed
- Issue with exported data not reflecting the anonymized state

## [0.3.0] - 2024-07-12
### Added
- Image preview functionality for cells containing image URLs
- Specific icons for URL and image columns in the header

### Changed
- Enhanced cell rendering to display image previews
- Improved `isImageUrl` function to handle URLs with query parameters

### Fixed
- Issue with image URLs not being properly detected due to query parameters

## [0.2.0] - 2024-07-12
### Added
- Column visibility toggle feature
- Search functionality for column selection
- "Hide all" and "Show all" buttons for quick column visibility actions

### Changed
- Updated table rendering to respect column visibility settings
- Modified export functionality to include hidden columns

## [0.1.0] - 2024-07-12
### Added
- Initial project setup
- CSV file parsing functionality
- Table rendering with resizable columns
- Data anonymization features
- Basic export functionality (CSV only)
- Column width calculation based on content
- Icons in table headers to identify data types (e.g., email, phone, name, URL, image)

### Changed
- Improved table styling for better readability
- Enhanced anonymization process to handle different data types
- Enhanced header rendering to include type-specific icons

Note: Dates are approximate based on our conversation timeline. Please adjust as necessary.
