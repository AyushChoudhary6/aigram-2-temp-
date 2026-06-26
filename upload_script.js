const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
const serviceAccount = require('./aigram-f2b11-firebase-adminsdk-fbsvc-0bad28b249.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
// IMPORTANT: Change this to your actual storage bucket URL from Firebase Console -> Storage
  storageBucket: 'aigram-f2b11.appspot.com' // or something like 'aigram-9a4c3.appspot.com'
});

const bucket = admin.storage().bucket();
const directoryPath = path.join(__dirname, 'assets', 'doom scrollling');
const dummyShortsPath = path.join(__dirname, 'src', 'utils', 'dummyShorts.ts');

async function uploadVideos() {
  try {
    console.log('Starting video upload...');
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.mp4'));
    
    if (files.length === 0) {
      console.log('No .mp4 files found in assets/doom scrollling');
      return;
    }

    console.log(`Found ${files.length} videos to upload.`);

    const uploadedVideos = [];

    // Process sequentially to be safe
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(directoryPath, file);
        const destination = `doom-scrolling/${file}`;
        
        console.log(`[${i+1}/${files.length}] Uploading ${file} ...`);
        
        // Upload the file
        const token = uuidv4();
        await bucket.upload(filePath, {
            destination: destination,
            metadata: {
                contentType: 'video/mp4',
                metadata: {
                    firebaseStorageDownloadTokens: token
                }
            }
        });

        // Get public URL
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`;
        
        const videoObj = {
            videoId: `short_${i+1}`,
            title: `Doom Scrolling Video ${i+1}`,
            description: `User generated content for doom scrolling #${i+1}`,
            authorId: `user_${Math.floor(Math.random() * 100)}`,
            genre: 'Entertainment',
            tags: ['DoomScroll', 'Entertainment'],
            duration: 15,
            viewCount: Math.floor(Math.random() * 50000),
            likeCount: Math.floor(Math.random() * 10000),
            status: 'APPROVED',
            visibility: 'PUBLIC',
            createdAt: new Date().toISOString(),
            thumbnailUrl: `https://via.placeholder.com/540x960?text=Video+${i+1}`,
            streamUrl: downloadUrl,
            videoUrl: downloadUrl,
        };
        
        uploadedVideos.push(videoObj);
    }

    console.log('Upload complete! Generating dummyShorts.ts with fetched URLs...');

    // Generate new dummyShorts.ts file
    const newContent = `import { Video } from '../types';

export const DUMMY_SHORTS_VIDEOS: Video[] = ${JSON.stringify(uploadedVideos, null, 2)};

export const generateDummyShorts = (count: number = 5): Video[] => {
  const max = Math.min(count, DUMMY_SHORTS_VIDEOS.length);
  return DUMMY_SHORTS_VIDEOS.slice(0, max);
};
`;

    fs.writeFileSync(dummyShortsPath, newContent);
    console.log('Successfully updated src/utils/dummyShorts.ts with Cloud Storage URLs!');
    
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

uploadVideos();