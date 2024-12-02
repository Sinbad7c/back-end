const express = require('express');
const router = express.Router();
const { getDB } = require('../conf/db');

// POST: Place a new order
router.post('/', async (req, res) => {
  try {
    const db = getDB();

    // Extract input fields
    const {
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      shipAsGift,
      addressType,
      lessonItems,
      totalSpent,
    } = req.body;

    console.log('Received order:', req.body); // Debug log

    // Validate empty payload
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Invalid request. No data provided.' });
    }

    // Collect errors
    const errors = [];

    // Validate Names
    const nameRegex = /^[a-zA-Z]+$/;
    if (!firstName || !nameRegex.test(firstName)) {
      errors.push('First name must contain only alphabetical characters');
    }
    if (!lastName || !nameRegex.test(lastName)) {
      errors.push('Last name must contain only alphabetical characters');
    }

    //  Validate Address Fields
    if (!address) errors.push('Address is required');
    if (!city) errors.push('City is required');
    if (!state) errors.push('State is required');

    // Validate Zip Code
    if (!zip || typeof zip !== 'number' || zip.toString().length !== 5) {
      errors.push('Zip code must be a 5-digit number');
    }

    // Validate Ship As Gift
    if (typeof shipAsGift !== 'boolean') {
      errors.push('Ship as gift must be true or false');
    }

    // Validate Address Type
    if (!addressType || !['Home', 'Office'].includes(addressType)) {
      errors.push('Address type must be Home or Office');
    }

    // Validate Lesson Items
    if (!Array.isArray(lessonItems) || lessonItems.length === 0) {
      errors.push('Lesson items must be a non-empty array');
    }

    // Validate Total Spent
    if (typeof totalSpent !== 'number' || totalSpent <= 0) {
        errors.push('Total spent must be a positive number');
      }

    // If there are errors, respond with all errors
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Check spaces availability for lessons
    for (const lesson of lessonItems) {
      const dbLesson = await db.collection('lessons').findOne({ id: lesson.id });
      if (!dbLesson) {
        return res.status(404).json({ error: `Lesson with id ${lesson.id} not found` });
      }
      if (dbLesson.spaces < lesson.spaces) {
        return res.status(400).json({
          error: `Not enough spaces available for lesson ${dbLesson.subject}`,
        });
      }
    }

    // Deduct spaces and update lessons
    for (const lesson of lessonItems) {
      await db.collection('lessons').updateOne(
        { id: lesson.id },
        { $inc: { spaces: -lesson.spaces } } // Decrease spaces
      );
    }

    // Insert the order into the database
    const newOrder = {
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      shipAsGift,
      addressType,
      lessonItems,
      totalSpent,
    };

    const result = await db.collection('orders').insertOne(newOrder);

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: result.insertedId,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Error placing order');
  }
});

module.exports = router;
