const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');
const db = require('../config/database');
require('dotenv').config();

// Initialize OpenRouter configuration
const configuration = new Configuration({
    apiKey: process.env.OPENROUTER_API_KEY,
    basePath: 'https://openrouter.ai/api/v1',
});

const openai = new OpenAIApi(configuration);

// Chat modes
const MODES = {
    QUIZ: 'quiz',
    TUTOR: 'tutor'
};

// Computer Essentials module topics
const TOPICS = [
    'Hardware components',
    'Software and operating systems',
    'Computer networks',
    'ICT in everyday life',
    'Health, safety and environment',
    'Security and well-being'
];

// Helper function to generate system message based on mode
function getSystemMessage(mode, topic) {
    if (mode === MODES.QUIZ) {
        return `You are an ICDL examination expert focusing on Computer Essentials module, specifically on ${topic}. Ask challenging but fair questions to test the student's knowledge. Provide feedback on their answers and explain any misconceptions.`;
    } else {
        return `You are a patient and knowledgeable ICDL tutor focusing on Computer Essentials module, specifically on ${topic}. Explain concepts clearly, use examples, and encourage questions. Adapt your teaching style based on the student's responses and understanding level.`;
    }
}

// Chat endpoint
router.post('/:mode', async (req, res) => {
    try {
        const { mode } = req.params;
        const { message, topic } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!Object.values(MODES).includes(mode)) {
            return res.status(400).json({ error: 'Invalid mode' });
        }

        if (!TOPICS.includes(topic)) {
            return res.status(400).json({ error: 'Invalid topic' });
        }

        // Get conversation history if user is authenticated
        let conversationHistory = [];
        if (userId) {
            const query = `
                SELECT role, content FROM chat_history 
                WHERE user_id = ? AND topic = ? 
                ORDER BY timestamp DESC LIMIT 5
            `;
            conversationHistory = await new Promise((resolve, reject) => {
                db.all(query, [userId, topic], (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                });
            });
        }

        const messages = [
            { role: 'system', content: getSystemMessage(mode, topic) },
            ...conversationHistory.reverse(),
            { role: 'user', content: message }
        ];

        const completion = await openai.createChatCompletion({
            model: 'openai/gpt-3.5-turbo',
            messages: messages,
        });

        const assistantMessage = completion.data.choices[0].message.content;

        // Save conversation to history if user is authenticated
        if (userId) {
            const saveQuery = `
                INSERT INTO chat_history (user_id, topic, role, content, timestamp)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            await Promise.all([
                new Promise((resolve, reject) => {
                    db.run(saveQuery, [userId, topic, 'user', message], (err) => {
                        if (err) reject(err);
                        resolve();
                    });
                }),
                new Promise((resolve, reject) => {
                    db.run(saveQuery, [userId, topic, 'assistant', assistantMessage], (err) => {
                        if (err) reject(err);
                        resolve();
                    });
                })
            ]);
        }

        res.json({
            response: assistantMessage,
            mode: mode,
            topic: topic
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});

// Get available topics
router.get('/topics', (req, res) => {
    res.json({ topics: TOPICS });
});

module.exports = router;