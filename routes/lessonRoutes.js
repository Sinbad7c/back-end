const express = require('express');
const router = express.Router();
const { getDB } = require('../conf/db');

// GET all lessons
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const lessons = await db.collection('lessons').find().toArray();
        console.log('Fetched lessons:', lessons); // Debug log
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).send('Error fetching lessons');
    }
});

// GET: Search lessons
router.get('/search', async (req, res) => {
    try {
        const query = req.query.query || '';
        const db = getDB();
        const lessons = await db
            .collection('lessons')
            .find({ subject: { $regex: query, $options: 'i' } }) // Case-insensitive partial match
            .project({ _id: 0 }) // Exclude `_id`
            .toArray();

        // Prepend backend URL to imagePath
        lessons.forEach((lesson) => {
            if (!lesson.imagePath.startsWith('http://localhost:3000')) {
                lesson.imagePath = `http://localhost:3000${lesson.imagePath}`;
            }
        });

        console.log("Modified Lessons:", lessons); // Debug the output
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Error searching lessons:', error);
        res.status(500).send('Error searching lessons');
    }
});







// POST: Add to cart
router.post('/cart/add', async (req, res) => {
    const { lessonId, quantity } = req.body;

    try {
        const db = getDB();
        const query = { id: Number(lessonId) };

        const lesson = await db.collection('lessons').findOne(query);
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (lesson.spaces < quantity) {
            return res.status(400).json({ error: 'Not enough spaces available' });
        }

        const newSpaces = lesson.spaces - quantity;
        const updateResult = await db.collection('lessons').updateOne(query, { $set: { spaces: newSpaces } });

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ error: 'Error updating cart' });
        }

        const updatedLesson = await db.collection('lessons').findOne(query);
        res.status(200).json({ message: 'Item added to cart', lesson: updatedLesson });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Error adding to cart' });
    }
});

// POST: Remove from cart
router.post('/cart/remove', async (req, res) => {
    const { lessonId, quantity } = req.body;

    try {
        const db = getDB();
        const query = { id: Number(lessonId) };

        const lesson = await db.collection('lessons').findOne(query);
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const newSpaces = lesson.spaces + Math.abs(quantity);
        const updateResult = await db.collection('lessons').updateOne(query, { $set: { spaces: newSpaces } });

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ error: 'Error updating cart' });
        }

        const updatedLesson = await db.collection('lessons').findOne(query);
        res.status(200).json({ message: 'Item removed from cart', lesson: updatedLesson });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Error removing from cart' });
    }
});






// PUT: Update lesson details (e.g., name, price, spaces, etc.)
router.put('/update/:id', async (req, res) => {
    const lessonId = parseInt(req.params.id, 10);
    const updateData = req.body; // Example: { name: 'New Lesson Name', price: 50, spaces: 20 }

    try {
        const db = getDB();
        const query = { id: lessonId };

        // Find the lesson to confirm it exists
        const lesson = await db.collection('lessons').findOne(query);
        if (!lesson) {
            return res.status(404).json({ error: `Lesson with ID ${lessonId} not found` });
        }

        // Update the lesson with new details
        const updateResult = await db.collection('lessons').updateOne(query, { $set: updateData });

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ error: 'Failed to update lesson' });
        }

        // Return the updated lesson
        const updatedLesson = await db.collection('lessons').findOne(query);
        res.status(200).json({ message: 'Lesson updated successfully', lesson: updatedLesson });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ error: 'Error updating lesson' });
    }
});


// POST: Fetch multiple lessons by their IDs
router.post('/cart/lessons', async (req, res) => {
    const { lessonIds } = req.body;

    // Validate input: lessonIds should be a non-empty array
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
        return res.status(400).json({ error: 'Invalid lessonIds. Must be a non-empty array.' });
    }

    try {
        const db = getDB(); // Get the database instance
        const lessons = await db.collection('lessons').find({ id: { $in: lessonIds } }).toArray();

        // If no lessons are found, return an error
        if (!lessons || lessons.length === 0) {
            return res.status(404).json({ error: 'No lessons found for the provided IDs.' });
        }

        // Return the lessons as JSON
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Error fetching lessons for cart:', error);
        res.status(500).json({ error: 'Error fetching lessons for cart.' });
    }
});




module.exports = router;
