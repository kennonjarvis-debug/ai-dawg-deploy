#!/bin/bash
# Extract notes from macOS Notes database

DB_PATH="/Users/benkennon/Library/Group Containers/group.com.apple.notes/NoteStore.sqlite"
EXPORT_DIR="/tmp/notes-export"

# Clean and recreate export directory
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

echo "🗄️  Extracting notes from macOS Notes database..."
echo "Database: $DB_PATH"
echo "Output: $EXPORT_DIR"
echo ""

# Extract notes (titles and content)
# Notes are stored with gzip-compressed content in ZDATA
sqlite3 "$DB_PATH" << 'SQL' | while IFS='|' read -r title content; do
SELECT
    ZICCLOUDSYNCINGOBJECT.ZTITLE1,
    ZICNOTEDATA.ZDATA
FROM ZICCLOUDSYNCINGOBJECT
LEFT JOIN ZICNOTEDATA ON ZICCLOUDSYNCINGOBJECT.ZNOTEDATA = ZICNOTEDATA.Z_PK
WHERE ZICCLOUDSYNCINGOBJECT.ZTITLE1 IS NOT NULL
  AND ZICCLOUDSYNCINGOBJECT.ZMARKEDFORDELETION = 0
ORDER BY ZICCLOUDSYNCINGOBJECT.ZMODIFICATIONDATE1 DESC;
SQL
    if [ -n "$title" ] && [ -n "$content" ]; then
        # Sanitize filename
        filename=$(echo "$title" | tr '/' '-' | tr ':' '-' | head -c 200).txt

        # Extract text content (Notes uses protobuf format, we'll get what we can)
        echo "$content" | strings | grep -v "^$" > "$EXPORT_DIR/$filename" 2>/dev/null

        if [ -s "$EXPORT_DIR/$filename" ]; then
            echo "✅ Exported: $filename"
        fi
    fi
done

# Count exported files
count=$(ls -1 "$EXPORT_DIR" 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "📊 Exported $count notes to $EXPORT_DIR"
