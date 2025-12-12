#!/bin/bash

# Thumbnail Optimization Script
# Converts and optimizes game thumbnails for better web performance

set -e

# Configuration (can be overridden with arguments)
MAX_WIDTH=${1:-600}
QUALITY=${2:-85}
FORMAT=${3:-webp}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Statistics
OPTIMIZED=0
FAILED=0
SKIPPED=0
TOTAL_SAVED=0

echo -e "${BLUE}🎨 Thumbnail Optimization Tool${NC}"
echo "=================================="
echo -e "Format: ${GREEN}$FORMAT${NC}"
echo -e "Max width: ${GREEN}${MAX_WIDTH}px${NC}"
echo -e "Quality: ${GREEN}${QUALITY}%${NC}"
echo ""

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

echo "Checking required tools..."

if [[ "$FORMAT" == "webp" ]]; then
    if ! check_tool cwebp; then
        echo "Install webp tools:"
        echo "  macOS: brew install webp"
        echo "  Ubuntu/Debian: sudo apt-get install webp"
        echo "  Windows: Download from https://developers.google.com/speed/webp/download"
        exit 1
    fi
fi

if ! check_tool convert; then
    echo "Install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

echo -e "${GREEN}✅ All required tools installed${NC}"
echo ""

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$(( bytes / 1024 ))KB"
    else
        echo "$(( bytes / 1048576 ))MB"
    fi
}

# Function to optimize a single file
optimize_file() {
    local file="$1"
    local dir=$(dirname "$file")
    local base=$(basename "$file")
    local ext="${base##*.}"

    echo -e "${YELLOW}Processing:${NC} $file"

    # Check if already optimized
    if [[ "$ext" == "$FORMAT" ]]; then
        local current_width=$(identify -format "%w" "$file" 2>/dev/null || echo "0")
        if [[ "$current_width" -le "$MAX_WIDTH" ]]; then
            echo -e "  ${GREEN}✅ Already optimized, skipping${NC}"
            ((SKIPPED++))
            return
        fi
    fi

    # Get original size
    local original_size
    if [[ "$OSTYPE" == "darwin"* ]]; then
        original_size=$(stat -f%z "$file" 2>/dev/null || echo "0")
    else
        original_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
    fi

    # Create output filename
    local output="${dir}/thumbnail.${FORMAT}"
    local temp_output="${output}.tmp"

    # Convert based on format
    case "$FORMAT" in
        webp)
            if cwebp -q $QUALITY -resize $MAX_WIDTH 0 "$file" -o "$temp_output" 2>/dev/null; then
                mv "$temp_output" "$output"
                if [[ "$file" != "$output" ]]; then
                    rm -f "$file"
                fi
                local new_size
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    new_size=$(stat -f%z "$output" 2>/dev/null || echo "0")
                else
                    new_size=$(stat -c%s "$output" 2>/dev/null || echo "0")
                fi
                local saved=$((original_size - new_size))
                TOTAL_SAVED=$((TOTAL_SAVED + saved))
                echo -e "  ${GREEN}✅ Optimized: $(format_bytes $original_size) → $(format_bytes $new_size) (saved $(format_bytes $saved))${NC}"
                ((OPTIMIZED++))
            else
                echo -e "  ${RED}❌ Failed to optimize${NC}"
                ((FAILED++))
            fi
            ;;

        jpg|jpeg)
            if convert "$file" -resize ${MAX_WIDTH}x -quality $QUALITY "$temp_output" 2>/dev/null; then
                if command -v jpegoptim &> /dev/null; then
                    jpegoptim --strip-all --max=$QUALITY "$temp_output" 2>/dev/null || true
                fi
                mv "$temp_output" "$output"
                if [[ "$file" != "$output" ]]; then
                    rm -f "$file"
                fi
                local new_size
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    new_size=$(stat -f%z "$output" 2>/dev/null || echo "0")
                else
                    new_size=$(stat -c%s "$output" 2>/dev/null || echo "0")
                fi
                local saved=$((original_size - new_size))
                TOTAL_SAVED=$((TOTAL_SAVED + saved))
                echo -e "  ${GREEN}✅ Optimized: $(format_bytes $original_size) → $(format_bytes $new_size)${NC}"
                ((OPTIMIZED++))
            else
                echo -e "  ${RED}❌ Failed to optimize${NC}"
                ((FAILED++))
            fi
            ;;

        png)
            if convert "$file" -resize ${MAX_WIDTH}x "$temp_output" 2>/dev/null; then
                if command -v optipng &> /dev/null; then
                    optipng -o7 "$temp_output" 2>/dev/null || true
                fi
                mv "$temp_output" "$output"
                if [[ "$file" != "$output" ]]; then
                    rm -f "$file"
                fi
                local new_size
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    new_size=$(stat -f%z "$output" 2>/dev/null || echo "0")
                else
                    new_size=$(stat -c%s "$output" 2>/dev/null || echo "0")
                fi
                local saved=$((original_size - new_size))
                TOTAL_SAVED=$((TOTAL_SAVED + saved))
                echo -e "  ${GREEN}✅ Optimized: $(format_bytes $original_size) → $(format_bytes $new_size)${NC}"
                ((OPTIMIZED++))
            else
                echo -e "  ${RED}❌ Failed to optimize${NC}"
                ((FAILED++))
            fi
            ;;
    esac

    echo ""
}

# Find and process all thumbnails
echo "Searching for thumbnails..."
echo ""

while IFS= read -r -d $'\0' file; do
    optimize_file "$file"
done < <(find games -type f \( -name "thumbnail.jpg" -o -name "thumbnail.jpeg" -o -name "thumbnail.png" -o -name "thumbnail.gif" -o -name "thumbnail.webp" \) -print0)

# Print summary
echo "=================================="
echo -e "${BLUE}📊 Optimization Summary${NC}"
echo "=================================="
echo -e "${GREEN}✅ Optimized:${NC} $OPTIMIZED files"
echo -e "${YELLOW}⏭️  Skipped:${NC} $SKIPPED files"
echo -e "${RED}❌ Failed:${NC} $FAILED files"
echo -e "${BLUE}💾 Total saved:${NC} $(format_bytes $TOTAL_SAVED)"
echo ""

if [[ $OPTIMIZED -gt 0 ]]; then
    echo -e "${GREEN}🚀 Success! Your thumbnails have been optimized.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your website to ensure images display correctly"
    echo "2. Commit the changes: git add games && git commit -m 'Optimize thumbnails'"
    echo "3. Push to GitHub: git push"
fi
