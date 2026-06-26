const fs = require('fs');
const path = require('path');

const practiceScreenPath = path.join(__dirname, 'src', 'screens', 'main', 'PracticeScreen.tsx');
let content = fs.readFileSync(practiceScreenPath, 'utf8');

// Replace ScrollView with View
content = content.replace(
  /<ScrollView\s+horizontal\s+showsHorizontalScrollIndicator=\{false\}\s+style=\{styles\.episodesScrollView\}\s+contentContainerStyle=\{styles\.episodesContainer\}\s*>/,
  '<View style={styles.episodesContainer}>'
);

// Replace closing ScrollView tag
content = content.replace(
  /(\s*)\}\)\}\s*<\/ScrollView>\s*<\/View>/,
  '$1})}\n                </View>\n              </View>'
);

// Replace Styles
content = content.replace(
  /episodesScrollView:\s*\{\s*paddingLeft:\s*SPACING\.md,\s*\},/,
  'episodesScrollView: {\n    paddingLeft: SPACING.md,\n  },'
);

content = content.replace(
  /episodesContainer:\s*\{\s*paddingRight:\s*SPACING\.md,\s*\}/,
  'episodesContainer: {\n    paddingHorizontal: SPACING.md,\n    flexDirection: \'row\',\n    flexWrap: \'wrap\',\n    justifyContent: \'space-between\',\n  }'
);

content = content.replace(
  /episodeCard:\s*\{\s*width:\s*188,\s*marginRight:\s*SPACING\.md,/,
  'episodeCard: {\n    width: \'48%\',\n    marginBottom: SPACING.md,'
);

fs.writeFileSync(practiceScreenPath, content, 'utf8');
console.log('Update complete');
