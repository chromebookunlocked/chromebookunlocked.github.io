#!/usr/bin/env python3
"""
Update thumbnail references in HTML files to use optimized format.
This script updates all thumbnail.png/jpg references to thumbnail.webp
"""

import os
import re
import sys
from pathlib import Path

def update_html_file(file_path, target_format='webp', dry_run=False):
    """Update thumbnail references in a single HTML file."""

    print(f"Processing: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ❌ Error reading file: {e}")
        return 0

    original_content = content
    changes = 0

    # Pattern to match thumbnail references
    # Matches: thumbnail.png, thumbnail.jpg, thumbnail.jpeg, thumbnail.gif
    patterns = [
        (r'thumbnail\.(png|jpg|jpeg|gif)', f'thumbnail.{target_format}'),
    ]

    for pattern, replacement in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
            changes += len(matches)

    if changes > 0:
        print(f"  ✅ Found {changes} references to update")

        if not dry_run:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  💾 Updated file")
            except Exception as e:
                print(f"  ❌ Error writing file: {e}")
                return 0
        else:
            print(f"  ℹ️  Dry run - no changes made")
    else:
        print(f"  ⏭️  No changes needed")

    return changes

def find_html_files(directory):
    """Find all HTML files in directory."""
    html_files = []
    for root, dirs, files in os.walk(directory):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))

    return html_files

def main():
    """Main function."""

    # Parse arguments
    dry_run = '--dry-run' in sys.argv or '-n' in sys.argv
    target_format = 'webp'

    if '--format' in sys.argv:
        idx = sys.argv.index('--format')
        if idx + 1 < len(sys.argv):
            target_format = sys.argv[idx + 1]

    # Get script directory and project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    print("🔄 Thumbnail Reference Updater")
    print("=" * 40)
    print(f"Target format: {target_format}")
    print(f"Dry run: {'Yes' if dry_run else 'No'}")
    print()

    # Find all HTML files
    print("Searching for HTML files...")
    html_files = find_html_files(project_root)
    print(f"Found {len(html_files)} HTML files")
    print()

    # Update each file
    total_changes = 0
    for html_file in html_files:
        changes = update_html_file(html_file, target_format, dry_run)
        total_changes += changes
        print()

    # Summary
    print("=" * 40)
    print("📊 Summary")
    print("=" * 40)
    print(f"Files processed: {len(html_files)}")
    print(f"Total references updated: {total_changes}")

    if total_changes > 0:
        if dry_run:
            print()
            print("ℹ️  This was a dry run. Run without --dry-run to apply changes.")
        else:
            print()
            print("✅ All references updated successfully!")
            print()
            print("Next steps:")
            print("1. Test your website to ensure images display correctly")
            print("2. Commit the changes: git add *.html && git commit -m 'Update thumbnail references'")
    else:
        print()
        print("ℹ️  No changes needed - all references are already up to date!")

if __name__ == '__main__':
    if '--help' in sys.argv or '-h' in sys.argv:
        print("""
Usage: python3 update-thumbnail-references.py [OPTIONS]

Update thumbnail references in HTML files to use optimized format.

Options:
  --format FORMAT    Target format (default: webp)
  --dry-run, -n      Show what would be changed without making changes
  --help, -h         Show this help message

Examples:
  # Dry run to see what would change
  python3 update-thumbnail-references.py --dry-run

  # Update all references to webp
  python3 update-thumbnail-references.py

  # Update all references to jpg
  python3 update-thumbnail-references.py --format jpg
        """)
        sys.exit(0)

    main()
