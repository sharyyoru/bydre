# Collage Maker

A professional photo collage maker tool for creating high-resolution print-ready collages.

## Features

- **Shape Templates**: Pre-made shapes (heart, circle, star, square, rectangle) + custom SVG upload
- **High-Resolution Export**: 200 DPI PNG exports (~15,700px) suitable for 2-meter print boards
- **Image Management**: Upload up to 500 images with drag-and-drop reordering
- **Visual Effects**: Original colors, black & white, or gradient overlay
- **Grid Layout**: Customizable rows, columns, and padding
- **Project Management**: Save and load collage projects
- **Dual Access**: Available from workspace context or globally

## Usage

### Accessing the Tool

**Workspace Context:**
```
/workspace/[id]/tools/collage-maker
```

**Global Access:**
```
/tools/collage-maker
```

### Creating a Collage

1. **Select a Shape**: Choose from pre-made templates or upload a custom SVG
2. **Add Images**: Drag & drop or click to upload images (max 500)
3. **Adjust Layout**: Configure grid size and padding
4. **Apply Effects**: Choose color, B&W, or gradient overlay
5. **Export**: Generate high-resolution PNG (200 DPI)

### Saving Projects

- Click "Save Project" to store your collage configuration
- Projects include all images, settings, and shape data
- Load saved projects from the "Load Project" button

## Technical Details

### Export Specifications

- **Resolution**: ~15,700 × 15,700 pixels
- **DPI**: 200 (print quality)
- **Format**: PNG (lossless)
- **File Size**: ~50-100MB
- **Print Size**: 2 meters (78.74 inches)

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance

- **Preview**: 72 DPI for fast rendering
- **Export**: 200 DPI for print quality
- **Max Images**: 500 images
- **Export Time**: 20-40 seconds

## Components

- `shape-selector.tsx` - Shape template and custom SVG upload
- `image-library.tsx` - Image upload and management
- `controls-panel.tsx` - Layout and effect settings
- `collage-canvas.tsx` - Canvas preview rendering
- `project-manager.tsx` - Save/load project functionality
- `export-dialog.tsx` - Export progress and completion

## API Endpoints

- `GET /api/collage/projects` - List user's projects
- `POST /api/collage/projects` - Create new project
- `GET /api/collage/projects/[id]` - Get project details
- `PATCH /api/collage/projects/[id]` - Update project
- `DELETE /api/collage/projects/[id]` - Delete project

## Database Schema

### collage_projects

- `id` - UUID primary key
- `user_id` - User reference
- `workspace_id` - Workspace reference (nullable)
- `name` - Project name
- `shape_type` - 'template' or 'custom'
- `shape_name` - Template name (if applicable)
- `shape_svg_path` - SVG path data
- `images` - JSONB array of image data
- `settings` - JSONB layout and effect settings
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Future Enhancements

- Text overlay (titles, names, captions)
- Background decorations and patterns
- Undo/redo functionality
- Advanced layouts (mosaic, variable-size)
- Additional export formats (JPEG, PDF)
- Mobile-optimized interface
- Collaborative editing
- AI-powered image arrangement
