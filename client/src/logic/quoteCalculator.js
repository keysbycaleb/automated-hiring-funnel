/**
 * The "Brain" of the quote calculator.
 * This file contains all the business logic for calculating a quote.
 */

/**
 * Calculates the final quote numbers based on all inputs.
 * @param {object} quoteData - The "locked" variables (e.g., { hours, discountPct }).
 * @param {object} configData - The live business rules (e.g., { baseHourlyRate, tiers, paymentPlans }).
 * @param {string} selectedTierId - The 'id' of the chosen tier (e.g., "growth").
 * @param {string} selectedPlanId - The 'id' of the chosen plan (e.g., "12mo").
 * @returns {object} An object with all the final calculated values.
 */
export function calculateQuote(quoteData, configData, selectedTierId, selectedPlanId) {
  // Default values to prevent crashes if data is missing
  const defaults = {
    finalSetupFee: 0,
    finalMonthlyFee: 0,
    tierName: 'N/A',
    planName: 'N/A',
    features: [],
    discountApplied: 0,
    baseSetup: 0,
    hoursCost: 0,
  };

  // Find the selected objects from the config
  const tier = configData?.tiers?.find((t) => t.id === selectedTierId);
  const plan = configData?.paymentPlans?.find((p) => p.id === selectedPlanId);

  // If we can't find the tier or plan, return defaults
  if (!tier || !plan) {
    return defaults;
  }

  // --- Start Calculation Logic ---

  // 1. Calculate Base Setup Fee
  const baseSetup = tier.setupFee;
  const hoursCost = (quoteData.hours || 0) * (configData.baseHourlyRate || 0);
  const totalInitialCost = baseSetup + hoursCost;

  // 2. Apply "Locked" Project Discount
  const projectDiscountPercent = quoteData.discountPct || 0;
  const projectDiscount = totalInitialCost * (projectDiscountPercent / 100);
  const discountedInitialCost = totalInitialCost - projectDiscount;

  // 3. Apply Payment Plan Discount
  // (Assuming plan discount applies to *both* setup and monthly, or just setup)
  // For this example, let's say it applies to the setup fee.
  const planDiscountPercent = plan.discount || 0;
  const planDiscountAmount = discountedInitialCost * planDiscountPercent;

  // 4. Final Totals
  const finalSetupFee = discountedInitialCost - planDiscountAmount;
  const finalMonthlyFee = tier.price; // Monthly fee is flat

  return {
    finalSetupFee: finalSetupFee,
    finalMonthlyFee: finalMonthlyFee,
    tierName: tier.name,
    planName: plan.name,
    features: tier.features ? tier.features.split('\n') : [],
    // Provide extra data for the UI
    discountApplied: projectDiscount + planDiscountAmount,
    baseSetup: baseSetup,
    hoursCost: hoursCost,
  };
}
