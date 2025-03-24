const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const gifken = require('gifken');
const downloadAPNG = require('../utils');
const effectOptions = require('../effects.json');
const { avatarSize, gifQuality, frameDelay } = require('../config');

const createGif = async (imageUrl, effectID) => {
  try {
    const img = await loadImage(imageUrl);
    const size = avatarSize || 512;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const encoder = new GIFEncoder(size, size, 'neuquant', true);
    const quality = Math.min(30, Math.max(1, gifQuality || 10));
    
    encoder.setQuality(quality);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(frameDelay || 100);

    const effectUrl = effectOptions.find((effect) => effect.id === effectID);
    if (!effectUrl) {
      throw new Error(`Effect with ID ${effectID} not found.`);
    }

    const frames = await downloadAPNG(effectUrl.url);
    console.log(`Processing effect: ${effectUrl.label || effectID} with ${frames.length} frames`);

    if (!frames || frames.length === 0) {
      throw new Error('No frames were downloaded from the effect URL');
    }

    const frameTimeout = 8000;

    for (const frameFile of frames) {
      const frameProcessPromise = new Promise(async (resolve, reject) => {
        try {
          const buffer = await frameFile.toFormat('png').toBuffer();
          const frameImage = await loadImage(buffer);

          ctx.clearRect(0, 0, size, size);
          
          ctx.drawImage(img, 0, 0, size, size);
          
          ctx.drawImage(frameImage, 0, 0, size, size);

          encoder.addFrame(ctx);
          resolve();
        } catch (frameError) {
          reject(frameError);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Frame processing timed out')), frameTimeout);
      });

      await Promise.race([frameProcessPromise, timeoutPromise]);
    }

    encoder.finish();
    const buffer = encoder.out.getData();
    
    try {
      return Buffer.from(buffer);
    } catch (reverseError) {
      console.warn('Could not process GIF effects:', reverseError.message);
      return Buffer.from(buffer);
    }
  } catch (error) {
    console.error('Error creating GIF:', error);
    
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    return null;
  }
};

module.exports = {
  createGif
};