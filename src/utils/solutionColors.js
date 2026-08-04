export const SOLUTION_COLORS = {
  'Inventory Management': { border: '#185FA5', tint: '#E6F1FB', text: '#0C447C' },
  'Asset Tracking':       { border: '#0F6E56', tint: '#E1F5EE', text: '#085041' },
  'Work in Process':      { border: '#534AB7', tint: '#EEEDFE', text: '#3C3489' },
  'Shipment Tracking':    { border: '#854F0B', tint: '#FAEEDA', text: '#633806' },
  'Package Delivery':     { border: '#6b7280', tint: '#f3f4f6', text: '#374151' },
  'Custom':               { border: '#6b7280', tint: '#f3f4f6', text: '#374151' },
};

export function getSolutionColor(solutionName) {
  return SOLUTION_COLORS[solutionName] || SOLUTION_COLORS['Custom'];
}
