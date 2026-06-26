import { calcAllSavings } from '../../utils/calculations';
import { fmt$, fmtHrs } from '../../utils/format';

function LaborCard({ title, description, minutesKey, peopleKey, annualValue, hoursPerWeek, savings, setSavings }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4">
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minutes Saved / Person / Day
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={120}
              value={savings[minutesKey]}
              onChange={(e) => setSavings((prev) => ({ ...prev, [minutesKey]: Number(e.target.value) }))}
              className="flex-1 accent-blue-600"
            />
            <input
              type="number"
              min={0}
              max={120}
              value={savings[minutesKey]}
              onChange={(e) => setSavings((prev) => ({ ...prev, [minutesKey]: Number(e.target.value) }))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            People Affected
          </label>
          <input
            type="number"
            min={0}
            value={savings[peopleKey]}
            onChange={(e) => setSavings((prev) => ({ ...prev, [peopleKey]: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-4 bg-blue-50 rounded-lg p-3">
        <div>
          <span className="text-xs text-blue-600 font-medium">Weekly Hours Saved</span>
          <p className="text-lg font-bold text-blue-700">{fmtHrs(hoursPerWeek)}</p>
        </div>
        <div className="border-l border-blue-200 pl-4">
          <span className="text-xs text-blue-600 font-medium">Annual Value</span>
          <p className="text-lg font-bold text-blue-700">{fmt$(annualValue)}</p>
        </div>
      </div>
    </div>
  );
}

export default function Step2_SavingsInputs({ ops, savings, setSavings, onNext, onBack }) {
  const result = calcAllSavings(ops, savings);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Where Xemelgo Creates Value</h2>
      <p className="text-sm text-gray-500 mb-6">
        These benchmarks are based on real customer deployments. Adjust to match your operation.
      </p>

      <LaborCard
        title="Daily Production Meeting Efficiency"
        description="Xemelgo gives your indirect team real-time inventory visibility before the morning meeting. Instead of manually gathering data or walking the floor, your team walks in prepared — cutting meeting prep and meeting time."
        minutesKey="meetingMinutesSaved"
        peopleKey="meetingPeopleAffected"
        hoursPerWeek={result.meeting.hoursPerWeek}
        annualValue={result.meeting.annualValue}
        savings={savings}
        setSavings={setSavings}
      />

      <LaborCard
        title="Material Handlers: Parts Search Time"
        description="RFID readers and location-aware tags let material handlers scan a zone or query the app to find parts instantly. No more walking aisles or asking coworkers — Xemelgo tells them exactly where inventory is."
        minutesKey="handlerSearchMinutesSaved"
        peopleKey="handlerSearchPeopleAffected"
        hoursPerWeek={result.handlerSearch.hoursPerWeek}
        annualValue={result.handlerSearch.annualValue}
        savings={savings}
        setSavings={setSavings}
      />

      <LaborCard
        title="Production Control: Parts Search & Exception Management"
        description="Planners and production control staff spend significant time hunting for shortage parts or reconciling inventory records. Xemelgo's real-time visibility and exception alerts eliminate most of this reactive work."
        minutesKey="productionSearchMinutesSaved"
        peopleKey="productionSearchPeopleAffected"
        hoursPerWeek={result.productionSearch.hoursPerWeek}
        annualValue={result.productionSearch.annualValue}
        savings={savings}
        setSavings={setSavings}
      />

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Other Savings</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quarterly Cycle Count Savings ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">$</span>
            <input
              type="number"
              min={0}
              value={savings.cycleCountQuarterlySavings}
              onChange={(e) => setSavings((prev) => ({ ...prev, cycleCountQuarterlySavings: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Saved per quarter. Xemelgo's continuous RFID cycle counting dramatically reduces the labor needed for physical inventory counts, often cutting count time by 60–80%.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue Acceleration ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">$</span>
            <input
              type="number"
              min={0}
              value={savings.revenueAccelerationMonthly}
              onChange={(e) => setSavings((prev) => ({ ...prev, revenueAccelerationMonthly: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Per month. By eliminating stockouts and reducing WIP delays, Xemelgo customers typically release 1–3 days of additional throughput per month, translating directly to revenue.</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-blue-900 mb-3">Projected Annual Opportunity</h3>
        <div className="space-y-2">
          {[
            ['Daily Production Meetings', result.meeting.annualValue],
            ['Material Handler Search', result.handlerSearch.annualValue],
            ['Production Control Search', result.productionSearch.annualValue],
            ['Quarterly Cycle Counts', result.cycleCountAnnual],
            ['Revenue Acceleration', result.revenueAccelAnnual],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm text-blue-800">
              <span>{label}</span>
              <span>{fmt$(val)}</span>
            </div>
          ))}
          <div className="border-t border-blue-300 pt-2 flex justify-between font-bold text-blue-900">
            <span>Total Gross Annual</span>
            <span>{fmt$(result.totalGrossAnnual)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          Next: Financial Inputs →
        </button>
      </div>
    </div>
  );
}
