import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Web implementation of the map. react-native-maps is native-only, so on web we
 * render a Leaflet + OpenStreetMap map inside a sandboxed iframe. No API key needed.
 *
 * It accepts the same children as react-native-maps (<Circle>, <Polyline>, <Marker>)
 * and translates their props into Leaflet layers, so MapScreen needs no Platform checks.
 */

type LatLng = { latitude: number; longitude: number };
type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

export const Circle = (_: { center: LatLng; radius: number; fillColor?: string; strokeColor?: string; strokeWidth?: number }) => null;
export const Polyline = (_: { coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number; lineDashPattern?: number[] }) => null;
export const Marker = (_: { coordinate: LatLng; title?: string; description?: string; pinColor?: string; children?: React.ReactNode }) => null;
export const PROVIDER_DEFAULT = undefined;

type Layer =
  | { k: 'circle'; lat: number; lng: number; r: number; fill?: string; stroke?: string; w?: number }
  | { k: 'line'; pts: [number, number][]; color?: string; w?: number; dash?: string }
  | { k: 'marker'; lat: number; lng: number; title?: string; desc?: string; color?: string };

function collect(children: React.ReactNode, out: Layer[]) {
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    const p: any = child.props;
    if (child.type === React.Fragment) return collect(p.children, out);
    if (child.type === Circle) {
      out.push({ k: 'circle', lat: p.center.latitude, lng: p.center.longitude, r: p.radius, fill: p.fillColor, stroke: p.strokeColor, w: p.strokeWidth });
    } else if (child.type === Polyline) {
      out.push({
        k: 'line', pts: p.coordinates.map((c: LatLng) => [c.latitude, c.longitude]),
        color: p.strokeColor, w: p.strokeWidth, dash: p.lineDashPattern ? p.lineDashPattern.join(' ') : undefined,
      });
    } else if (child.type === Marker) {
      out.push({ k: 'marker', lat: p.coordinate.latitude, lng: p.coordinate.longitude, title: p.title, desc: p.description, color: p.pinColor });
    }
  });
}

function buildHtml(layers: Layer[], region?: Region, user?: LatLng | null) {
  const data = JSON.stringify({ layers, region, user }).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#m{height:100%;margin:0;background:#EDE8DF;font-family:system-ui,sans-serif}
.leaflet-tooltip{font-size:12px;font-weight:600}</style></head>
<body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var D=${data};
var map=L.map('m',{zoomControl:true,attributionControl:true});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
var b=[];
D.layers.forEach(function(l){
  if(l.k==='circle'){L.circle([l.lat,l.lng],{radius:l.r,color:l.stroke||'#C0445A',weight:l.w||2,fillColor:l.stroke||'#C0445A',fillOpacity:0.18}).addTo(map);b.push([l.lat,l.lng]);}
  else if(l.k==='line'){L.polyline(l.pts,{color:l.color||'#C0445A',weight:l.w||3,dashArray:l.dash,opacity:0.9}).addTo(map);l.pts.forEach(function(p){b.push(p)});}
  else if(l.k==='marker'){var m=L.circleMarker([l.lat,l.lng],{radius:7,color:'#fff',weight:2,fillColor:l.color||'#C0445A',fillOpacity:1}).addTo(map);
    if(l.title)m.bindTooltip(l.title+(l.desc?'<br><span style="font-weight:400">'+l.desc+'</span>':''));b.push([l.lat,l.lng]);}
});
if(D.user){L.circleMarker([D.user.latitude,D.user.longitude],{radius:9,color:'#fff',weight:3,fillColor:'#1565C0',fillOpacity:1}).addTo(map).bindTooltip('You are here',{permanent:true,direction:'top'});}
if(D.user){map.setView([D.user.latitude,D.user.longitude],14);}
else if(b.length){map.fitBounds(b,{padding:[24,24]});}
else if(D.region){map.setView([D.region.latitude,D.region.longitude],12);}
</script></body></html>`;
}

interface Props {
  style?: any;
  initialRegion?: Region;
  /** Web-only extra: show the user's position and centre on it. */
  userLocation?: LatLng | null;
  children?: React.ReactNode;
  [key: string]: any;
}

export default function MapView({ style, initialRegion, userLocation, children }: Props) {
  const html = useMemo(() => {
    const layers: Layer[] = [];
    collect(children, layers);
    return buildHtml(layers, initialRegion, userLocation);
    // Children are recreated every render; key the iframe on the serialised layers instead.
  }, [JSON.stringify(collectKey(children)), userLocation?.latitude, userLocation?.longitude]);

  return (
    <View style={[styles.wrap, style]}>
      {React.createElement('iframe', {
        title: 'Safety map',
        srcDoc: html,
        sandbox: 'allow-scripts',
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}

function collectKey(children: React.ReactNode) {
  const out: Layer[] = [];
  collect(children, out);
  return out;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#EDE8DF', overflow: 'hidden' },
});
