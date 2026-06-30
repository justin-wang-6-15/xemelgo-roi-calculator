const steps = [
  { label: 'Project Overview' },
  { label: 'Select Use Cases' },
  { label: 'Validate Your Inputs' },
  { label: 'Financial Inputs' },
  { label: 'Get Your Report' },
];

export default function ProgressIndicator({ currentStep, visitedSteps = new Set(), onStepClick }) {
  const pct = Math.round(((currentStep - 1) / 4) * 100);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          // Clickable if visited before and not the current step
          const isClickable = visitedSteps.has(stepNum) && !isCurrent;

          return (
            <div key={idx} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  onClick={isClickable ? () => onStepClick(stepNum) : undefined}
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                    isComplete
                      ? `bg-green-500 border-green-500 text-white${isClickable ? ' cursor-pointer hover:bg-green-600 hover:border-green-600' : ''}`
                      : isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isClickable
                          ? 'bg-white border-gray-400 text-gray-500 cursor-pointer hover:border-gray-500'
                          : 'bg-white border-gray-300 text-gray-400',
                  ].join(' ')}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : stepNum}
                </div>
                <span className={`mt-1 text-xs font-medium hidden sm:block text-center
                  ${isCurrent ? 'text-blue-600' : isComplete ? 'text-green-600' : isClickable ? 'text-gray-500' : 'text-gray-400'}
                `}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-8 sm:w-14 h-0.5 mx-1 mb-4 ${isComplete ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 max-w-xs mx-auto w-full">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-center text-xs text-gray-400 mt-1">Step {currentStep} of 5</p>
      </div>
    </div>
  );
}
