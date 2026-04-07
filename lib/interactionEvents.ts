export const HF_START_ANALYSIS_EVENT = 'hf:start-analysis';
export const HF_SELECT_PANEL_EVENT = 'hf:select-panel';
export const HF_OPEN_COMMAND_PALETTE_EVENT = 'hf:open-command-palette';

export function dispatchStartAnalysis() {
  window.dispatchEvent(new CustomEvent(HF_START_ANALYSIS_EVENT));
}

export function dispatchSelectPanel(panelId: string) {
  window.dispatchEvent(new CustomEvent(HF_SELECT_PANEL_EVENT, { detail: { panelId } }));
}

export function dispatchOpenCommandPalette() {
  window.dispatchEvent(new CustomEvent(HF_OPEN_COMMAND_PALETTE_EVENT));
}
