# Open Graph Image Specifications

This document provides specifications for creating social media preview images for HooksDream.

## Image Requirements

### GitHub Social Preview
- **Size**: 1280x640 pixels (2:1 ratio)
- **Format**: PNG or JPG
- **Max file size**: 1MB
- **Location**: Root directory as `og-image.png`

### Twitter Card
- **Size**: 1200x600 pixels (2:1 ratio)
- **Format**: PNG or JPG
- **Max file size**: 1MB
- **Location**: Root directory as `twitter-image.png`

### Facebook/LinkedIn
- **Size**: 1200x630 pixels (1.91:1 ratio)
- **Format**: PNG or JPG
- **Max file size**: 1MB
- **Location**: Root directory as `og-image.png`

---

## Design Guidelines

### Color Scheme
- **Primary**: #6366f1 (Indigo)
- **Secondary**: #8b5cf6 (Purple)
- **Accent**: #06b6d4 (Cyan)
- **Background**: #0f172a (Dark blue/black)
- **Text**: #ffffff (White)
- **Gradient**: Indigo to Purple to Cyan

### Typography
- **Headline Font**: Inter, Poppins, or similar modern sans-serif
- **Headline Size**: 72-96px bold
- **Subheadline Size**: 32-40px
- **Body Text**: 24-28px

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │          🚀 HooksDream                              │  │
│   │          Modern Social Media Platform               │  │
│   │                                                     │  │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │
│   │   │  React   │  │  Node.js │  │  Python  │        │  │
│   │   │   18     │  │  20.x    │  │  3.9+    │        │  │
│   │   └──────────┘  └──────────┘  └──────────┘        │  │
│   │                                                     │  │
│   │   💬 Real-time Chat  📸 Stories  🤖 AI Bot         │  │
│   │                                                     │  │
│   │   ┌──────────────────────────────────────────┐     │  │
│   │   │  Open Source • MIT License • Free         │     │  │
│   │   └──────────────────────────────────────────┘     │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Elements

### 1. Logo/Title
- **Text**: "HooksDream"
- **Font**: Bold, modern sans-serif
- **Size**: Largest element on screen
- **Color**: White with gradient effect
- **Effect**: Subtle glow or shadow

### 2. Tagline
- **Text**: "Modern Social Media Platform"
- **Font**: Medium weight sans-serif
- **Size**: 32-40px
- **Color**: Light gray/white

