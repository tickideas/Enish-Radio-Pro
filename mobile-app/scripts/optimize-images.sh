#!/bin/bash
# Image optimization script for Expo assets
# Requires: brew install pngquant optipng

ASSETS_DIR="./assets/images"

echo "🖼️  Optimizing images in $ASSETS_DIR..."

# Compress PNGs with pngquant (lossy but high quality)
for file in "$ASSETS_DIR"/*.png; do
  if [ -f "$file" ]; then
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    pngquant --quality=65-80 --force --ext .png "$file" 2>/dev/null
    optipng -o3 -quiet "$file" 2>/dev/null
    new_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    savings=$((original_size - new_size))
    echo "  ✅ $(basename "$file"): saved $((savings / 1024))KB"
  fi
done

echo "✨ Optimization complete!"
