import { useState, useRef } from 'react';
import ProgressIndicator from './components/ProgressIndicator';
import Step1_OperationProfile from './components/steps/Step1_OperationProfile';
import Step2_UseCases from './components/steps/Step2_UseCases';
import Step3_FinancialResults from './components/steps/Step3_FinancialResults';
import Step4_EmailGate from './components/steps/Step4_EmailGate';
import ThankYou from './components/ThankYou';
import LivePreviewBar from './components/LivePreviewBar';

const defaultOps = {
  companyName: '',
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

function makeDefaultUseCases(ops) {
  return {
    auditCycleCount: { enabled: true, hoursPerCount: 8, countsPerYear: 4, plannersPerCount: ops.plannerCount, reductionPct: 0.80 },
    locateItems: { enabled: true, searchMinutes: 15, incidentsPerDay: 20, role: 'materialHandler', reductionPct: 0.70 },
    picklistVerification: { enabled: false, picksPerDay: 500, errorRate: 0.02, costPerError: 50, reductionPct: 0.70 },
    shipReceiveVerification: { enabled: false, transactionsPerDay: 15, minutesPerTransaction: 12, dockHeadcount: ops.materialHandlerCount, reductionPct: 0.60 },
    internalDelivery: { enabled: false, transfersPerDay: 30, minutesPerTransfer: 8, headcount: ops.materialHandlerCount, reductionPct: 0.50 },
    expiredProducts: { enabled: false, incidentsPerYear: 12, costPerIncident: 2000, reductionPct: 0.75 },
    calibrationReminders: { enabled: false, failuresPerYear: 6, costPerFailure: 5000, reductionPct: 0.80 },
    geofencing: { enabled: false, incidentsPerYear: 20, costPerIncident: 1000, reductionPct: 0.70 },
    fasterFulfillment: { enabled: false, currentCycleTime: 48, targetCycleTime: 36, ordersPerMonth: 200, revenuePerOrder: 500 },
    misShipReduction: { enabled: false, misShipsPerMonth: 10, costPerMisShip: 300, reductionPct: 0.75 },
    dockTurnSpeed: { enabled: false, transactionsPerDay: 20, delayCostPerTransaction: 25, savingsMinutesPerTransaction: 10 },
  };
}

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

function StaticBenchmarkCard() {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-8 bg-white border border-gray-200 rounded-xl shadow-md p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Industry Benchmarks</p>
        <p className="text-xs text-gray-600 mb-4">Based on operations like yours, Xemelgo customers typically see:</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">Annual opportunity</p>
            <p className="text-lg font-bold text-gray-900">$150K–$700K</p>
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
        <p className="mt-4 text-xs text-gray-400 leading-relaxed">Complete Step 1 to see your personalized estimate.</p>
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
  const [useCases, setUseCases] = useState(() => makeDefaultUseCases(defaultOps));
  const [fin, setFin] = useState(defaultFin);
  const [contactInfo, setContactInfo] = useState(null);
  const [done, setDone] = useState(false);
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
              <Step1_OperationProfile ops={ops} setOps={setOps} onNext={handleStep1Next} />
            ) : step === 2 ? (
              <Step2_UseCases ops={ops} useCases={useCases} setUseCases={setUseCases} onNext={handleGoToStep3} onBack={() => goTo(1, 'back')} />
            ) : step === 3 ? (
              <Step3_FinancialResults ops={ops} useCases={useCases} fin={fin} setFin={setFin} onNext={() => goTo(4)} onBack={() => goTo(2, 'back')} />
            ) : step === 4 ? (
              <Step4_EmailGate ops={ops} useCases={useCases} fin={fin} onSubmit={handleEmailSubmit} onBack={() => goTo(3, 'back')} />
            ) : null}
          </div>

          {!done && !analyzing && step === 1 && <StaticBenchmarkCard />}
          {!done && !analyzing && step === 2 && <LivePreviewBar ops={ops} useCases={useCases} fin={fin} />}
        </div>
      </main>
    </div>
  );
}
