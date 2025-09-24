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
async function callGeminiAPI(apiKey, rubric, answer) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert hiring assistant for a fast-paced restaurant environment. Your task is to analyze a job applicant's response to a behavioral question and score them on a scale of 0 to 10 for a specific set of traits. Provide your response ONLY in a valid JSON format, with the scores contained within a "trait_scores" object.

    The applicant's answer is:
    "${answer}"

    Analyze the text above and provide a JSON object with scores for the following traits:
    - ${rubric.join("\n- ")}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    functions.logger.info("Gemini response received:", {responseText: text});
    return JSON.parse(text);
  } catch (error) {
    functions.logger.error("Error calling Gemini API:", {error: error.toString(), answer: answer});
    return null;
  }
}

exports.processNewApplicant = onDocumentCreated(
  {
    document: "applicants/{applicantId}",
    secrets: [GEMINI_API_KEY], // Make the secret available
  },
  async (event) => {
    const applicantId = event.params.applicantId;
    const applicantData = event.data.data();

    // 1. Fetch the Scoring Rubric
    const questionnaireSnapshot = await db.collection("questionnaire").get();
    const scoringRubric = {};
    questionnaireSnapshot.forEach((doc) => {
      scoringRubric[doc.id] = doc.data();
    });

    // 2. Dynamic Scoring Engine
    let manualScore = 0;
    const aiAnalysis = {};
    const applicantAnswers = applicantData.answers;

    for (const questionId in applicantAnswers) {
      const question = scoringRubric[questionId];
      const answer = applicantAnswers[questionId];
      if (!question) continue;

      if (question.type === "checkbox-group" || question.type === "radio") {
        for (const optionValue in answer) {
          if (answer[optionValue]) {
            const matchedOption = question.options.find((opt) => opt.value === optionValue);
            if (matchedOption && matchedOption.points) {
              manualScore += matchedOption.points;
            }
          }
        }
      } else if (question.type === "long-text-ai" && answer) {
        functions.logger.info(`Processing AI question ${questionId} for applicant ${applicantId}`);
        const aiScores = await callGeminiAPI(GEMINI_API_KEY.value(), question.scoringRubric, answer);
        
        if (aiScores) {
          aiAnalysis[questionId] = aiScores.trait_scores || aiScores;
        }
      }
    }

    // 3. Tally Final Score with Averaging
    let totalAiScore = 0;
    for (const qid in aiAnalysis) {
      const traits = aiAnalysis[qid];
      const traitScores = Object.values(traits); // Get an array of the scores, e.g., [9, 10, 8]
      
      if (traitScores.length > 0) {
        // Calculate the sum of the scores
        const sumOfTraitScores = traitScores.reduce((acc, score) => acc + (score || 0), 0);
        // Calculate the average and add it to the total
        const averageScore = sumOfTraitScores / traitScores.length;
        totalAiScore += averageScore;
      }
    }
    // Round the final AI score to avoid long decimal places
    const totalScore = manualScore + Math.round(totalAiScore);

    // 4. Decision Logic
    const scoreThreshold = 75;
    let status = "";
    if (totalScore >= scoreThreshold) {
      status = "Interview Scheduled";
    } else {
      status = "Pending Manual Review";
    }

    // 5. Update Firestore
    functions.logger.log(`Updating applicant ${applicantId} with final score: ${totalScore} (Manual: ${manualScore}, AI Avg: ${totalAiScore.toFixed(2)}) and status: ${status}`);
    return db.collection("applicants").doc(applicantId).update({
      score: totalScore,
      manualScore: manualScore,
      aiAnalysis: aiAnalysis, // Storing the detailed breakdown
      status: status,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);
