export const DRIVER_TYPE_LABELS = {
  revenueImpact: 'Revenue impact',
  riskCompliance: 'Risk and compliance',
  capacityExpansion: 'Capacity and expansion',
  contractSla: 'Contract and SLA',
  other: 'Other',
};

export const OTHER_QUESTION = 'How was this value estimated?';

export const WORKING_CAPITAL_QUESTION = 'Roughly how much cash do you have tied up in work in process inventory right now?';

export const CUSTOM_DRIVER_QUESTIONS = {
  cycleCount__inventory: {
    revenueImpact: "When's the last time a cycle count discrepancy actually cost you a sale or a delayed order?",
    riskCompliance: "When's the last time an inventory discrepancy caused a problem with an audit or a compliance check?",
    capacityExpansion: 'If counts stayed this inaccurate, would you need to add headcount or run counts more often?',
    contractSla: 'Has a customer ever penalized you or threatened to walk over an inventory accuracy problem?',
  },
  locateItems__inventory: {
    revenueImpact: "When's the last time searching for misplaced inventory actually cost you an order?",
    riskCompliance: "When's the last time lost or misplaced inventory triggered an audit finding or a write off review?",
    capacityExpansion: 'If this kept happening, would you need more warehouse staff just to search for items?',
    contractSla: 'Has a customer ever docked you or complained over a fulfillment delay caused by a search?',
  },
  audit: {
    revenueImpact: "When's the last time an audit turned up a discrepancy that actually cost you money?",
    riskCompliance: 'Has a failed or flagged audit ever put you at risk with a regulator or a customer?',
    capacityExpansion: 'At this rate, would you need more staff or more frequent audits to keep pace?',
    contractSla: 'Has a customer or regulator ever penalized you over an audit finding?',
  },
  shrinkage: {
    revenueImpact: "When's the last time unexplained inventory loss actually caused a stockout?",
    riskCompliance: 'Has shrinkage ever triggered a loss prevention investigation or a compliance review?',
    capacityExpansion: 'If shrinkage continued at this rate, would you need to add staff to catch it?',
    contractSla: 'Do you carry insurance or vendor terms with a loss threshold, and has shrinkage ever pushed you toward it?',
  },
  expiredProducts: {
    revenueImpact: "When's the last time expired inventory became a write off you couldn't recover?",
    riskCompliance: 'Has expired product ever shipped to a customer or raised a safety concern?',
    capacityExpansion: 'At this rate, would you need more staff manually checking expiration dates?',
    contractSla: 'Has a customer ever penalized you over a shelf life or freshness commitment?',
  },
  goodsReceipt: {
    revenueImpact: "When's the last time a receiving error delayed getting inventory available to sell?",
    riskCompliance: 'Has a mismatched receipt ever caused a compliance or vendor dispute?',
    capacityExpansion: 'At this rate, would you need more dock staff to manually check receipts?',
    contractSla: 'Has a vendor ever charged you back over a receiving discrepancy?',
  },
  inventoryRequests: {
    revenueImpact: "When's the last time a delayed replenishment actually caused a stockout?",
    riskCompliance: 'Has a stockout from delayed replenishment ever caused a service or compliance issue?',
    capacityExpansion: 'At this rate, would you need more staff monitoring stock levels manually?',
    contractSla: 'Has a customer ever penalized you over a stock availability commitment?',
  },
  returnsTransfers: {
    revenueImpact: "When's the last time a lost or unlogged transfer made inventory go missing or unsellable?",
    riskCompliance: 'Has a returns or transfer discrepancy ever caused an audit or reconciliation issue?',
    capacityExpansion: 'If this kept happening, would you need more staff manually logging transfers?',
    contractSla: 'Has a partner or franchisee ever penalized you over a transfer accuracy issue?',
  },
  locateItems__asset: {
    revenueImpact: "When's the last time searching for a missing asset delayed a job or a customer commitment?",
    riskCompliance: 'Has an untracked asset ever caused a safety or compliance issue?',
    capacityExpansion: 'If assets keep going missing, are you replacing them instead of finding them?',
    contractSla: "Has a lease or contract penalty ever hit you over an asset you couldn't account for?",
  },
  calibrationReminders: {
    revenueImpact: "When's the last time a missed calibration delayed a job waiting on a compliant tool?",
    riskCompliance: 'Has a missed calibration ever caused a compliance or safety issue?',
    capacityExpansion: 'If this kept happening, would you need more staff manually tracking calibration schedules?',
    contractSla: 'Has a customer or regulator ever penalized you over a calibration lapse?',
  },
  cycleCount__asset: {
    revenueImpact: "When's the last time an asset count discrepancy delayed a job or a customer commitment?",
    riskCompliance: "When's the last time an asset discrepancy caused a failed audit or a compliance flag?",
    capacityExpansion: 'At this rate, would you need more staff or more frequent counts to track assets?',
    contractSla: 'Has a lease or contract penalty ever hit you over an asset accuracy issue?',
  },
  productionEquipment: {
    revenueImpact: "When's the last time a missing tool or fixture caused downtime that delayed production?",
    riskCompliance: 'Has an untracked or malfunctioning tool ever caused a safety incident?',
    capacityExpansion: 'If tools keep going missing, are you buying replacements instead of finding them?',
    contractSla: 'Has a maintenance or lease contract ever penalized you over equipment condition or uptime?',
  },
  rtiTracking__asset: {
    revenueImpact: "When's the last time a lost tote or container delayed an outbound shipment?",
    riskCompliance: 'Has a lost or damaged returnable asset ever triggered a customer dispute?',
    capacityExpansion: 'If losses continued at this rate, would you need to keep buying replacement totes or containers?',
    contractSla: 'Does your pooled or leased container program penalize you for loss or damage?',
  },
  shrinkage__asset: {
    revenueImpact: "When's the last time an asset going missing forced an emergency purchase or delayed a job?",
    riskCompliance: 'Has asset loss ever triggered a loss prevention or compliance investigation?',
    capacityExpansion: 'If asset loss continued at this rate, would you need to add staff to prevent it?',
    contractSla: 'Do you carry insurance with a loss threshold, and has asset shrinkage ever pushed you toward it?',
  },
  cycleCount__wip: {
    revenueImpact: "When's the last time a WIP count discrepancy caused a missed shipment or a delayed order?",
    riskCompliance: 'Has a WIP discrepancy ever caused a quality issue or a compliance hold?',
    capacityExpansion: 'At this rate, would you need more staff or more frequent counts to track WIP?',
    contractSla: 'Has a customer ever penalized you over a cycle time or delivery commitment this affects?',
  },
  locateItems__wip: {
    revenueImpact: "When's the last time locating misplaced WIP materials delayed a shipment?",
    riskCompliance: 'Has lost or misplaced WIP ever caused a quality or compliance issue?',
    capacityExpansion: 'If this kept happening, would you need more floor staff to search for WIP materials?',
    contractSla: 'Has a customer ever penalized you over a delay caused by lost or misplaced WIP?',
  },
  workOrderTracking: {
    revenueImpact: "When's the last time a stalled work order caused a missed shipment or a customer deadline?",
    riskCompliance: 'Has a stalled work order ever caused you to miss a scheduled compliance or reporting deadline?',
    capacityExpansion: 'If this kept happening, would you need more supervisors or planners to track work orders manually?',
    contractSla: 'Has a customer ever pushed back or penalized you over a missed cycle time commitment?',
  },
  qualityExceptionTracking: {
    revenueImpact: "When's the last time a part reached rework or scrap undetected and delayed a shipment?",
    riskCompliance: 'Has a missed quality exception ever caused a compliance hold or a customer complaint?',
    capacityExpansion: 'At this rate, would you need more quality staff to catch these exceptions manually?',
    contractSla: 'Has a customer ever rejected a shipment or penalized you over a quality issue this could have caught?',
  },
  expeditedExceptionTracking: {
    revenueImpact: "When's the last time a priority order missed its delivery window without you catching it in time?",
    riskCompliance: "When's the last time a missed expedite caused a customer complaint or a dispute?",
    capacityExpansion: 'At this rate, would you need more staff monitoring priority orders manually?',
    contractSla: 'Has a customer ever penalized you for missing an expedite or priority delivery commitment?',
  },
  rtiTracking__wip: {
    revenueImpact: "When's the last time a lost in process tote or container delayed a work order?",
    riskCompliance: 'Has a lost or damaged in process container ever caused a dispute or a write off?',
    capacityExpansion: 'If losses continued at this rate, would you need to keep buying replacement totes or containers?',
    contractSla: 'Does your pooled or leased container program penalize you for loss or damage?',
  },
  picklistVerification: {
    revenueImpact: "When's the last time a picking error turned into a mis-ship that put an order at risk?",
    riskCompliance: 'Has a picking error ever caused a compliance issue, like a mis-shipped regulated item?',
    capacityExpansion: 'At this rate, would you need more pickers or a second check to catch these errors?',
    contractSla: 'Has a customer ever penalized you or docked you over a picking accuracy issue?',
  },
  shipReceiveVerification: {
    revenueImpact: "When's the last time slow dock throughput caused a missed truck or a delayed shipment?",
    riskCompliance: 'Has a slow dock ever put you at risk of a safety incident or a carrier detention charge?',
    capacityExpansion: 'At this rate, would you need more dock staff or another shift to move trucks?',
    contractSla: 'Has slow dock turnaround ever cost you a detention or dwell time penalty?',
  },
  misShipReduction: {
    revenueImpact: "When's the last time a mis-ship put an order or an account at risk?",
    riskCompliance: 'Has a mis-ship ever triggered a recall or a regulatory issue?',
    capacityExpansion: 'At this rate, would you need more staff doing manual checks to catch mis-ships?',
    contractSla: 'Has a customer ever penalized you or threatened to walk over a mis-ship?',
  },
  fasterFulfillment: {
    revenueImpact: 'Are you turning away orders today because your fulfillment cycle is too slow?',
    riskCompliance: 'Has a slow fulfillment cycle ever put an account at risk of leaving entirely, not just an order?',
    capacityExpansion: 'To fulfill orders faster manually, would you need more staff or another shift?',
    contractSla: 'Has a customer ever penalized you or threatened to leave over a slow fulfillment cycle?',
  },
  proofOfDelivery: {
    revenueImpact: "When's the last time a fraudulent return claim actually cost you money?",
    riskCompliance: 'Has a disputed delivery ever caused a chargeback or a compliance issue?',
    capacityExpansion: 'At this rate, would you need more staff investigating delivery disputes manually?',
    contractSla: 'Do customers ever require signed proof of delivery as a condition of payment?',
  },
  automatedPackCount: {
    revenueImpact: "When's the last time a case count error caused a shipment dispute or a chargeback?",
    riskCompliance: 'Has a pack count error ever triggered a vendor compliance chargeback from a retail customer?',
    capacityExpansion: 'At this rate, would you need more staff manually scanning or counting case contents?',
    contractSla: 'Has a customer ever charged you back over a case count error?',
  },
  outboundAudit: {
    revenueImpact: "When's the last time an uncertified shipment caused a dispute or a chargeback after the fact?",
    riskCompliance: 'Has an outbound error ever triggered a regulatory issue, like a mis-shipped controlled item?',
    capacityExpansion: 'At this rate, would you need more staff to manually certify every dock door?',
    contractSla: 'Has a carrier or customer ever penalized you over an outbound shipment error?',
  },
  internalDelivery: {
    revenueImpact: "When's the last time a missing internal handoff delayed production or an outbound shipment?",
    riskCompliance: 'Has a missing handoff ever caused a chain of custody or compliance problem, especially with regulated materials?',
    capacityExpansion: 'If this kept happening, would you need more runners or staff to confirm handoffs between zones?',
    // deliberately no contractSla key here, this driver only gets three pills
  },
};
