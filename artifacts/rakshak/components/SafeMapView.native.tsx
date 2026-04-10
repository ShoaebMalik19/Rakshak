import React from 'react';
import MapView, { Circle, Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

// Re-export everything so map.tsx can use these without Platform checks
export { Circle, Polyline, Marker, PROVIDER_DEFAULT };
export default MapView;
