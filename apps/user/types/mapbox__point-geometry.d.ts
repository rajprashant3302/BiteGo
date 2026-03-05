// Provide a minimal declaration to satisfy TypeScript when the package
// doesn't ship its own types and no @types package is installed.

declare module 'mapbox__point-geometry' {
  // You can add specific exports if you know them, but a generic any is fine.
  const value: any;
  export default value;
}