### 3. Tech Stack Icons
- **React**: Blue (#61DAFB)
- **Node.js**: Green (#339933)
- **Python**: Blue/Yellow (#3776AB/#FFD43B)
- **MongoDB**: Green (#47A248)
- **Socket.IO**: Black/White
- **FastAPI**: Teal (#009688)

### 4. Feature Icons
- 💬 Real-time Chat
- 📸 Stories
- 🤖 AI Automation
- 🔐 JWT Auth
- 📱 PWA
- 🎨 Tailwind CSS

### 5. Badges
- "Open Source"
- "MIT License"
- "Free to Use"

---

## Tools for Creation

### Recommended Tools
1. **Canva** (Free)
   - Template: "GitHub Social Preview"
   - Size: 1280x640
   - URL: https://www.canva.com/

2. **Figma** (Free)
   - Template: GitHub Open Graph
   - URL: https://www.figma.com/

3. **Adobe Express** (Free)
   - Template: Social Media Banner
   - URL: https://www.adobe.com/express/

4. **Photopea** (Free)
   - Online Photoshop alternative
   - URL: https://www.photopea.com/

### AI Image Generators
- **Midjourney**: "Modern tech banner, social media app, react nodejs python, dark theme, gradient purple blue, minimalist, 1280x640"
- **DALL-E 3**: "Create a GitHub social preview image for a social media platform called HooksDream built with React, Node.js, and Python"
- **Stable Diffusion**: Use prompts with "tech banner", "social media", "dark theme"

---

## Step-by-Step Creation Guide

### Using Canva (Recommended)

1. **Create New Design**
   - Go to https://www.canva.com/
   - Click "Create a design"
   - Select "Custom size" → 1280x640 pixels

2. **Background**
   - Set background color: #0f172a (dark blue)
   - Or use gradient: #6366f1 → #8b5cf6 → #06b6d4

3. **Add Title**
   - Text: "HooksDream"
   - Font: Poppins Bold, 96px
   - Color: White
   - Position: Top center

4. **Add Tagline**
   - Text: "Modern Social Media Platform"
   - Font: Poppins Medium, 36px
   - Color: #cbd5e1 (light gray)
   - Position: Below title

5. **Add Tech Icons**
   - Search for "React", "Node.js", "Python" icons
   - Size: 80x80px each
   - Arrange horizontally
   - Position: Center

6. **Add Features**
   - Icons: Chat, Camera, Robot
   - Text: "Real-time Chat", "Stories", "AI Bot"
   - Size: 24px
   - Position: Below tech icons

7. **Add Badges**
   - Text: "Open Source • MIT License"
   - Font: 24px
   - Color: #06b6d4 (cyan)
   - Position: Bottom

8. **Export**
   - Format: PNG
   - Quality: High
   - Download as `og-image.png`

### Using Figma

1. **Create New File**
   - Frame size: 1280x640
   - Name: "GitHub Social Preview"

2. **Background**
   - Rectangle fill: #0f172a
   - Add gradient overlay

3. **Text Layers**
   - Title: "HooksDream" (96px, Bold, White)
   - Subtitle: "Modern Social Media Platform" (36px, Regular, #cbd5e1)

4. **Icons**
   - Import tech stack logos
   - Use SVG format for best quality
   - Size: 80px each

5. **Export**
   - Export as PNG 2x
   - File name: `og-image.png`

---

## Alternative: Quick Text-Based Version

If you need a quick version without design tools:

```bash
# Use ImageMagick (if installed)
convert -size 1280x640 xc:#0f172a \
  -fill white -font Poppins-Bold -pointsize 96 \
  -gravity center -annotate +0-50 "HooksDream" \
  -fill #cbd5e1 -font Poppins-Regular -pointsize 36 \
  -gravity center -annotate +0+50 "Modern Social Media Platform" \
  -fill #06b6d4 -pointsize 24 \
  -gravity center -annotate +0+120 "Open Source • MIT License" \
  og-image.png
```

---

## Checklist

- [ ] Create og-image.png (1280x640)
- [ ] Create twitter-image.png (1200x600)
- [ ] Test image on GitHub repository
- [ ] Test image on Twitter Card Validator
- [ ] Test image on Facebook Debugger
- [ ] Test image on LinkedIn Post Inspector
- [ ] Optimize file size (< 1MB)
- [ ] Add alt text in README
- [ ] Upload to repository root
- [ ] Update README with correct image paths

---

## Testing Tools

### Validate Your Images
1. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Test: https://hooksdream.vercel.app

2. **Facebook Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Test: https://hooksdream.vercel.app

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Test: https://hooksdream.vercel.app

4. **Open Graph Preview**
   - URL: https://www.opengraph.xyz/
   - Test: https://hooksdream.vercel.app

---

## Best Practices

1. **Readability**
   - Ensure text is readable at small sizes
   - Use high contrast colors
   - Avoid clutter

2. **Branding**
   - Use consistent colors
   - Include project name prominently
   - Add logo if available

3. **Performance**
   - Compress images (use TinyPNG)
   - Use WebP format for web
   - Keep file size under 1MB

4. **Accessibility**
   - Add alt text: "HooksDream - Modern Social Media Platform"
   - Ensure sufficient color contrast
   - Use descriptive imagery

---

## Example Prompts for AI Generators

### Midjourney
```
Modern social media app banner, dark theme, gradient purple blue, 
React Node.js Python logos, chat and stories icons, minimalist design, 
tech aesthetic, 1280x640, GitHub social preview --ar 2:1 --v 6
```

### DALL-E 3
```
Create a professional GitHub social preview image for "HooksDream" 
social media platform. Dark background with gradient purple to blue. 
Include text "HooksDream" and "Modern Social Media Platform". 
Add icons for React, Node.js, Python. Include features: real-time chat, 
stories, AI automation. Style: modern, minimalist, tech-focused. 
Size: 1280x640 pixels.
```

### Stable Diffusion
```
GitHub social preview, social media platform, HooksDream, 
dark theme, purple blue gradient, React Node.js Python icons, 
real-time chat stories AI, modern tech aesthetic, minimalist, 
high quality, 1280x640 --ar 2:1
```

---

**Last Updated**: 2026-06-20
**Maintained by**: AbdolHamidDev
**License**: MIT