import { useState } from 'react';
import ProgressIndicator from './components/ProgressIndicator';
import Step1_OperationProfile from './components/steps/Step1_OperationProfile';
import Step2_SavingsInputs from './components/steps/Step2_SavingsInputs';
import Step3_FinancialResults from './components/steps/Step3_FinancialResults';
import Step4_EmailGate from './components/steps/Step4_EmailGate';
import ThankYou from './components/ThankYou';

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

const defaultSavings = {
  meetingMinutesSaved: 30,
  meetingPeopleAffected: 5,
  handlerSearchMinutesSaved: 45,
  handlerSearchPeopleAffected: 8,
  productionSearchMinutesSaved: 30,
  productionSearchPeopleAffected: 3,
  cycleCountQuarterlySavings: 15000,
  revenueAccelerationMonthly: 8000,
};

const defaultFin = {
  capex: 50000,
  contingencyRate: 0.10,
  monthlyPlatformFee: 3000,
  wacc: 0.10,
};

export default function App() {
  const [step, setStep] = useState(1);
  const [ops, setOps] = useState(defaultOps);
  const [savings, setSavings] = useState(defaultSavings);
  const [fin, setFin] = useState(defaultFin);
  const [contactInfo, setContactInfo] = useState(null);
  const [done, setDone] = useState(false);

  const handleEmailSubmit = (info) => {
    setContactInfo(info);
    setDone(true);
  };

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
        {!done && <ProgressIndicator currentStep={step} />}

        {done ? (
          <ThankYou ops={ops} savings={savings} fin={fin} contactInfo={contactInfo} />
        ) : step === 1 ? (
          <Step1_OperationProfile ops={ops} setOps={setOps} onNext={() => setStep(2)} />
        ) : step === 2 ? (
          <Step2_SavingsInputs ops={ops} savings={savings} setSavings={setSavings} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        ) : step === 3 ? (
          <Step3_FinancialResults ops={ops} savings={savings} fin={fin} setFin={setFin} onNext={() => setStep(4)} onBack={() => setStep(2)} />
        ) : step === 4 ? (
          <Step4_EmailGate ops={ops} onSubmit={handleEmailSubmit} onBack={() => setStep(3)} />
        ) : null}
      </main>
    </div>
  );
}
