import { useEffect, useRef } from 'react';
import L, { type Map as LeafletMap, type LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ShopMap.css';
import type { ShopProfile } from '../api/shoppingApi';
import { getShopOpenStatus } from '../utils/shopStatus';

type Coordinates = { latitude: number; longitude: number };

function coordinatesFor(shop: ShopProfile): Coordinates | null {
  const latitude = shop.location?.latitude;
  const longitude = shop.location?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number'
      || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
      || (latitude === 0 && longitude === 0)) return null;
  return { latitude, longitude };
}

function shopAddress(shop: ShopProfile) {
  return [
    shop.location?.address,
    shop.areaName,
    shop.lga,
    shop.state,
    shop.country,
  ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .filter((part, index, parts) => parts.findIndex((value) => value.toLowerCase() === part.toLowerCase()) === index)
    .join(', ');
}

function markerElement(kind: 'shop' | 'user') {
  return L.divIcon({
    className: 'hive-map-marker-shell',
    html: `<span class="hive-map-marker hive-map-marker-${kind}" aria-hidden="true"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function ShopMap({
  shops,
  userLocation,
  onOpenShop,
  className = '',
}: {
  shops: ShopProfile[];
  userLocation: Coordinates | null;
  onOpenShop: (shopId: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { scrollWheelZoom: false }).setView([9.08, 8.67], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    const markers = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersRef.current = markers;

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => map.invalidateSize());
    resizeObserver?.observe(container);
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();
    const visibleCoordinates: L.LatLngExpression[] = [];

    for (const shop of shops) {
      const coordinates = coordinatesFor(shop);
      if (!coordinates) continue;
      const isOpen = getShopOpenStatus(shop);
      const marker = L.marker([coordinates.latitude, coordinates.longitude], { icon: markerElement('shop') });
      const popup = document.createElement('div');
      popup.className = 'hive-map-popup';

      const imageUrl = shop.banner || shop.imageUrl;
      if (typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl)) {
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = '';
        image.className = 'hive-map-popup-image';
        popup.append(image);
      }

      const name = document.createElement('strong');
      name.textContent = shop.name;
      popup.append(name);

      const status = document.createElement('span');
      status.className = isOpen == null
        ? 'hive-map-popup-status hive-map-popup-status-unknown'
        : isOpen
          ? 'hive-map-popup-status hive-map-popup-status-open'
          : 'hive-map-popup-status hive-map-popup-status-closed';
      status.textContent = isOpen == null ? 'Status unavailable' : isOpen ? 'Open' : 'Closed';
      popup.append(status);

      const address = shopAddress(shop);
      if (address) {
        const location = document.createElement('span');
        location.textContent = address;
        popup.append(location);
      }

      if (typeof shop.distanceMeters === 'number' && Number.isFinite(shop.distanceMeters) && shop.distanceMeters >= 0) {
        const distance = document.createElement('span');
        distance.textContent = shop.distanceMeters < 1000
          ? `${Math.round(shop.distanceMeters)} m away`
          : `${(shop.distanceMeters / 1000).toFixed(1)} km away`;
        popup.append(distance);
      }

      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.textContent = 'Open shop profile';
      openButton.addEventListener('click', () => onOpenShop(shop.id));
      popup.append(openButton);
      marker.bindPopup(popup).addTo(markers);
      visibleCoordinates.push([coordinates.latitude, coordinates.longitude]);
    }

    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).bindPopup('Your location').addTo(markers);
      visibleCoordinates.push([userLocation.latitude, userLocation.longitude]);
      userMarker.bringToFront();
    }

    if (visibleCoordinates.length > 1) {
      map.fitBounds(L.latLngBounds(visibleCoordinates), { padding: [28, 28], maxZoom: 14 });
    } else if (visibleCoordinates.length === 1) {
      map.setView(visibleCoordinates[0], userLocation ? 14 : 12);
    }
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [shops, userLocation, onOpenShop]);

  return <div ref={containerRef} className={`hive-map ${className}`} role="application" aria-label="Interactive shop map" />;
}
