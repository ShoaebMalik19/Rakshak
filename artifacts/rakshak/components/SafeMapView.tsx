// Type-only entry. At runtime Metro resolves SafeMapView.native.tsx (iOS/Android)
// or SafeMapView.web.tsx (browser) before this file, so this is never bundled.
export * from './SafeMapView.web';
export { default } from './SafeMapView.web';
