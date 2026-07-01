// Typical = current default reductionPct per use case
// Best    = top end of the stated benchmark range in SOURCE_NOTES
export const CASE_PRESETS = {
  typical: {
    cycleCount:              0.95,
    audit:                   0.85,
    locateItems:             0.85,
    picklistVerification:    0.85,
    shipReceiveVerification: 0.85,
    internalDelivery:        0.85,
    expiredProducts:         0.85,
    calibrationReminders:    0.85,
    geofencing:              0.85,
    misShipReduction:        0.85,
    dockTurnSpeed:           0.85,
  },
  best: {
    cycleCount:              0.98,
    audit:                   0.90,
    locateItems:             0.90,
    picklistVerification:    0.95,
    shipReceiveVerification: 0.95,
    internalDelivery:        0.90,
    expiredProducts:         0.95,
    calibrationReminders:    0.95,
    geofencing:              0.90,
    misShipReduction:        0.95,
    dockTurnSpeed:           0.95,
  },
};

export const SCENARIO_LABEL = {
  typical: 'Typical case',
  best:    'Best case',
};
