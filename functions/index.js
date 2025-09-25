/* eslint-disable guard-for-in */
/* eslint-disable indent */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable no-trailing-spaces */
/* eslint-disable object-curly-spacing */

// Use robust, top-level imports
const functions = require("firebase-functions");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

// Define the Gemini API Key as a secret
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Helper function to call the Gemini API
async function callGeminiAPI(apiKey, rubric, answer, points) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are an expert hiring assistant. Your task is to analyze a job applicant's response to a behavioral question.
    This question is worth a total of ${points} points.

    The applicant's answer is:
    "${answer}"

    Analyze the text above and provide a JSON object with two keys: "trait_scores" and "analysis".
    - The "trait_scores" object should contain a score for each of the following traits, where each score is between 0 and ${points}:
        - ${rubric.join("\n- ")}
    - The "analysis" object should contain a brief, one-sentence justification for each of the trait scores, using the trait name as the key.

    Provide your response ONLY in a valid JSON format.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    functions.logger.info("Gemini response received:", { responseText: text });
    return JSON.parse(text);
  } catch (error) {
    functions.logger.error("Error calling Gemini API:", { error: error.toString(), answer: answer });
    return null;
  }
}

exports.processNewApplicant = onDocumentCreated(
  {
    document: "users/{userId}/applicants/{applicantId}",
    secrets: [GEMINI_API_KEY], // Make the secret available
  },
  async (event) => {
    const { userId, applicantId } = event.params;
    const applicantData = event.data.data();
    const applicantAnswers = applicantData.answers || {};

    // 1. Fetch all questions for the user to create a comprehensive rubric
    const questionsSnapshot = await db.collection(`users/${userId}/questionnaire`).get();
    if (questionsSnapshot.empty) {
        functions.logger.error(`No questionnaire found for user ${userId}.`);
        return;
    }
    const allQuestions = {};
    questionsSnapshot.forEach((doc) => {
        allQuestions[doc.id] = doc.data();
    });
    

    // 2. Extract Contact Info and Score Questions
    let manualScore = 0;
    const aiAnalysis = {};
    const contactInfo = {};

    for (const questionId in applicantAnswers) {
      const question = allQuestions[questionId];
      const answer = applicantAnswers[questionId];
      if (!question) continue;

      // Handle Contact Info by looking at the question text
      if (question.type === "short-text") {
        const lowerCaseQuestion = question.question.toLowerCase();
        if (lowerCaseQuestion.includes("name")) contactInfo.name = answer;
        if (lowerCaseQuestion.includes("email")) contactInfo.email = answer;
        if (lowerCaseQuestion.includes("phone")) contactInfo.phone = answer;
        continue; // Don't score contact questions
      }

      // Handle Scored Questions
      if (question.type === "checkbox-group") {
        for (const optionValue in answer) {
          if (answer[optionValue]) {
            const matchedOption = question.options.find((opt) => opt.value === optionValue);
            if (matchedOption && matchedOption.points) manualScore += matchedOption.points;
          }
        }
      } else if (question.type === "radio") {
        const matchedOption = question.options.find((opt) => opt.value === answer);
        if (matchedOption && matchedOption.points) manualScore += matchedOption.points;
      } else if (question.type === "long-text-ai" && answer) {
        functions.logger.info(`Processing AI question ${questionId} for applicant ${applicantId}`);
        const aiScoresAndAnalysis = await callGeminiAPI(GEMINI_API_KEY.value(), question.scoringRubric, answer, question.points);
        if (aiScoresAndAnalysis) {
          aiAnalysis[questionId] = aiScoresAndAnalysis;
        }
      }
    }

    // 3. Tally Final Score
    let totalAiScore = 0;
    for (const qid in aiAnalysis) {
      const questionAnalysis = aiAnalysis[qid];
      if (questionAnalysis && questionAnalysis.trait_scores) {
        const traitScores = Object.values(questionAnalysis.trait_scores);
        if (traitScores.length > 0) {
          const sumOfTraitScores = traitScores.reduce((acc, score) => acc + (Number(score) || 0), 0);
          totalAiScore += sumOfTraitScores / traitScores.length;
        }
      }
    }
    const totalScore = manualScore + Math.round(totalAiScore);

    // 4. Decision Logic
    const userProfileDoc = await db.collection("users").doc(userId).get();
    const scoreThreshold = userProfileDoc.data()?.scoreThreshold || 75;
    const status = totalScore >= scoreThreshold ? "Interview" : "Review";

    // 5. Update Firestore with all data
    functions.logger.log(`Updating applicant ${applicantId} with final score: ${totalScore} and status: ${status}`);
    return db.collection(`users/${userId}/applicants`).doc(applicantId).update({
      score: totalScore,
      manualScore: manualScore,
      aiAnalysis: aiAnalysis,
      status: status,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...contactInfo, // Add name, email, phone to the applicant document
    });
  },
);
