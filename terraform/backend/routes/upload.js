/**
 * Video Upload Routes (AWS S3 & DynamoDB version)
 * Handles S3 Pre-signed URL generation and metadata management
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const router = express.Router();

// Initialize AWS clients
const { getS3Client, getDDBDocClient, S3_BUCKET, DYNAMODB_TABLE } = require('../config/aws');

/**
 * POST /api/upload/sas-token (Legacy name, now generates S3 Pre-signed URL)
 */
router.post('/sas-token', async (req, res, next) => {
  try {
    const { fileName, videoId, userId, folder } = req.body;

    if (!fileName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fileName', 'userId']
      });
    }

    const baseFolder = folder ? folder : userId;
    const s3Key = videoId || `${baseFolder}/${Date.now()}_${uuidv4()}_${fileName}`;
    const bucketName = S3_BUCKET;
    const region = process.env.AWS_REGION || "ap-south-1";

    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: 'video/mp4'
    });

    // Generate Pre-signed URL (valid for 24 hours)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 });

    res.status(200).json({
      success: true,
      sasUrl: signedUrl, // Keep name for frontend compatibility
      blobName: s3Key,
      containerName: bucketName,
      storageAccountName: 'AWS-S3',
      expiresIn: '24 hours',
      uploadInstructions: {
        method: 'PUT',
        url: signedUrl,
        headers: {
          'Content-Type': 'video/mp4'
        }
      }
    });
  } catch (error) {
    console.error('Error generating S3 pre-signed URL:', error);
    next(error);
  }
});

/**
 * POST /api/upload/video
 */
router.post('/video', async (req, res, next) => {
  try {
    const { 
      blobName, // this is the s3Key
      userId, 
      title, 
      description, 
      duration, 
      thumbnail,
      tags,
      originalName
    } = req.body;

    if (!blobName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['blobName', 'userId']
      });
    }

    const videoId = uuidv4();
    const timestamp = new Date().toISOString();
    const region = process.env.AWS_REGION || "ap-south-1";
    const s3Url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${blobName}`;

    const metadata = {
      id: videoId, // Partition Key
      videoId: videoId,
      userId: userId, // For GSI if needed
      originalName: originalName || title || 'Untitled Video',
      s3Url: s3Url,
      blobUrl: s3Url, // Legacy name
      uploadedAt: timestamp,
      s3Key: blobName,
      blobName: blobName, // Legacy name
      title: title || 'Untitled Video',
      description: description || '',
      duration: duration || 0,
      thumbnail: thumbnail || null,
      tags: tags || [],
      status: 'uploaded',
      updatedAt: timestamp,
      views: 0,
      likes: 0,
      format: 'mp4',
      cloudProvider: 'AWS S3',
      metadata: {
        createdBy: 'Aigram Backend v2.0 (AWS)',
        processingStatus: 'pending'
      }
    };

    const ddbDocClient = getDDBDocClient();
    await ddbDocClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: metadata
    }));

    res.status(201).json({
      success: true,
      message: 'Video metadata stored successfully',
      video: {
        videoId: videoId,
        userId: userId,
        originalName: metadata.originalName,
        blobUrl: s3Url,
        uploadedAt: timestamp
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/upload/metadata/:videoId
 */
router.get('/metadata/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const ddbDocClient = getDDBDocClient();
    const { Item: video } = await ddbDocClient.send(new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: { id: videoId }
    }));

    if (!video) {
      return res.status(404).json({
        error: 'Video not found',
        videoId: videoId
      });
    }

    res.status(200).json({
      success: true,
      video: video
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/upload/metadata/:videoId
 */
router.put('/metadata/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { title, description, tags, thumbnail } = req.body;

    const ddbDocClient = getDDBDocClient();
    
    await ddbDocClient.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: { id: videoId },
      UpdateExpression: "set title = :t, description = :d, tags = :tags, thumbnail = :th, updatedAt = :u",
      ExpressionAttributeValues: {
        ":t": title,
        ":d": description,
        ":tags": tags,
        ":th": thumbnail,
        ":u": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    }));

    res.status(200).json({
      success: true,
      message: 'Video metadata updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/upload/user/:userId/videos
 * Note: This requires a Global Secondary Index (GSI) on userId if id is Partition Key
 */
router.get('/user/:userId/videos', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const ddbDocClient = getDDBDocClient();
    // Assuming a GSI named 'userId-index' exists
    const { Items: videos } = await ddbDocClient.send(new QueryCommand({
      TableName: DYNAMODB_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    }));

    res.status(200).json({
      success: true,
      userId: userId,
      count: videos ? videos.length : 0,
      videos: videos || []
    });
  } catch (error) {
    // If GSI doesn't exist, fallback to Scan (not recommended for production but works for small tables)
    try {
      const { Items: videos } = await ddbDocClient.send(new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId }
      }));
      return res.status(200).json({ success: true, userId, count: videos.length, videos });
    } catch (e) {
      next(error);
    }
  }
});

/**
 * GET /api/upload/folder/:folderName
 */
router.get('/folder/:folderName', async (req, res, next) => {
  try {
    const { folderName } = req.params;
    const prefix = folderName.endsWith('/') ? folderName : `${folderName}/`;

    const ddbDocClient = getDDBDocClient();
    // Using Scan with Filter for folder lookup
    const { Items: videos } = await ddbDocClient.send(new ScanCommand({
      TableName: DYNAMODB_TABLE,
      FilterExpression: "begins_with(s3Key, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": prefix
      }
    }));

    res.status(200).json({
      success: true,
      folder: folderName,
      count: videos.length,
      videos: videos.map(v => ({
        videoId: v.id,
        userId: v.userId,
        originalName: v.originalName,
        blobUrl: v.s3Url,
        uploadedAt: v.uploadedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
