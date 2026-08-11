import { useState, useRef } from 'react';
import xemelgoLogo from './assets/xemelgo-logo.png';
import ProgressIndicator from './components/ProgressIndicator';
import Step1_OperationProfile from './components/steps/Step1_OperationProfile';
import Step2_UseCases from './components/steps/Step2_UseCases';
import Step3_FinancialResults from './components/steps/Step3_FinancialResults';
import Step4_EmailGate from './components/steps/Step4_EmailGate';
import ThankYou from './components/ThankYou';
import LivePreviewBar from './components/LivePreviewBar';
import UseCaseNav from './components/UseCaseNav';
import Tooltip from './components/Tooltip';
import { SOLUTIONS } from './components/steps/Step2_UseCases';

const defaultOps = {
  companyName: '',
  projectTitle: '',
  unitsPerMonth: 5000,
  workWeeksPerYear: 50,
  workDaysPerWeek: 5,
  shiftsPerDay: 1,
  materialHandlerCount: 10,
  materialHandlerRate: 25,
  plannerCount: 3,
  plannerRate: 35,
  indirectCount: 5,
  indirectRate: 45,
  directCount: 50,
  directRate: 22,
};

const defaultOperationDetails = {
  uniquePartNumbers: '',
  regulatedComponents: '',
  dateSensitiveSkus: '',
  auditFrequency: 'Quarterly',
  avgShelfLifeDays: '',
  skusWithExpirationTracking: '',
  activeSkus: '',
  avgOrderLines: '',
  supplierDocks: '',
  lineSidePoints: '',
  uniqueComponentParts: '',
  serializedAssets: '',
};

