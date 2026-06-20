#!/usr/bin/env python3
"""
Convert PNG images to JPG for social media meta tags
"""

from PIL import Image
import os

def convert_png_to_jpg(png_path, jpg_path, quality=85):
    """Convert PNG to JPG with optimization"""
    try:
        # Open PNG image
        img = Image.open(png_path)
        
        # Convert to RGB (JPG doesn't support transparency)
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        else:
            img = img.convert('RGB')
        
        # Save as JPG with optimization
        img.save(jpg_path, 'JPEG', quality=quality, optimize=True)
        
        # Get file sizes
        png_size = os.path.getsize(png_path) / 1024  # KB
        jpg_size = os.path.getsize(jpg_path) / 1024  # KB
        
        print(f"✅ Converted: {png_path}")
        print(f"   PNG: {png_size:.1f} KB → JPG: {jpg_size:.1f} KB")
        print(f"   Reduction: {((png_size - jpg_size) / png_size * 100):.1f}%")
        
    except Exception as e:
        print(f"❌ Error converting {png_path}: {e}")

if __name__ == "__main__":
    print("🔄 Converting PNG to JPG...\n")
    
    # Convert og-image.png
    convert_png_to_jpg(
        'frontend/public/og-image.png',
        'frontend/public/og-image.jpg',
        quality=85
    )
    
    print()
    
    # Convert twitter-image.png
    convert_png_to_jpg(
        'frontend/public/twitter-image.png',
        'frontend/public/twitter-image.jpg',
        quality=85
    )
    
    print("\n✅ Conversion complete!")
    print("\nNext steps:")
    print("1. Check file sizes: dir frontend/public/*.jpg")
    print("2. Commit: git add . && git commit -m 'convert: PNG to JPG for social media'")
    print("3. Push: git push")