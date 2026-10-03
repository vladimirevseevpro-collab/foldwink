// Feature flags. Defaults ON; set VITE_ENABLE_ARCHIVIST_LAYER=false to hide
// the archivist UI (Passport, Mastery Challenge, Palimpsest) without touching
// persisted data or profile export/import.
export const ENABLE_ARCHIVIST_LAYER = import.meta.env.VITE_ENABLE_ARCHIVIST_LAYER !== "false";
