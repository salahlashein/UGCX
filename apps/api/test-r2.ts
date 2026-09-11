import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testR2() {
  try {
    console.log('Testing R2 connection...');
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error('Missing R2 environment variables');
      return;
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Bucket: ${bucketName}`);

    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const testKey = `test-upload-${Date.now()}.txt`;
    
    // 1. Generate Presigned URL
    console.log('1. Generating presigned URL...');
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      ContentType: 'text/plain',
    });
    
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log('Presigned URL generated successfully.');

    // 2. Upload a test file using the presigned URL
    console.log('2. Uploading a test file via presigned URL...');
    
    // Using fetch since it's available in Node 18+
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Hello from UGCX R2 Test!',
    });
    
    if (uploadResponse.ok) {
      console.log('Test file uploaded successfully to R2!');
    } else {
      console.error('Failed to upload file:', uploadResponse.status, uploadResponse.statusText);
      const text = await uploadResponse.text();
      console.error('Response:', text);
    }
    
    // 3. Test public access URL (if configured)
    const publicUrl = process.env.R2_PUBLIC_BASE_URL;
    if (publicUrl) {
      console.log(`3. Testing public read access via: ${publicUrl}/${testKey}`);
      try {
         const fetchResponse = await fetch(`${publicUrl}/${testKey}`);
         if (fetchResponse.ok) {
             const text = await fetchResponse.text();
             if (text === 'Hello from UGCX R2 Test!') {
                console.log('✅ Public read access is working correctly!');
             } else {
                console.error('❌ Content mismatch when fetching via public URL.');
             }
         } else {
            console.error('❌ Failed to fetch via public URL. Check if public access is enabled for the bucket or if the URL is correct.');
            console.error(fetchResponse.status, fetchResponse.statusText);
         }
      } catch (err: any) {
         console.error('❌ Request to public URL failed.');
         console.error(err.message);
      }
    }

  } catch (error) {
    console.error('❌ R2 Test failed:', error);
  }
}

testR2();
