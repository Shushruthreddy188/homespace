// Map.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { useLocation } from "react-router-dom";
import { useProperties } from "../contexts/PropertiesContext";
import styles from "./Map.module.css";
import { useGeolocation } from "../hooks/useGeolocation";
import { useUrlPosition } from "../hooks/useUrlPosition";
import { useAuth } from "../contexts/FakeAuthContext";
import MapPopupCard from "./MapPopupCard";

export default function Map() {
  // Default center = Lubbock
  const [center, setCenter] = useState([33.5779, -101.8552]);

  const { user } = useAuth();
  const userId = user?.id;

  const { properties, favoriteIds } = useProperties();
  const location = useLocation();

  const {
    isLoading: isLocLoading,
    position: geoPos,
    getPosition,
  } = useGeolocation();

  const [urlLat, urlLng] = useUrlPosition();

  // Derive favorites from source of truth
  const favorites = useMemo(() => {
    const ids = favoriteIds || [];
    return (properties || []).filter((p) => ids.includes(p.id));
  }, [properties, favoriteIds]);

  // Derive user listings robustly (ownerId, owner.id or owner as id)
  const userListings = useMemo(() => {
    if (!userId) return [];
    const getOwnerId = (p) =>
      p.ownerId ?? (typeof p.owner === "object" ? p.owner?.id : p.owner);
    return (properties || []).filter(
      (p) => Number(getOwnerId(p)) === Number(userId)
    );
  }, [properties, userId]);

  const baseForRoute = useMemo(() => {
    if (location.pathname.includes("/favorites")) return favorites;
    if (location.pathname.includes("/userlistings")) return userListings;
    return properties || [];
  }, [location.pathname, properties, favorites, userListings]);

  // Filter properties based on current URL path
  const filteredByRoute = useMemo(() => {
    if (location.pathname.includes("/rent"))
      return baseForRoute.filter((p) => p.listingType === "rent");
    if (location.pathname.includes("/buy"))
      return baseForRoute.filter(
        (p) => p.listingType === "buy" || p.listingType === "sell"
      );
    return baseForRoute;
  }, [baseForRoute, location.pathname]);

  // Use only properties that already have coords in db.json
  const withCoords = useMemo(() => {
    return filteredByRoute
      .map((p) => {
        const latNum = Number(p.lat);
        const lonNum = Number(p.lon);
        if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
          return { ...p, _lat: latNum, _lon: lonNum };
        }
        return null;
      })
      .filter(Boolean);
  }, [filteredByRoute]);

  // Center from URL (if provided)
  useEffect(() => {
    const a = Number(urlLat),
      b = Number(urlLng);
    if (Number.isFinite(a) && Number.isFinite(b)) setCenter([a, b]);
  }, [urlLat, urlLng]);

  // Center from geolocation
  useEffect(() => {
    if (geoPos) setCenter([geoPos.lat, geoPos.lng]);
  }, [geoPos]);

  // If we have coords but no explicit center yet, center on the first property
  useEffect(() => {
    if (withCoords.length && !geoPos && (urlLat == null || urlLng == null)) {
      setCenter([withCoords[0]._lat, withCoords[0]._lon]);
    }
  }, [withCoords, geoPos, urlLat, urlLng]);

  // Stable center for MapContainer (avoid re-creating array)
  const memoCenter = useMemo(() => center, [center]);

  const currentListingType = useMemo(() => {
    if (location.pathname.includes("/rent")) return "rent";
    if (location.pathname.includes("/buy")) return "buy";
    return "all";
  }, [location.pathname]);

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={memoCenter}
        zoom={12}
        scrollWheelZoom
        className={styles.map}
        zoomControl={false}
      >
        <ZoomControl position="topright" />

        <MyLocationControl
          isLocLoading={isLocLoading}
          geoPos={geoPos}
          getPosition={getPosition}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeCenter position={memoCenter} />

        {withCoords.map((p) => (
          <Marker key={String(p.id ?? p.name)} position={[p._lat, p._lon]}>
            <Popup>
              <MapPopupCard property={p} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!withCoords.length && filteredByRoute.length > 0 && (
        <div style={{ marginTop: 8, color: "#e74c3c" }}>
          No coordinates found for{" "}
          {currentListingType === "all" ? "" : currentListingType} properties.
          Make sure your db.json has numeric <code>lat</code> and{" "}
          <code>lon</code>.
        </div>
      )}

      {!filteredByRoute.length && (
        <div style={{ marginTop: 8, color: "#e74c3c" }}>
          No {currentListingType === "all" ? "" : currentListingType} properties
          found.
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line react/prop-types
function ChangeCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [map, position]);
  return null;
}

// eslint-disable-next-line react/prop-types
function MyLocationControl({ isLocLoading, geoPos, getPosition }) {
  const map = useMap();
  const [armed, setArmed] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!btnRef.current) return;
    L.DomEvent.disableClickPropagation(btnRef.current);
    L.DomEvent.disableScrollPropagation(btnRef.current);
  }, []);

  useEffect(() => {
    if (armed && geoPos) {
      flyToPos(map, geoPos);
      setArmed(false);
    }
  }, [armed, geoPos, map]);

  function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (geoPos) {
      flyToPos(map, geoPos);
    } else {
      setArmed(true);
      getPosition();
    }
  }

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <button
      ref={btnRef}
      className={styles.locationButton}
      onClick={handleClick}
      onMouseDown={stop}
      onDoubleClick={stop}
      onTouchStart={stop}
      disabled={isLocLoading}
      title={
        isLocLoading ? "Getting your location..." : "Use your current location"
      }
      style={{ position: "absolute", top: 96, right: 10 }}
      aria-label="Use my current location"
    >
      {isLocLoading ? (
        <div className={styles.spinner} />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M11 3h2v3h-2V3zm0 15h2v3h-2v-3zM3 11h3v2H3v-2zm15 0h3v2h-3v-2z"
            fill="currentColor"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}

function flyToPos(map, pos) {
  const target = [pos.lat, pos.lng];
  const zoom = Math.max(map.getZoom(), 13);
  map.flyTo(target, zoom, { duration: 0.8 });
}
