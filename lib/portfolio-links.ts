// Printed codes must use the production address, never localhost or a preview URL.
// If a custom domain replaces this origin, retain redirects from existing links.
export const PORTFOLIO_ORIGIN = 'https://taste-folio.violakorir24.workers.dev';
export function portfolioUrl(slug:string){return `${PORTFOLIO_ORIGIN}/p/${encodeURIComponent(slug)}`}
export function portfolioCardPath(slug:string){return `/p/${encodeURIComponent(slug)}/card`}
