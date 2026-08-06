const terminologyExemption = /^(?:<!-- terminology-exempt: [^\n]+ -->|\{\/\* terminology-exempt: [^\n]+ \*\/\})\n?/gmu;

export const stripTerminologyExemptions = (document) => ({
  ...document,
  body: document.body.replace(terminologyExemption, ''),
});
