const fs = require('fs');
const videos = JSON.parse(fs.readFileSync('assets/instagram-downloads/bulk/new_videos.json', 'utf8'));
const tsFile = fs.readFileSync('src/utils/dummyShorts.ts', 'utf8');

// Build TypeScript entries
const entries = videos.map(v => {
  const tags = JSON.stringify(v.tags);
  return `  {
    "videoId": "${v.videoId}",
    "title": "${v.title}",
    "description": "${v.description}",
    "authorId": "${v.authorId}",
    "authorName": "${v.authorName}",
    "genre": "${v.genre}",
    "tags": ${tags},
    "duration": ${v.duration},
    "viewCount": ${v.viewCount},
    "likeCount": ${v.likeCount},
    "status": "${v.status}",
    "visibility": "${v.visibility}",
    "createdAt": "${v.createdAt}",
    "thumbnailUrl": "${v.thumbnailUrl}",
    "streamUrl": "${v.streamUrl}",
    "videoUrl": "${v.videoUrl}",
    "instagramHandle": "${v.instagramHandle}",
    "linkedinHandle": "${v.linkedinHandle}",
    "twitterHandle": "${v.twitterHandle}"
  }`;
}).join(',\n');

// Insert after 'export const DUMMY_SHORTS_VIDEOS: Video[] = [\n'
const insertPoint = 'export const DUMMY_SHORTS_VIDEOS: Video[] = [\n';
const idx = tsFile.indexOf(insertPoint);
if (idx === -1) { console.error('Insert point not found!'); process.exit(1); }
const before = tsFile.substring(0, idx + insertPoint.length);
const after = tsFile.substring(idx + insertPoint.length);
const newContent = before + entries + ',\n' + after;
fs.writeFileSync('src/utils/dummyShorts.ts', newContent, 'utf8');
console.log('Prepended ' + videos.length + ' entries to dummyShorts.ts');
