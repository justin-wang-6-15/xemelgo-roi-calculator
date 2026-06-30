import { useState } from 'react';
import { BUCKET_CONFIG } from '../../utils/calculations';

const INDUSTRY_RECOMMENDATIONS = {
  manufacturing: ['locateItems', 'cycleCount', 'audit', 'calibrationReminders', 'picklistVerification', 'internalDelivery'],
  retail:        ['misShipReduction', 'picklistVerification', 'cycleCount', 'audit', 'dockTurnSpeed'],
  supplychain:   ['dockTurnSpeed', 'locateItems', 'cycleCount', 'misShipReduction', 'internalDelivery', 'picklistVerification'],
  healthcare:    ['expiredProducts', 'audit', 'cycleCount', 'calibrationReminders', 'locateItems', 'geofencing'],
  other:         [],
  '':            ['locateItems', 'cycleCount', 'audit', 'shipReceiveVerification', 'picklistVerification'],
};

const UC_REASON = {
  cycleCount:              'Cuts the hours spent on routine cycle counts by 90–98% — RFID reads replace manual scanning.',
  audit:                   'Reduces full physical audit labor by 75–90%, turning multi-day shutdowns into hours.',
  locateItems:             'Eliminates time wasted searching for misplaced inventory or assets.',
  shipReceiveVerification: 'Replaces manual scanning at the dock door, cutting verification time by 50–70%.',
  picklistVerification:    'Reduces pick errors and the cost of returns, re-ships, and production delays.',
  internalDelivery:        'Automates transfer confirmation between zones, reducing manual handling.',
  expiredProducts:         'Prevents write-offs by flagging at-risk inventory before it expires.',
  calibrationReminders:    'Keeps calibrated assets compliant, preventing audit failures and re-work.',
  geofencing:              'Alerts your team when assets leave authorized zones, preventing loss and shrinkage.',
  misShipReduction:        'Catches shipment errors before they leave your dock, reducing returns and chargebacks.',
  dockTurnSpeed:           'Accelerates dock throughput with instant RFID reads, reducing carrier wait costs.',
  fasterFulfillment:       'Cuts order cycle time to capture revenue from orders you\'re currently turning away.',
};

const UC_VALUE_RANGE = {
  cycleCount:              '$10K–$50K / yr',
  audit:                   '$5K–$30K / yr',
  locateItems:             '$15K–$60K / yr',
  picklistVerification:    '$20K–$90K / yr',
  shipReceiveVerification: '$25K–$120K / yr',
  internalDelivery:        '$10K–$40K / yr',
  expiredProducts:         '$10K–$50K / yr',
  calibrationReminders:    '$15K–$75K / yr',
  geofencing:              '$5K–$30K / yr',
  fasterFulfillment:       '$20K–$100K / yr',
  misShipReduction:        '$10K–$40K / yr',
  dockTurnSpeed:           '$15K–$60K / yr',
};

const INDUSTRY_DISPLAY = {
  manufacturing: 'Manufacturing',
  retail:        'Retail',
  supplychain:   'Supply Chain / Distribution',
  healthcare:    'Healthcare / Life Sciences',
  other:         'your industry',
  '':            'your industry',
};

