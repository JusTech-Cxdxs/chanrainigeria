// Lets any button on the site open Enyo with a question already typed.
export const ENYO_ASK = "cn-enyo-ask";
export function askEnyo(text: string) {
  window.dispatchEvent(new CustomEvent(ENYO_ASK, { detail: text }));
}
