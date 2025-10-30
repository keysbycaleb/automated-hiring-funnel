/* eslint-disable indent */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable no-trailing-spaces */
/* eslint-disable object-curly-spacing */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { PDFDocument } = require("pdf-lib");
const puppeteer = require("puppeteer"); // <-- THE FIX IS HERE
const fs = require("fs");
const path = require("path");

initializeApp();
const db = getFirestore();
const storage = getStorage();

// --- (calculatePrices helper is unchanged) ---
function calculatePrices(quoteData, configData, tier, plan) {
  if (!tier || !plan) {
    return { finalSetupFee: 0, finalMonthlyFee: 0 };
  }
  const baseSetup = tier.setupFee;
  const hoursCost = (quoteData.hours || 0) * (configData.baseHourlyRate || 0);
  const totalInitialCost = baseSetup + hoursCost;
  const projectDiscount = totalInitialCost * ((quoteData.discountPct || 0) / 100);
  const discountedInitialCost = totalInitialCost - projectDiscount;
  const planDiscountAmount = discountedInitialCost * (plan.discount || 0);
  const finalSetupFee = discountedInitialCost - planDiscountAmount;
  const finalMonthlyFee = tier.price;
  return { finalSetupFee, finalMonthlyFee };
}

// --- (replacePlaceholders helper is unchanged) ---
function replacePlaceholders(html, data) {
  return html.replace(/\[(.*?)\]/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
  });
}

// --- Helper Function: Convert HTML to PDF (UPDATED) ---
async function htmlToPdf(html) {
  // --- THE FIX IS HERE ---
  // We are using the full 'puppeteer' package,
  // so we do NOT specify any channel or executablePath.
  // It will use its own bundled browser.
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
  // -----------------------

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBytes = await page.pdf({
    format: "Letter",
    printBackground: true,
    margin: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
    },
  });
  await browser.close();
  return pdfBytes;
}

// --- (generateQuotePDF function is unchanged) ---
exports.generateQuotePDF = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to generate a PDF.",
    );
  }
  logger.info("Received data for PDF generation:", request.data);
  const { clientName, selectedTier, hours } = request.data;
  if (!clientName || !selectedTier || hours === undefined) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required data: clientName, selectedTier, or hours.",
      request.data,
    );
  }
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText(`Quote for: ${clientName}`, { x: 50, y: 700 });
  page.drawText(`Tier: ${selectedTier.name}`, { x: 50, y: 650 });
  page.drawText(`Project Hours: ${hours}`, { x: 50, y: 600 });
  const pdfBytes = await pdfDoc.save();
  const bucket = storage.bucket("quote-hub-ad40e.firebasestorage.app");
  const filePath = `quotes/${clientName.replace(/\s+/g, "_")}-${Date.now()}.pdf`;
  const file = bucket.file(filePath);
  await file.save(Buffer.from(pdfBytes), {
    metadata: {
      contentType: "application/pdf",
    },
  });
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  });
  logger.info(`PDF saved to ${url}`);
  return { pdfUrl: url };
});

// --- RENAMED AND UPDATED generateContractV2 ---
exports.generateContractV2 = onCall({
  timeoutSeconds: 300,
  memory: "1GiB",
  region: "us-central1",
  invoker: "public",
}, async (request) => {
  
  const { quoteId } = request.data;
  if (!quoteId) {
    throw new HttpsError(
      "invalid-argument",
      "Missing quoteId.",
    );
  }

  try {
    logger.info(`Fetching data for quote: ${quoteId}`);
    const quoteRef = db.collection("quotes").doc(quoteId);
    const configRef = db.collection("config").doc("main");
    const [quoteSnap, configSnap] = await Promise.all([
      quoteRef.get(),
      configRef.get(),
    ]);

    if (!quoteSnap.exists) {
      throw new Error("Quote not found.");
    }
    if (!configSnap.exists) {
      throw new Error("Config not found.");
    }

    const quoteData = quoteSnap.data();
    const configData = configSnap.data();

    const tier = configData.tiers.find((t) => t.id === quoteData.selectedTierId);
    const plan = configData.paymentPlans.find(
      (p) => p.id === quoteData.selectedPaymentId,
    );
    if (!tier || !plan) {
      throw new Error("Quote is not finalized. Missing tier or payment plan.");
    }

    const { finalSetupFee, finalMonthlyFee } = calculatePrices(
      quoteData,
      configData,
      tier,
      plan,
    );

    const today = new Date().toLocaleDateString("en-US");
    const placeholderData = {
      "Client Legal Name": quoteData.clientName,
      "SOW Effective Date": today,
      "MSA Effective Date": today,
      "Total Project Fee": `$${finalSetupFee.toFixed(2)}`,
      "Monthly Recurring Fee": `$${finalMonthlyFee.toFixed(2)}`,
      "Tier Name": tier.name,
    };

    const templates = ["SOW.html", "MSA.html", "SLA.html", "DPA.html"];
    const bucket = storage.bucket("quote-hub-ad40e.firebasestorage.app");
    const generatedDocs = [];

    for (const templateName of templates) {
      logger.info(`Generating ${templateName}...`);
      
      const templatePath = path.join(__dirname, "templates", templateName);
      const htmlTemplate = fs.readFileSync(templatePath, "utf8");
      
      const finalHtml = replacePlaceholders(htmlTemplate, placeholderData);
      
      const pdfBytes = await htmlToPdf(finalHtml);
      
      const safeClientName = quoteData.clientName.replace(/\s+/g, "_");
      const fileName = `${safeClientName}-${templateName.replace(".html", "")}-${quoteId}.pdf`;
      const filePath = `contracts/${quoteId}/${fileName}`;
      const file = bucket.file(filePath);

      await file.save(Buffer.from(pdfBytes), {
        metadata: { contentType: "application/pdf" },
      });

      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });
      
      generatedDocs.push({ name: templateName.replace(".html", ""), url: url });
    }

    await quoteRef.update({
      status: "Signed",
      contractDocs: generatedDocs,
    });

    logger.info("Successfully generated all documents.");
    return {
      status: "success",
      documents: generatedDocs,
    };
  } catch (err) {
    logger.error("Contract Generation FAILED:", err);
    throw new HttpsError(
      "internal",
      err.message,
    );
  }
});
