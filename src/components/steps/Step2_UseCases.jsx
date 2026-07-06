import { useState } from 'react';

const SOLUTIONS = [
  {
    id: 'inventory',
    name: 'Inventory management',
    description: 'Cycle counting, locate items, full audits, and expiry tracking.',
    defaults: ['cycleCount', 'locateItems', 'audit', 'shrinkage', 'rfidTracking'],
    extras:   ['expiredProducts', 'goodsReceipt', 'inventoryRequests', 'returnsTransfers'],
  },
  {
    id: 'asset',
    name: 'Asset tracking',
    description: 'Locate assets, track calibration status, and enforce zone boundaries.',
    defaults: ['locateItems', 'calibrationReminders', 'cycleCount', 'productionEquipment', 'rtiTracking'],
    extras:   ['geofencing'],
  },
  {
    id: 'wip',
    name: 'Work in process',
    description: 'Track work orders and in-progress materials across your facility.',
    defaults: ['locateItems', 'workOrderTracking'],
    extras:   ['rtiTracking'],
  },
  {
    id: 'shipment',
    name: 'Shipment tracking',
    description: 'Verify picks, reduce mis-ships, and accelerate dock throughput.',
    defaults: ['picklistVerification', 'shipReceiveVerification', 'misShipReduction', 'fasterFulfillment', 'proofOfDelivery'],
    extras:   ['automatedPackCount', 'outboundAudit'],
  },
  {
    id: 'delivery',
    name: 'Package delivery',
    description: 'Automate internal delivery confirmation between zones.',
    defaults: ['internalDelivery'],
    extras:   [],
    status: 'comingSoon',
  },
];

const UC_LABELS = {
  cycleCount:              'Cycle counting',
  locateItems:             'Locate items',
  audit:                   'Full inventory audit',
  expiredProducts:         'Expired products',
  goodsReceipt:            'Goods receipt',
  inventoryRequests:       'Inventory requests',
  returnsTransfers:        'Returns and transfers',
  shrinkage:               'Shrinkage and loss prevention',
  rfidTracking:            'RFID inventory tracking',
  calibrationReminders:    'Calibration reminders',
  geofencing:              'Geofencing',
  productionEquipment:     'Production equipment tracking',
  rtiTracking:             'RTI tracking',
  workOrderTracking:       'Work order tracking',
  picklistVerification:    'Picklist verification',
  shipReceiveVerification: 'Shipment throughput',
  misShipReduction:        'Mis-ship reduction',
  automatedPackCount:      'Automated pack count',
  outboundAudit:           'Outbound shipment audit',
  fasterFulfillment:       'Faster order fulfillment',
  proofOfDelivery:         'Proof of delivery',
  internalDelivery:        'Internal delivery verification',
};

const UC_DESCRIPTIONS = {
  cycleCount:              'Replace manual counting shifts with automatic RFID reads.',
  locateItems:             'Find misplaced inventory instantly instead of searching manually.',
  audit:                   'Complete a full stock count in hours instead of days.',
  expiredProducts:         'Flag near-expiration inventory before it becomes a write-off.',
  goodsReceipt:            'Confirm inbound shipments against purchase orders automatically.',
  inventoryRequests:       'Trigger replenishment automatically when stock runs low.',
  returnsTransfers:        'Track inventory moving between locations without manual logging.',
  shrinkage:               'Catch unexplained inventory loss as it happens.',
  rfidTracking:            'Get real-time visibility into every tagged item on the floor.',
  calibrationReminders:    'Get notified before a calibrated asset falls out of compliance.',
  geofencing:              'Alert your team when an asset leaves an authorized zone.',
  productionEquipment:     'Track jigs, fixtures, and tooling to prevent downtime.',
  rtiTracking:             'Track totes and containers to cut loss and replacement costs.',
  workOrderTracking:       'Track how long a job sits at each station.',
  picklistVerification:    'Catch picking errors before an order ships.',
  shipReceiveVerification: 'Move trucks through the dock faster with instant reads.',
  misShipReduction:        'Catch the wrong item before it leaves the building.',
  automatedPackCount:      'Verify case contents against the shipment notice without scanning each item.',
  outboundAudit:           'Certify every dock door before a truck leaves.',
  fasterFulfillment:       "Cut order cycle time to capture orders you're currently turning away.",
  proofOfDelivery:         'Verify tag authenticity to cut fraudulent returns.',
  internalDelivery:        'Confirm internal deliveries with photo and signature proof.',
};

