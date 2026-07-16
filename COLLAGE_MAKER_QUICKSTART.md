# Collage Maker - Quick Start Guide

## 🚀 Getting Started

### 1. Run Database Migration

Apply the database migration to create the required tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard
# Navigate to SQL Editor and run: supabase/migrations/0016_collage_maker.sql
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access the Tool

**Option A: Workspace Context**
```
http://localhost:3000/workspace/[your-workspace-id]/tools/collage-maker
```

**Option B: Global Access**
```
http://localhost:3000/tools/collage-maker
```

## 📸 Creating Your First Collage

### Step 1: Select a Shape
- Choose from 5 pre-made templates (Heart, Circle, Star, Square, Rectangle)
- Or upload your own custom SVG file

### Step 2: Add Images
- Drag and drop images into the upload zone
- Or click to browse and select files
- Supports: JPEG, PNG, WebP, GIF
- Max: 500 images

### Step 3: Customize Layout
- Adjust **Grid Columns** (5-50)
- Adjust **Grid Rows** (5-50)
- Set **Padding** between images (0-20px)

### Step 4: Apply Effects
- **Original Colors**: Keep images as-is
- **Black & White**: Convert to grayscale
- **Gradient Overlay**: Apply custom color gradient

### Step 5: Export
- Click **"Export PNG (200 DPI)"**
- Wait 20-40 seconds for processing
- Download your high-resolution collage!

## 💾 Saving Projects

### Save Current Work
1. Click **"Save Project"** button
2. Enter a project name
3. Click **"Save"**

### Load Saved Project
1. Click **"Load Project"** button
2. Select from your saved projects
3. Click **"Load"**

## 🎨 Tips & Tricks

### For Best Results
- Use high-quality source images (at least 1000px)
- Keep image count under 300 for faster preview
- Use similar aspect ratios for cleaner grids
- Test with fewer images first before adding all 500

### Performance Tips
- Preview updates automatically (300ms debounce)
- Export happens in background
- Close other browser tabs during export
- Use Chrome or Edge for best performance

### Custom SVG Shapes
- SVG must contain `<path>` elements
- Ensure SVG has valid `viewBox` attribute
- Test with simple shapes first
- Complex shapes may slow rendering

## 📐 Export Specifications

### Print Quality
- **Resolution**: 15,748 × 15,748 pixels
- **DPI**: 200 (professional print quality)
- **Format**: PNG (lossless)
- **Print Size**: 2 meters (78.74 inches)
- **File Size**: 50-100 MB

### Recommended Print Settings
- **Material**: Canvas, poster board, vinyl
- **Finish**: Matte or glossy
- **Mounting**: Foam board or frame
- **Viewing Distance**: 3-10 feet

## 🐛 Troubleshooting

### Images Not Showing
- Check file format (JPEG, PNG, WebP, GIF only)
- Ensure file size < 50MB per image
- Try refreshing the page

### Export Failed
- Reduce number of images
- Try a simpler shape
- Check browser console for errors
- Ensure stable internet connection

### Preview Slow
- Reduce grid size (fewer rows/cols)
- Use fewer images for testing
- Close other browser tabs
- Try a different browser

### Custom SVG Not Working
- Ensure SVG contains `<path>` elements
- Check for valid `viewBox` attribute
- Simplify complex paths
- Try a pre-made template first

## 🔧 Technical Details

### Browser Requirements
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### System Requirements
- 8GB RAM minimum
- Modern GPU for canvas rendering
- Stable internet connection
- 500MB free disk space

### File Limits
- Max images: 500
- Max file size per image: 50MB
- Max canvas size: 16,384px (browser limit)
- Export size: ~15,700px (within limits)

## 📚 Additional Resources

- **Component Documentation**: `src/components/tools/collage-maker/README.md`
- **Implementation Details**: `COLLAGE_MAKER_IMPLEMENTATION.md`
- **Full Plan**: `.windsurf/plans/collage-maker-tool-3bf819.md`

## 🎯 Example Use Cases

### Team Photo Collage
1. Upload team member photos
2. Use Heart or Circle shape
3. Apply B&W effect for uniformity
4. Export for office wall display

### Event Memories
1. Upload event photos
2. Use Square or Rectangle shape
3. Keep original colors
4. Export for photo book or poster

### Product Showcase
1. Upload product images
2. Use custom brand logo as shape
3. Apply gradient in brand colors
4. Export for marketing materials

## 🚨 Known Limitations

- PNG export only (no JPEG or PDF yet)
- Desktop-optimized (mobile support limited)
- No text overlay feature (coming soon)
- No undo/redo (save frequently!)

## 💡 Feature Requests

Have ideas for improvements? Consider these future enhancements:
- Text overlay with custom fonts
- Background decorations
- Multiple export formats
- Mobile optimization
- Collaborative editing
- AI-powered arrangement

---

**Need Help?** Check the console for error messages or review the implementation documentation.

**Ready to Create?** Start at `/tools/collage-maker` and make something amazing! 🎨