// All use cases disabled by default — user selects on Step 2
function makeAllDisabledUseCases() {
  return {
    cycleCount__inventory:   { enabled: false, mode: 'reductionPct', hoursPerSession: 2, cycleFrequencyValue: 3, cycleFrequencyUnit: 'week', peoplePerSession: 2, burdenedRate: 35, reductionPct: 0.98, employeesBefore: 3, hoursPerCountBefore: 40, employeesAfter: 1, hoursPerCountAfter: 2, countsPerYear: 48, justification: '', customDrivers: [], reviewed: false },
    cycleCount__asset:       { enabled: false, mode: 'reductionPct', hoursPerSession: 2, cycleFrequencyValue: 3, cycleFrequencyUnit: 'week', peoplePerSession: 2, burdenedRate: 35, reductionPct: 0.98, employeesBefore: 3, hoursPerCountBefore: 40, employeesAfter: 1, hoursPerCountAfter: 2, countsPerYear: 48, justification: '', customDrivers: [], reviewed: false },
    cycleCount__wip:         { enabled: false, mode: 'reductionPct', hoursPerSession: 2, cycleFrequencyValue: 3, cycleFrequencyUnit: 'week', peoplePerSession: 2, burdenedRate: 35, reductionPct: 0.98, employeesBefore: 3, hoursPerCountBefore: 40, employeesAfter: 1, hoursPerCountAfter: 2, countsPerYear: 48, justification: '', customDrivers: [], reviewed: false },
    audit:                   { enabled: false, people: 8, daysPerAudit: 2, hoursPerDay: 8, auditFrequencyValue: 2, auditFrequencyUnit: 'year', burdenedRate: 35, reductionPct: 0.90, downtimeCostPerDay: '', justification: '', customDrivers: [], reviewed: false },
    locateItems__inventory:  { enabled: false, roleRows: [{ id: 1, role: 'materialHandler', customRoleName: '', hoursLostPerDay: 1.5, headcount: 10, burdenedRate: 25 }], reductionPct: 0.90, driver1Enabled: true, driver2Enabled: true, supervisorHoursPerWeek: 2, supervisorHeadcount: 2, supervisorBurdenedRate: 45, driver1Justification: '', driver2Justification: '', customDrivers: [], reviewed: false },
    locateItems__asset:      { enabled: false, roleRows: [{ id: 1, role: 'materialHandler', customRoleName: '', hoursLostPerDay: 1.5, headcount: 10, burdenedRate: 25 }], reductionPct: 0.90, driver1Enabled: true, driver2Enabled: true, supervisorHoursPerWeek: 2, supervisorHeadcount: 2, supervisorBurdenedRate: 45, driver1Justification: '', driver2Justification: '', customDrivers: [], reviewed: false },
    locateItems__wip:        { enabled: false, roleRows: [{ id: 1, role: 'materialHandler', customRoleName: '', hoursLostPerDay: 1.5, headcount: 10, burdenedRate: 25 }], reductionPct: 0.90, driver1Enabled: true, driver2Enabled: true, supervisorHoursPerWeek: 2, supervisorHeadcount: 2, supervisorBurdenedRate: 45, driver1Justification: '', driver2Justification: '', customDrivers: [], reviewed: false },
    picklistVerification:    { enabled: false, picksPerDay: 500, errorRate: 2, costPerError: 50, reductionPct: 0.95, driver1Enabled: true, driver2Enabled: true, minutesSavedPerPick: 1, burdenedRate: 25, driver1Justification: '', driver2Justification: '', customDrivers: [], reviewed: false },
    shipReceiveVerification: { enabled: false, minutesSavedPerTransaction: 8, transactionsPerDay: 20, burdenedRate: 25, reductionPct: 0.95, justification: '', customDrivers: [], reviewed: false },
    internalDelivery:        { enabled: false, minutesPerTransfer: 8, transfersPerDay: 30, peoplePerTransfer: 2, burdenedRate: 25, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    expiredProducts:         { enabled: false, incidentsPerYear: 12, costPerIncident: 2000, reductionPct: 0.95, justification: '', customDrivers: [], reviewed: false },
    calibrationReminders:    { enabled: false, failuresPerYear: 6, costPerFailure: 5000, reductionPct: 0.95, justification: '', customDrivers: [], reviewed: false },
    geofencing:              { enabled: false, incidentsPerYear: 20, costPerIncident: 1000, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    fasterFulfillment:       { enabled: false, currentCycleTime: 48, targetCycleTime: 36, ordersPerMonth: 200, revenuePerOrder: 500, justification: '', customDrivers: [], reviewed: false },
    misShipReduction:        { enabled: false, misShipsPerMonth: 10, costPerMisShip: 300, reductionPct: 0.95, justification: '', customDrivers: [], reviewed: false },
    dockTurnSpeed:           { enabled: false, minutesSaved: 8, transactionsPerDay: 20, dockStaff: 4, burdenedRate: 25, reductionPct: 0.95, justification: '', customDrivers: [], reviewed: false },
    workOrderTracking:       { enabled: false, roleRows: [{ id: 1, role: 'indirect', customRoleName: '', hoursLostPerDay: 0.5, headcount: defaultOps.indirectCount, burdenedRate: defaultOps.indirectRate }], reductionPct: 0.85, driver1Enabled: true, driver2Enabled: false, supervisorHoursPerWeek: 2, supervisorHeadcount: 2, supervisorBurdenedRate: 45, driver1Justification: '', driver2Justification: '', customDrivers: [], reviewed: false },
    goodsReceipt:            { enabled: false, minutesSavedPerTransaction: 6,  transactionsPerDay: 15,  dockStaff: 3, burdenedRate: 25, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    automatedPackCount:      { enabled: false, minutesSavedPerTransaction: 4,  transactionsPerDay: 100, dockStaff: 3, burdenedRate: 25, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    outboundAudit:           { enabled: false, minutesSaved: 10, transactionsPerDay: 8, dockStaff: 2, burdenedRate: 25, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    returnsTransfers:        { enabled: false, minutesPerTransfer: 6, transfersPerDay: 20, peoplePerTransfer: 2, burdenedRate: 25, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    inventoryRequests:       { enabled: false, hoursPerWeek: 3, peopleInvolved: 2, burdenedRate: 35, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    shrinkage:               { enabled: false, incidentsPerYear: 15, materialValuePerIncident: 1200, laborHoursPerIncident: 2, burdenedRate: 25, scrapCostPerIncident: '', scheduleImpactPerIncident: '', reductionPct: 0.85, justification: '', customDrivers: [], reviewed: false },
    shrinkage__asset:        { enabled: false, incidentsPerYear: 10, materialValuePerIncident: 2500, laborHoursPerIncident: 2, burdenedRate: 35, scrapCostPerIncident: '', scheduleImpactPerIncident: '', reductionPct: 0.85, justification: '', customDrivers: [], reviewed: false },
    productionEquipment:     { enabled: false, incidentsPerYear: 10,  costPerIncident: 3000, reductionPct: 0.85, justification: '', customDrivers: [], reviewed: false },
    rtiTracking__asset:      { enabled: false, incidentsPerYear: 200, costPerIncident: 75,   reductionPct: 0.85, justification: '', customDrivers: [], reviewed: false },
    rtiTracking__wip:        { enabled: false, incidentsPerYear: 200, costPerIncident: 75,   reductionPct: 0.85, justification: '', customDrivers: [], reviewed: false },
    proofOfDelivery:         { enabled: false, incidentsPerYear: 25,  costPerIncident: 400,  reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    qualityExceptionTracking:   { enabled: false, exceptionsPerYear: 200, reworkCostPerException: 150, scrapCostPerException: '', reductionPct: 0.85, justification: '', customDrivers: [], reviewed: false },
    expeditedExceptionTracking: { enabled: false, lateShipmentsPerMonth: 5, costPerLateShipment: 500, reductionPct: 0.90, justification: '', customDrivers: [], reviewed: false },
    workingCapitalImprovement:  { enabled: false, wipInventoryValue: 500000, reductionPct: 0.15, justification: '', customDrivers: [], reviewed: false },
  };
}

const defaultFin = {
  hardwareCapex: 0,
  setupCapex: 0,
  contingencyRate: 0.025,
  annualPlatformFee: 0,
  wacc: 0.085,
};


function AnalyzingScreen() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>
      <p className="text-xl font-semibold text-gray-800 mb-2">Analyzing your operation...</p>
      <p className="text-sm text-gray-400">Building your personalized estimate</p>
      <div className="mt-6 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [transitionClass, setTransitionClass] = useState('step-enter');
  const [analyzing, setAnalyzing] = useState(false);
  const [ops, setOps] = useState(defaultOps);
  const [operationDetails, setOperationDetails] = useState(defaultOperationDetails);
  const [useCases, setUseCases] = useState(() => makeAllDisabledUseCases());
  const [collapsedUCs, setCollapsedUCs] = useState(new Set());
  const [osExpanded, setOsExpanded] = useState(false);
  const [fin, setFin] = useState(defaultFin);
  const [customCategories, setCustomCategories] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [done, setDone] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState(new Set([1]));
  const [showResetModal, setShowResetModal] = useState(false);
  const [importError, setImportError] = useState('');
  const dirRef = useRef('forward');
  const fileInputRef = useRef(null);

  function markVisited(stepNum) {
    setVisitedSteps((prev) => {
      if (prev.has(stepNum)) return prev;
      const next = new Set(prev);
      next.add(stepNum);
      return next;
    });
  }

  function goTo(next, dir = 'forward') {
    dirRef.current = dir;
    markVisited(next);
    setTransitionClass(dir === 'forward' ? 'step-exit' : 'step-exit-back');
    setTimeout(() => {
      setStep(next);
      setTransitionClass(dir === 'forward' ? 'step-enter' : 'step-enter-back');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 220);
  }

  // Step 1 → Step 2: reset use cases to all-disabled, then show analyzing screen
  function handleStep1Next() {
    setUseCases(makeAllDisabledUseCases());
    setCollapsedUCs(new Set());
    setOsExpanded(false);
    setOperationDetails(defaultOperationDetails);
    setCustomCategories([]);
    markVisited(2);
    setAnalyzing(true);
    setTimeout(() => {
      setTransitionClass('step-exit');
      setTimeout(() => {
        setAnalyzing(false);
        setStep(2);
        dirRef.current = 'forward';
        setTransitionClass('step-enter');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 220);
    }, 1500);
  }

  function handleEmailSubmit(info) {
    setContactInfo(info);
    setDone(true);
  }

  // Logo click — full reset to initial state
  function handleReset() {
    setStep(1);
    setTransitionClass('step-enter');
    setAnalyzing(false);
    setOps(defaultOps);
    setOperationDetails(defaultOperationDetails);
    setUseCases(makeAllDisabledUseCases());
    setCollapsedUCs(new Set());
    setOsExpanded(false);
    setFin(defaultFin);
    setCustomCategories([]);
    setContactInfo(null);
    setDone(false);
    setVisitedSteps(new Set([1]));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleReportStepClick(stepNum) {
    if (!visitedSteps.has(stepNum)) return;
    setDone(false);
    setStep(stepNum);
    setTransitionClass('step-enter');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Step indicator click — navigate to a previously visited step without clearing data
  function handleStepClick(stepNum) {
    if (stepNum === step) return;
    if (!visitedSteps.has(stepNum)) return;
    goTo(stepNum, stepNum < step ? 'back' : 'forward');
  }

  function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function handleSaveProgress() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const snapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      step, ops, operationDetails, useCases, fin, customCategories, contactInfo,
      visitedSteps: Array.from(visitedSteps),
      collapsedUCs: Array.from(collapsedUCs),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xemelgo-roi-${slugify(ops.companyName) || 'session'}-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    setImportError('');
    fileInputRef.current?.click();
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        applyImportedState(data);
      } catch {
        setImportError("Could not read the file. Make sure it's a valid Xemelgo ROI save file.");
      }
    };
    reader.onerror = () => setImportError('Failed to read the file.');
    reader.readAsText(file);
  }

  function applyImportedState(data) {
    try {
      const base = makeAllDisabledUseCases();
      const merged = { ...base };
      if (data.useCases && typeof data.useCases === 'object') {
        Object.keys(base).forEach((key) => {
          if (data.useCases[key]) merged[key] = { ...base[key], ...data.useCases[key] };
        });
      }
      setUseCases(merged);
      setOps({ ...defaultOps, ...(data.ops || {}) });
      setOperationDetails({ ...defaultOperationDetails, ...(data.operationDetails || {}) });
      setFin({ ...defaultFin, ...(data.fin || {}) });
      setCustomCategories(Array.isArray(data.customCategories) ? data.customCategories : []);
      setContactInfo(data.contactInfo ?? null);
      setCollapsedUCs(new Set(Array.isArray(data.collapsedUCs) ? data.collapsedUCs : []));
      const restoredVisited = new Set(Array.isArray(data.visitedSteps) ? data.visitedSteps : [1]);
      setVisitedSteps(restoredVisited);
      const restoredStep = (data.step >= 1 && data.step <= 4) ? data.step : 1;
      setDone(false);
      setAnalyzing(false);
      setTransitionClass('step-enter');
      setStep(restoredStep);
      markVisited(restoredStep);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {
      setImportError('The save file appears to be corrupted or in an unexpected format.');
    }
  }

  const showGrid = !done && !analyzing && step === 2;
  const anySolutionSelected = SOLUTIONS.some((sol) => sol.defaults.some((key) => useCases[key]?.enabled));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="https://www.xemelgo.com" target="_blank" rel="noopener noreferrer">
            <img src={xemelgoLogo} alt="Xemelgo" className="h-8 w-auto" />
          </a>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          {!done && step === 1 && (
            <button
              onClick={handleImportClick}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Import Progress
            </button>
          )}
          {!done && (step === 2 || step === 3 || step === 4) && (
            <Tooltip
              className="ml-auto"
              position="bottom"
              content="Downloads your current calculator project so you can import it later and continue where you left off."
            >
              <button
                onClick={handleSaveProgress}
                className="text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Download ROI Project
              </button>
            </Tooltip>
          )}
          {!done && step > 1 && (
            <button
              onClick={() => setShowResetModal(true)}
              className="text-sm text-blue-600 hover:text-red-600 border border-blue-300 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
        {importError && (
          <div className="max-w-5xl mx-auto px-4 pb-2">
            <p className="text-sm text-red-600">{importError}</p>
          </div>
        )}
      </header>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Start over?</h3>
            <p className="text-sm text-gray-500 mb-5">All inputs will be cleared. This can't be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowResetModal(false); handleReset(); }}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Yes, start over
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!analyzing && (
          <ProgressIndicator
            currentStep={done ? 4 : step}
            visitedSteps={visitedSteps}
            onStepClick={done ? handleReportStepClick : handleStepClick}
          />
        )}

        <div className={showGrid ? 'lg:grid lg:grid-cols-[200px_1fr] lg:gap-6 lg:items-start' : ''}>
          {!done && !analyzing && step === 2 && (
            <UseCaseNav useCases={useCases} collapsedUCs={collapsedUCs} setCollapsedUCs={setCollapsedUCs} />
          )}
          <div className={`lg:col-start-2 ${transitionClass}`}>
            {analyzing ? (
              <AnalyzingScreen />
            ) : done ? (
              <ThankYou ops={ops} useCases={useCases} fin={fin} customCategories={customCategories} contactInfo={contactInfo} />
            ) : step === 1 ? (
              <Step1_OperationProfile ops={ops} setOps={setOps} onNext={handleStep1Next} />
            ) : step === 2 ? (
              <Step2_UseCases
                ops={ops}
                setOps={setOps}
                fin={fin}
                useCases={useCases}
                setUseCases={setUseCases}
                collapsedUCs={collapsedUCs}
                setCollapsedUCs={setCollapsedUCs}
                osExpanded={osExpanded}
                setOsExpanded={setOsExpanded}
                customCategories={customCategories}
                setCustomCategories={setCustomCategories}
                onNext={() => goTo(3)}
                onBack={() => goTo(1, 'back')}
              />
            ) : step === 3 ? (
              <Step3_FinancialResults
                ops={ops}
                useCases={useCases}
                fin={fin}
                setFin={setFin}
                customCategories={customCategories}
                onNext={() => goTo(4)}
                onBack={() => goTo(2, 'back')}
              />
            ) : step === 4 ? (
              <Step4_EmailGate
                ops={ops}
                useCases={useCases}
                fin={fin}
                onSubmit={handleEmailSubmit}
                onBack={() => goTo(3, 'back')}
              />
            ) : null}
          </div>
        </div>
        {!done && !analyzing && step === 2 && <LivePreviewBar ops={ops} useCases={useCases} fin={fin} customCategories={customCategories} />}
      </main>
    </div>
  );
}
