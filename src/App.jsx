import { useState, useRef } from 'react';
import ProgressIndicator from './components/ProgressIndicator';
import Step1_OperationProfile from './components/steps/Step1_OperationProfile';
import Step2_UseCases from './components/steps/Step2_UseCases';
import Step3_ValidateInputs from './components/steps/Step3_ValidateInputs';
import Step3_FinancialResults from './components/steps/Step3_FinancialResults';
import Step4_EmailGate from './components/steps/Step4_EmailGate';
import ThankYou from './components/ThankYou';
import LivePreviewBar from './components/LivePreviewBar';

const defaultOps = {
  companyName: '',
  industry: '',
  projectDescription: '',
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
    cycleCount:              { enabled: false, hoursPerSession: 2, sessionsPerWeek: 3, peoplePerSession: 2, burdenedRate: 35, reductionPct: 0.95 },
    audit:                   { enabled: false, people: 8, daysPerAudit: 2, hoursPerDay: 8, auditsPerYear: 2, burdenedRate: 35, reductionPct: 0.85, downtimeCostPerDay: '' },
    locateItems:             { enabled: false, roleRows: [{ id: 1, role: 'materialHandler', customRoleName: '', hoursLostPerDay: 1.5, headcount: 10, burdenedRate: 25 }], reductionPct: 0.85 },
    picklistVerification:    { enabled: false, picksPerDay: 500, errorRate: 2, costPerError: 50, reductionPct: 0.85 },
    shipReceiveVerification: { enabled: false, minutesSavedPerTransaction: 8, transactionsPerDay: 20, dockStaff: 4, burdenedRate: 25, reductionPct: 0.85 },
    internalDelivery:        { enabled: false, minutesPerTransfer: 8, transfersPerDay: 30, peoplePerTransfer: 2, burdenedRate: 25, reductionPct: 0.85 },
    expiredProducts:         { enabled: false, incidentsPerYear: 12, costPerIncident: 2000, reductionPct: 0.85 },
    calibrationReminders:    { enabled: false, failuresPerYear: 6, costPerFailure: 5000, reductionPct: 0.85 },
    geofencing:              { enabled: false, incidentsPerYear: 20, costPerIncident: 1000, reductionPct: 0.85 },
    fasterFulfillment:       { enabled: false, currentCycleTime: 48, targetCycleTime: 36, ordersPerMonth: 200, revenuePerOrder: 500 },
    misShipReduction:        { enabled: false, misShipsPerMonth: 10, costPerMisShip: 300, reductionPct: 0.85 },
    dockTurnSpeed:           { enabled: false, minutesSaved: 8, transactionsPerDay: 20, dockStaff: 4, burdenedRate: 25, reductionPct: 0.85 },
  };
}

const defaultFin = {
  capex: '',
  contingencyRate: 0.025,
  monthlyPlatformFee: '',
  wacc: 0.10,
};

function StaticBenchmarkCard() {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-8 bg-white border border-gray-200 rounded-xl shadow-md p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Estimate</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">Estimated annual opportunity</p>
            <p className="text-lg font-bold text-blue-700">$150K–$700K</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Payback period</p>
            <p className="text-lg font-bold text-gray-900">18–24 weeks</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">5-Year ROI</p>
            <p className="text-lg font-bold text-gray-900">200–400%</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 leading-relaxed">
          Select your use cases next to see your personalized estimate.
        </p>
      </div>
    </div>
  );
}

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
  const [fin, setFin] = useState(defaultFin);
  const [customCategories, setCustomCategories] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [done, setDone] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState(new Set([1]));
  const dirRef = useRef('forward');

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
    setFin(defaultFin);
    setCustomCategories([]);
    setContactInfo(null);
    setDone(false);
    setVisitedSteps(new Set([1]));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Step indicator click — navigate to a previously visited step without clearing data
  function handleStepClick(stepNum) {
    if (stepNum === step) return;
    if (!visitedSteps.has(stepNum)) return;
    goTo(stepNum, stepNum < step ? 'back' : 'forward');
  }

  // Sidebar appears on step 1 (static benchmarks) and step 3 (live preview)
  const showGrid = !done && !analyzing && (step === 1 || step === 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleReset}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900">Xemelgo</span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-sm text-gray-500">ROI Calculator</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!done && !analyzing && (
          <ProgressIndicator
            currentStep={step}
            visitedSteps={visitedSteps}
            onStepClick={handleStepClick}
          />
        )}

        <div className={showGrid ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-6 lg:items-start' : ''}>
          <div className={transitionClass}>
            {analyzing ? (
              <AnalyzingScreen />
            ) : done ? (
              <ThankYou ops={ops} useCases={useCases} fin={fin} customCategories={customCategories} contactInfo={contactInfo} />
            ) : step === 1 ? (
              <Step1_OperationProfile ops={ops} setOps={setOps} onNext={handleStep1Next} />
            ) : step === 2 ? (
              <Step2_UseCases
                ops={ops}
                useCases={useCases}
                setUseCases={setUseCases}
                customCategories={customCategories}
                setCustomCategories={setCustomCategories}
                onNext={() => goTo(3)}
                onBack={() => goTo(1, 'back')}
              />
            ) : step === 3 ? (
              <Step3_ValidateInputs
                ops={ops}
                setOps={setOps}
                useCases={useCases}
                setUseCases={setUseCases}
                operationDetails={operationDetails}
                setOperationDetails={setOperationDetails}
                customCategories={customCategories}
                setCustomCategories={setCustomCategories}
                onNext={() => goTo(4)}
                onBack={() => goTo(2, 'back')}
              />
            ) : step === 4 ? (
              <Step3_FinancialResults
                ops={ops}
                useCases={useCases}
                fin={fin}
                setFin={setFin}
                customCategories={customCategories}
                onNext={() => goTo(5)}
                onBack={() => goTo(3, 'back')}
              />
            ) : step === 5 ? (
              <Step4_EmailGate
                ops={ops}
                useCases={useCases}
                fin={fin}
                onSubmit={handleEmailSubmit}
                onBack={() => goTo(4, 'back')}
              />
            ) : null}
          </div>

          {!done && !analyzing && step === 1 && <StaticBenchmarkCard />}
          {!done && !analyzing && step === 3 && <LivePreviewBar ops={ops} useCases={useCases} fin={fin} customCategories={customCategories} />}
        </div>
      </main>
    </div>
  );
}
