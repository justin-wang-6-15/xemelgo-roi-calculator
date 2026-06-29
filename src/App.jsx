import { useState, useRef } from 'react';
import ProgressIndicator from './components/ProgressIndicator';
import Step1_OperationProfile from './components/steps/Step1_OperationProfile';
import Step2_UseCases from './components/steps/Step2_UseCases';
import Step3_FinancialResults from './components/steps/Step3_FinancialResults';
import Step4_EmailGate from './components/steps/Step4_EmailGate';
import ThankYou from './components/ThankYou';
import LivePreviewBar from './components/LivePreviewBar';
import { fmt$ } from './utils/format';

const defaultOps = {
  companyName: '',
  industry: '',
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

function makeDefaultUseCases(ops) {
  return {
    auditCycleCount: { enabled: true, hoursPerCount: 8, countsPerYear: 4, plannersPerCount: ops.plannerCount, reductionPct: 0.80 },
    locateItems: { enabled: true, searchMinutes: 15, incidentsPerDay: 20, role: 'materialHandler', reductionPct: 0.70 },
    picklistVerification: { enabled: true, picksPerDay: 500, errorRate: 0.02, costPerError: 50, reductionPct: 0.70 },
    shipReceiveVerification: { enabled: true, transactionsPerDay: 15, minutesPerTransaction: 12, dockHeadcount: ops.materialHandlerCount, reductionPct: 0.60 },
    internalDelivery: { enabled: false, transfersPerDay: 30, minutesPerTransfer: 8, headcount: ops.materialHandlerCount, reductionPct: 0.50 },
    expiredProducts: { enabled: false, incidentsPerYear: 12, costPerIncident: 2000, reductionPct: 0.75 },
    calibrationReminders: { enabled: false, failuresPerYear: 6, costPerFailure: 5000, reductionPct: 0.80 },
    geofencing: { enabled: false, incidentsPerYear: 20, costPerIncident: 1000, reductionPct: 0.70 },
    fasterFulfillment: { enabled: false, currentCycleTime: 48, targetCycleTime: 36, ordersPerMonth: 200, revenuePerOrder: 500 },
    misShipReduction: { enabled: false, misShipsPerMonth: 10, costPerMisShip: 300, reductionPct: 0.75 },
    dockTurnSpeed: { enabled: false, transactionsPerDay: 20, delayCostPerTransaction: 25, savingsMinutesPerTransaction: 10 },
  };
}

// Fix 10: industry → which extra use case to toggle ON
const INDUSTRY_USE_CASE_MAP = {
  aerospace: 'calibrationReminders',
  lifesciences: 'expiredProducts',
  foodbeverage: 'expiredProducts',
  retail: 'misShipReduction',
};

// Fix 10: industry sidebar notes
const INDUSTRY_NOTES = {
  aerospace: 'Defense contractors typically prioritize calibration and geofencing use cases.',
  lifesciences: 'Regulated environments see high ROI from expiration tracking and audit readiness.',
  foodbeverage: 'Perishable inventory operations benefit most from expired product and cycle count use cases.',
  automotive: 'High-volume facilities see strong ROI from ship/receive verification and picklist accuracy.',
  electronics: 'Component-intensive operations benefit from locate items and WIP tracking.',
  retail: 'Distribution centers see strong ROI from outbound verification and cycle count reduction.',
};

function calcEstimatedCapex(ops) {
  const zones = Math.max(3, Math.min(12, Math.ceil(ops.unitsPerMonth / 2000)));
  return Math.round(zones * 8000 * 1.25);
}

const defaultFin = {
  capex: calcEstimatedCapex(defaultOps),
  contingencyRate: 0.10,
  monthlyPlatformFee: 3000,
  wacc: 0.10,
};

// Fix 1: reactive benchmark card using ops
function StaticBenchmarkCard({ ops }) {
  const totalPayroll = (
    ops.materialHandlerCount * ops.materialHandlerRate +
    ops.plannerCount * ops.plannerRate +
    ops.indirectCount * ops.indirectRate +
    ops.directCount * ops.directRate
  ) * 2000;
  const estimated = Math.round(totalPayroll * 0.08 / 1000) * 1000;
  const industryNote = INDUSTRY_NOTES[ops.industry];

  return (
    <div className="hidden lg:block">
      <div className="sticky top-8 bg-white border border-gray-200 rounded-xl shadow-md p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Estimate</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">Estimated annual opportunity</p>
            <p className={`text-lg font-bold ${estimated > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
              {estimated > 0 ? fmt$(estimated) : '—'}
            </p>
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
        {industryNote && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-blue-700 italic leading-relaxed">{industryNote}</p>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-400 leading-relaxed">Based on your team size. Refine in Step 2.</p>
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
  const [useCases, setUseCases] = useState(() => makeDefaultUseCases(defaultOps));
  const [fin, setFin] = useState(defaultFin);
  const [contactInfo, setContactInfo] = useState(null);
  const [done, setDone] = useState(false);
  const [prefillBannerActive, setPrefillBannerActive] = useState(false);
  const [prefillBannerDismissed, setPrefillBannerDismissed] = useState(false);
  const dirRef = useRef('forward');
  const hasVisitedStep3 = useRef(false);

  function goTo(next, dir = 'forward') {
    dirRef.current = dir;
    setTransitionClass(dir === 'forward' ? 'step-exit' : 'step-exit-back');
    setTimeout(() => {
      setStep(next);
      setTransitionClass(dir === 'forward' ? 'step-enter' : 'step-enter-back');
    }, 220);
  }

  function handleStep1Next() {
    const freshUseCases = makeDefaultUseCases(ops);
    const extraToggle = INDUSTRY_USE_CASE_MAP[ops.industry];
    if (extraToggle) {
      freshUseCases[extraToggle] = { ...freshUseCases[extraToggle], enabled: true };
    }

    // Part B: wire operation details into use case defaults
    let prefilledAny = false;
    const det = operationDetails;
    const num = (v) => v !== '' && Number(v) > 0 ? Number(v) : null;

    if (ops.industry === 'aerospace') {
      const regulated = num(det.regulatedComponents);
      if (regulated !== null) {
        freshUseCases.calibrationReminders = { ...freshUseCases.calibrationReminders, failuresPerYear: Math.max(3, Math.ceil(regulated * 0.05)) };
        prefilledAny = true;
      }
      const parts = num(det.uniquePartNumbers);
      if (parts !== null) {
        freshUseCases.locateItems = { ...freshUseCases.locateItems, incidentsPerDay: Math.min(50, Math.max(5, Math.ceil(parts / 50))) };
        prefilledAny = true;
      }
    }

    if (ops.industry === 'lifesciences') {
      const skus = num(det.dateSensitiveSkus);
      if (skus !== null) {
        freshUseCases.expiredProducts = { ...freshUseCases.expiredProducts, incidentsPerYear: Math.max(2, Math.ceil(skus * 0.10)) };
        prefilledAny = true;
      }
      if (det.auditFrequency) {
        const freqMap = { Monthly: 12, Quarterly: 4, 'Semi-annually': 2, Annually: 1 };
        const counts = freqMap[det.auditFrequency];
        if (counts !== undefined) {
          freshUseCases.auditCycleCount = { ...freshUseCases.auditCycleCount, countsPerYear: counts };
          prefilledAny = true;
        }
      }
    }

    if (ops.industry === 'foodbeverage') {
      const expiringSkus = num(det.skusWithExpirationTracking);
      if (expiringSkus !== null) {
        freshUseCases.expiredProducts = { ...freshUseCases.expiredProducts, incidentsPerYear: Math.max(3, Math.ceil(expiringSkus * 0.15)) };
        prefilledAny = true;
      }
      const shelfLife = num(det.avgShelfLifeDays);
      if (shelfLife !== null && shelfLife < 30) {
        freshUseCases.expiredProducts = { ...freshUseCases.expiredProducts, enabled: true };
      }
    }

    if (ops.industry === 'retail') {
      const orderLines = num(det.avgOrderLines);
      if (orderLines !== null) {
        const picksPerDay = Math.round((ops.unitsPerMonth / 22) * orderLines);
        freshUseCases.picklistVerification = { ...freshUseCases.picklistVerification, picksPerDay };
        prefilledAny = true;
      }
      const activeSkus = num(det.activeSkus);
      if (activeSkus !== null) {
        freshUseCases.locateItems = { ...freshUseCases.locateItems, incidentsPerDay: Math.min(80, Math.max(5, Math.ceil(activeSkus / 100))) };
        prefilledAny = true;
      }
    }

    if (ops.industry === 'automotive') {
      const docks = num(det.supplierDocks);
      if (docks !== null) {
        freshUseCases.shipReceiveVerification = { ...freshUseCases.shipReceiveVerification, transactionsPerDay: docks * 8 };
        prefilledAny = true;
      }
      const lineSide = num(det.lineSidePoints);
      if (lineSide !== null) {
        freshUseCases.internalDelivery = { ...freshUseCases.internalDelivery, transfersPerDay: lineSide * 3 };
        prefilledAny = true;
      }
    }

    if (ops.industry === 'electronics') {
      const serialized = num(det.serializedAssets);
      if (serialized !== null) {
        freshUseCases.calibrationReminders = { ...freshUseCases.calibrationReminders, failuresPerYear: Math.max(2, Math.ceil(serialized * 0.08)) };
        prefilledAny = true;
      }
      const compParts = num(det.uniqueComponentParts);
      if (compParts !== null) {
        freshUseCases.locateItems = { ...freshUseCases.locateItems, incidentsPerDay: Math.min(60, Math.max(5, Math.ceil(compParts / 80))) };
        prefilledAny = true;
      }
    }

    setUseCases(freshUseCases);
    setPrefillBannerActive(prefilledAny);
    setPrefillBannerDismissed(false);

    setAnalyzing(true);
    setTimeout(() => {
      setTransitionClass('step-exit');
      setTimeout(() => {
        setAnalyzing(false);
        setStep(2);
        dirRef.current = 'forward';
        setTransitionClass('step-enter');
      }, 220);
    }, 1500);
  }

  function handleGoToStep3() {
    if (!hasVisitedStep3.current) {
      hasVisitedStep3.current = true;
      setFin((prev) => ({ ...prev, capex: calcEstimatedCapex(ops) }));
    }
    goTo(3);
  }

  const handleEmailSubmit = (info) => {
    setContactInfo(info);
    setDone(true);
  };

  const showGrid = !done && !analyzing && (step === 1 || step === 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
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
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!done && !analyzing && <ProgressIndicator currentStep={step} />}

        <div className={showGrid ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-6 lg:items-start' : ''}>
          <div className={transitionClass}>
            {analyzing ? (
              <AnalyzingScreen />
            ) : done ? (
              <ThankYou ops={ops} useCases={useCases} fin={fin} contactInfo={contactInfo} />
            ) : step === 1 ? (
              <Step1_OperationProfile ops={ops} setOps={setOps} operationDetails={operationDetails} setOperationDetails={setOperationDetails} onNext={handleStep1Next} />
            ) : step === 2 ? (
              <Step2_UseCases ops={ops} useCases={useCases} setUseCases={setUseCases} onNext={handleGoToStep3} onBack={() => goTo(1, 'back')} showPrefillBanner={prefillBannerActive && !prefillBannerDismissed} onDismissPrefillBanner={() => setPrefillBannerDismissed(true)} />
            ) : step === 3 ? (
              <Step3_FinancialResults ops={ops} useCases={useCases} fin={fin} setFin={setFin} onNext={() => goTo(4)} onBack={() => goTo(2, 'back')} />
            ) : step === 4 ? (
              <Step4_EmailGate ops={ops} useCases={useCases} fin={fin} onSubmit={handleEmailSubmit} onBack={() => goTo(3, 'back')} />
            ) : null}
          </div>

          {!done && !analyzing && step === 1 && <StaticBenchmarkCard ops={ops} />}
          {!done && !analyzing && step === 2 && <LivePreviewBar ops={ops} useCases={useCases} fin={fin} />}
        </div>
      </main>
    </div>
  );
}
