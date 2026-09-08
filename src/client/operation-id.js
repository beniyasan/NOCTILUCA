// getRandomValues also works in the HTTP preview; commands still get 128-bit random IDs.
export function operationId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