// Map ucKey → solution names that list it as a default (for "also under" label)
const UC_DEFAULT_IN = {};
SOLUTIONS.forEach((sol) => {
  sol.defaults.forEach((key) => {
    if (!UC_DEFAULT_IN[key]) UC_DEFAULT_IN[key] = [];
    UC_DEFAULT_IN[key].push(sol.name);
  });
});

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

export default function Step2_UseCases({ useCases, setUseCases, customCategories, setCustomCategories, onNext, onBack }) {
  const [selectedSolutions, setSelectedSolutions] = useState(new Set());

  function toggleSolution(sol) {
    setSelectedSolutions((prev) => {
      const next = new Set(prev);
      if (next.has(sol.id)) {
        next.delete(sol.id);
        // Disable this solution's defaults unless another selected solution also lists them
        setUseCases((ucs) => {
          const updated = { ...ucs };
          sol.defaults.forEach((key) => {
            const stillNeeded = [...next].some((sid) => {
              const s = SOLUTIONS.find((x) => x.id === sid);
              return s?.defaults.includes(key);
            });
            if (!stillNeeded) {
              updated[key] = { ...updated[key], enabled: false };
            }
          });
          return updated;
        });
      } else {
        next.add(sol.id);
        // Enable this solution's defaults
        setUseCases((ucs) => {
          const updated = { ...ucs };
          sol.defaults.forEach((key) => {
            if (updated[key]) updated[key] = { ...updated[key], enabled: true };
          });
          return updated;
        });
      }
      return next;
    });
  }

  function toggleUseCase(key) {
    setUseCases((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key]?.enabled },
    }));
  }

  const selectedCount = Object.values(useCases).filter((uc) => uc?.enabled).length;
  const anySelected = selectedSolutions.size > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Which Xemelgo solutions apply to you?</h2>
      <p className="text-sm text-gray-500 mb-6">Select all that apply. We'll pre-select the most relevant use cases for each solution.</p>

      {/* Stage 1: Solution toggles */}
      <div className="space-y-3 mb-8">
        {SOLUTIONS.map((sol) => {
          const on = selectedSolutions.has(sol.id);
          const disabled = sol.status === 'comingSoon';
          return (
            <div
              key={sol.id}
              onClick={() => !disabled && toggleSolution(sol)}
              title={disabled ? 'Coming soon.' : undefined}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors
                ${disabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : on
                    ? 'border-blue-300 bg-blue-50 cursor-pointer'
                    : 'border-gray-200 bg-white cursor-pointer'}`}
            >
              <Toggle checked={on} onChange={() => !disabled && toggleSolution(sol)} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${on ? 'text-gray-900' : 'text-gray-700'}`}>{sol.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sol.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage 2: Use case groups — visible once at least one solution is selected */}
      {anySelected && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Customize your use cases</h3>
          <div className="space-y-6">
            {SOLUTIONS.filter((sol) => selectedSolutions.has(sol.id)).map((sol) => {
              const allKeys = [...sol.defaults, ...sol.extras];
              return (
                <div key={sol.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{sol.name}</p>
                  <div className="space-y-2">
                    {allKeys.map((key) => {
                      const enabled = useCases[key]?.enabled ?? false;
                      const isDefault = sol.defaults.includes(key);
                      const alsoIn = (UC_DEFAULT_IN[key] || []).filter((n) => n !== sol.name);
                      return (
                        <div
                          key={key}
                          onClick={() => toggleUseCase(key)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                            ${enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                          <Toggle checked={enabled} onChange={() => toggleUseCase(key)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${enabled ? 'text-gray-900' : 'text-gray-700'}`}>
                                {UC_LABELS[key] || key}
                              </span>
                              {alsoIn.length > 0 && (
                                <span className="text-xs text-gray-400 italic flex-shrink-0">
                                  also under {alsoIn.join(', ')}
                                </span>
                              )}
                              {isDefault && (
                                <span className="text-xs text-blue-500 font-medium flex-shrink-0">default</span>
                              )}
                            </div>
                            {UC_DESCRIPTIONS[key] && (
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{UC_DESCRIPTIONS[key]}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom categories */}
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
                  onClick={(e) => { e.stopPropagation(); setCustomCategories((prev) => prev.filter((c) => c.id !== cat.id)); }}
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

      {/* Selected count bar */}
      <div className={`rounded-xl px-5 py-3 mb-6 border ${selectedCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-sm text-gray-700">
          <span className={`font-semibold ${selectedCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {selectedCount}
          </span>{' '}
          use case{selectedCount !== 1 ? 's' : ''} selected
        </p>
        {selectedCount === 0 && (
          <p className="text-xs text-gray-400 mt-0.5">Select at least one solution to continue.</p>
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