// Flat key → label lookup from BUCKET_CONFIG
const UC_LABELS = Object.fromEntries(
  BUCKET_CONFIG.flatMap((b) => Object.entries(b.labels))
);

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex-shrink-0
        ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function RecommendedCard({ ucKey, enabled, onToggle }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer
      ${enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
      onClick={() => onToggle(ucKey)}
    >
      <Toggle checked={enabled} onChange={() => onToggle(ucKey)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${enabled ? 'text-gray-900' : 'text-gray-700'}`}>
            {UC_LABELS[ucKey] || ucKey}
          </span>
          <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
            {UC_VALUE_RANGE[ucKey]}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{UC_REASON[ucKey]}</p>
      </div>
    </div>
  );
}

function ExploreCard({ ucKey, enabled, onToggle }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer
      ${enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
      onClick={() => onToggle(ucKey)}
    >
      <Toggle checked={enabled} onChange={() => onToggle(ucKey)} />
      <span className={`text-sm font-medium flex-1 ${enabled ? 'text-gray-900' : 'text-gray-700'}`}>
        {UC_LABELS[ucKey] || ucKey}
      </span>
      <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">
        {UC_VALUE_RANGE[ucKey]}
      </span>
    </div>
  );
}

export default function Step2_UseCases({ ops, useCases, setUseCases, customCategories, setCustomCategories, onNext, onBack }) {
  const [exploreOpen, setExploreOpen] = useState(false);

  const industry = ops.industry || '';
  const industryDisplay = INDUSTRY_DISPLAY[industry];
  const recommended = INDUSTRY_RECOMMENDATIONS[industry] ?? INDUSTRY_RECOMMENDATIONS[''];
  const isOther = industry === 'other';

  const remainingByBucket = BUCKET_CONFIG.map((bucket) => ({
    ...bucket,
    keys: bucket.keys.filter((k) => !recommended.includes(k)),
  })).filter((b) => b.keys.length > 0);

  const allByBucket = BUCKET_CONFIG.filter((b) => b.keys.length > 0);

  function toggle(key) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  }

  const selectedCount = Object.values(useCases).filter((uc) => uc.enabled).length;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Which of these sound like you?</h2>
      <p className="text-sm text-gray-500 mb-6">
        {isOther
          ? 'Browse all use cases below and select any that apply to your operation.'
          : 'Select all that apply. You\'ll review and adjust the numbers in the next step.'}
      </p>

      {!isOther && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Recommended for {industryDisplay}
          </h3>
          <div className="space-y-3">
            {recommended.map((key) => (
              <RecommendedCard
                key={key}
                ucKey={key}
                enabled={useCases[key]?.enabled ?? false}
                onToggle={toggle}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        {isOther ? (
          <div className="space-y-6">
            {allByBucket.map((bucket) => (
              <div key={bucket.name}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {bucket.name}
                </p>
                <div className="space-y-2">
                  {bucket.keys.map((key) => (
                    <ExploreCard
                      key={key}
                      ucKey={key}
                      enabled={useCases[key]?.enabled ?? false}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <button
              onClick={() => setExploreOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${exploreOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {exploreOpen ? 'Hide other use cases' : 'Explore all use cases →'}
            </button>

            {exploreOpen && (
              <div className="mt-4 space-y-6">
                {remainingByBucket.map((bucket) => (
                  <div key={bucket.name}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {bucket.name}
                    </p>
                    <div className="space-y-2">
                      {bucket.keys.map((key) => (
                        <ExploreCard
                          key={key}
                          ucKey={key}
                          enabled={useCases[key]?.enabled ?? false}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {customCategories.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Categories</h3>
          <div className="space-y-2">
            {customCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white">
                <input
                  type="text"
                  value={cat.name}
                  placeholder="Custom category name"
                  onChange={(e) => setCustomCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, name: e.target.value } : c))}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setCustomCategories((prev) => prev.filter((c) => c.id !== cat.id))}
                  className="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
                  aria-label="Remove custom category"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          type="button"
          onClick={() => setCustomCategories((prev) => [...prev, { id: Date.now(), name: '', description: '', annualSavings: '' }])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 rounded-lg px-4 py-2 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Custom Savings Category
        </button>
      </div>

      <div className={`rounded-xl px-5 py-3 mb-6 border ${selectedCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-sm text-gray-700">
          <span className={`font-semibold ${selectedCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {selectedCount}
          </span>{' '}
          use case{selectedCount !== 1 ? 's' : ''} selected
        </p>
        {selectedCount === 0 && (
          <p className="text-xs text-gray-400 mt-0.5">Select at least one use case to continue.</p>
        )}
      </div>

      <div className="flex justify-between pb-20 lg:pb-0">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Next: Review Your Inputs →
        </button>
      </div>
    </div>
  );
}
