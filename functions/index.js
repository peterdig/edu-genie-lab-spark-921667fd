const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cohere = require('cohere-ai');

admin.initializeApp();

// Initialize Cohere
cohere.init(process.env.COHERE_API_KEY);

exports.generateLessonPlan = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { syllabus, grade, subject } = data;

  if (!syllabus || !grade || !subject) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: syllabus, grade, or subject'
    );
  }

  try {
    const prompt = `Generate a detailed lesson plan for ${subject} (${grade}) on the topic: ${syllabus}

Please include:
1. Learning Objectives
2. Required Materials
3. Lesson Structure (with time allocations)
4. Teaching Methods
5. Student Activities
6. Assessment Methods
7. Differentiation Strategies
8. Homework/Extension Activities

Format the response in markdown.`;

    const response = await cohere.generate({
      model: 'command',
      prompt: prompt,
      max_tokens: 800,
      temperature: 0.7,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    // Save to Realtime Database instead of Firestore
    const userId = context.auth.uid;
    const planId = Date.now().toString();
    
    await admin.database().ref(`users/${userId}/lessonPlans/${planId}`).set({
      syllabus: syllabus,
      grade: grade,
      subject: subject,
      plan: response.body.generations[0].text,
      createdAt: admin.database.ServerValue.TIMESTAMP
    });

    return response.body.generations[0].text;
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error generating lesson plan'
    );
  }
}); 