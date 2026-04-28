/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { useAuth } from "./FakeAuthContext";
const GOOGLE_GEOCODE_KEY = import.meta?.env?.VITE_GOOGLE_GEOCODE_KEY || "";
const MAPBOX_TOKEN = import.meta?.env?.VITE_MAPBOX_TOKEN || "";
const MAPSCO_API_KEY = import.meta?.env?.VITE_MAPSCO_API_KEY || "";
// Updated to match your Spring Boot backend
// const BASE_URL = "http://localhost:4000";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PropertiesContext = createContext();

const initialState = {
  properties: [],
  isLoading: false,
  isLoadingFavs: false,
  currentProperty: {},
  error: "",
  filters: {
    listingType: "all",
    minPrice: "",
    maxPrice: "",
    bedrooms: "all",
    location: "",
  },
  favorites: [],
  favoriteIds: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };

    case "favorites/loading":
      return { ...state, isLoadingFavs: true };

    case "properties/loaded":
      return {
        ...state,
        isLoading: false,
        properties: action.payload,
      };

    case "property/loaded":
      return {
        ...state,
        isLoading: false,
        currentProperty: action.payload,
      };

    case "property/created":
      return {
        ...state,
        isLoading: false,
        properties: [...state.properties, action.payload],
        currentProperty: action.payload,
      };

    case "property/updated":
      return {
        ...state,
        isLoading: false,
        properties: state.properties.map((property) =>
          property.id === action.payload.id ? action.payload : property,
        ),
        currentProperty: action.payload,
      };

    case "property/deleted":
      return {
        ...state,
        isLoading: false,
        properties: state.properties.filter(
          (property) => property.id !== action.payload,
        ),
        currentProperty: {},
      };

    case "filters/updated":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case "filters/reset":
      return {
        ...state,
        filters: {
          listingType: "all",
          minPrice: "",
          maxPrice: "",
          bedrooms: "all",
          location: "",
        },
      };

    case "favorites/loaded":
      return {
        ...state,
        isLoadingFavs: false,
        favoriteIds: action.payload || [],
      };

    case "favorites/updated":
      return { ...state, favoriteIds: action.payload || [] };

    case "state/reset_keep_public": {
      return {
        ...initialState,
        properties: state.properties,
        filters: state.filters,
      };
    }

    case "rejected":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case "error/cleared":
      return {
        ...state,
        error: "",
      };

    default:
      throw new Error("Unknown action type");
  }
}

// eslint-disable-next-line react/prop-types
function PropertiesProvider({ children }) {
  const [
    {
      properties,
      isLoading,
      currentProperty,
      error,
      filters,
      favorites,
      favoriteIds,
      isLoadingFavs,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  const { user, isAuthenticated } = useAuth();

  // Get current user dynamically
  const getCurrentUser = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem("hs_auth_user")); // Match the key from AuthContext
    } catch {
      return null;
    }
  }, []);

  // Fetch all properties from both endpoints on mount
  useEffect(function () {
    console.log("PropertiesProvider mounted, fetching properties...");
    async function fetchProperties() {
      dispatch({ type: "loading" });
      console.log("Fetching properties from backend...");

      try {
        // Fetch from both endpoints
        const [buyRes, rentRes] = await Promise.all([
          fetch(`${BASE_URL}/buyListings`),
          fetch(`${BASE_URL}/rentListings`),
        ]);

        if (!buyRes.ok || !rentRes.ok) {
          throw new Error("Failed to fetch properties");
        }

        const buyData = await buyRes.json();
        const rentData = await rentRes.json();
        console.log("Fetched properties:", { buyData, rentData });

        // Ensure consistent data structure - backend should already have listingType
        const buyProperties = buyData.map((property) => ({
          ...property,
          listingType: property.listingType || "buy", // Fallback if not set
        }));

        const rentProperties = rentData.map((property) => ({
          ...property,
          listingType: property.listingType || "rent", // Fallback if not set
        }));

        // Combine both arrays
        const allProperties = [...buyProperties, ...rentProperties];

        console.log("Combined properties:", allProperties);
        dispatch({ type: "properties/loaded", payload: allProperties });
      } catch (err) {
        console.error("Error fetching properties:", err);
        dispatch({
          type: "rejected",
          payload: "There was an error loading properties...",
        });
      }
    }
    fetchProperties();
  }, []);

  // Fetch favorites when component mounts or when auth state changes
  useEffect(() => {
    const ctrl = new AbortController();

    async function fetchFavorites() {
      if (!user?.id) {
        dispatch({ type: "favorites/loaded", payload: [] });
        return;
      }
      dispatch({ type: "favorites/loading" });
      try {
        const res = await fetch(`${BASE_URL}/users/${user.id}/favorites`, {
          signal: ctrl.signal,
        });
        if (!res.ok) {
          dispatch({ type: "favorites/loaded", payload: [] });
          return;
        }

        const data = await res.json();

        const ids = Array.isArray(data)
          ? data
          : [...(data.buy || []), ...(data.rent || [])];

        dispatch({ type: "favorites/loaded", payload: ids });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          dispatch({ type: "favorites/loaded", payload: [] });
        }
      }
    }

    fetchFavorites();
    return () => ctrl.abort(); // cancel on unmount/logout
  }, [isAuthenticated, user]);

  // Update favorites both in state and localStorage
  async function updateFavorites(updatedFavorites) {
    const user = getCurrentUser();
    // console.log("updateFavorites called with:", updatedFavorites);
    // console.log("Current user:", user);

    if (!user?.id) {
      console.error("No user ID for favorites update");
      return;
    }

    try {
      // Update localStorage
      const updatedUser = {
        ...user,
        favorites: updatedFavorites, // Store as array or however you prefer
      };

      localStorage.setItem("hs_auth_user", JSON.stringify(updatedUser));

      // Update state
      dispatch({ type: "favorites/updated", payload: updatedFavorites });

      // console.log("updated favorites after dispatch:", favoriteIds);

      // Optionally sync with backend
      const res = await fetch(`${BASE_URL}/users/${user.id}/favorites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favorites: updatedFavorites,
        }),
      });

      if (!res.ok) {
        console.warn("Failed to sync favorites with backend");
        // Don't throw error - localStorage update succeeded
      }

      console.log("Favorites updated successfully");
    } catch (err) {
      console.error("Failed to update favorites:", err);
      throw err;
    }
  }

  // Get a single property by ID
  const getProperty = useCallback(
    async function getProperty(id) {
      if (Number(id) === currentProperty.id) return;

      dispatch({ type: "loading" });

      try {
        // Try to find in current properties first
        const existingProperty = properties.find(
          (p) => String(p.id) === String(id),
        );
        if (existingProperty) {
          dispatch({ type: "property/loaded", payload: existingProperty });
          return;
        }

        // If not found, try both endpoints
        let data = null;
        let foundType = null;

        try {
          const buyRes = await fetch(`${BASE_URL}/buyListings/${id}`);
          if (buyRes.ok) {
            data = await buyRes.json();
            foundType = "buy";
          }
        } catch (err) {
          console.log("Not found in buy listings:", err);
        }

        if (!data) {
          try {
            const rentRes = await fetch(`${BASE_URL}/rentListings/${id}`);
            if (rentRes.ok) {
              data = await rentRes.json();
              foundType = "rent";
            }
          } catch (err) {
            console.log("Not found in rent listings:", err);
          }
        }

        if (data) {
          // Ensure listingType is set correctly
          data.listingType = data.listingType || foundType;
          dispatch({ type: "property/loaded", payload: data });
        } else {
          throw new Error("Property not found");
        }
      } catch (err) {
        console.error("Error loading property:", err);
        dispatch({
          type: "rejected",
          payload: "There was an error loading the property...",
        });
      }
    },
    [currentProperty.id, properties],
  );

  // --- Replace your createProperty with this version ---

  async function createProperty(newProperty) {
    dispatch({ type: "loading" });
    console.log("Creating property with data:", newProperty);

    try {
      const mappedListingType =
        newProperty.listingType === "sell" ? "buy" : newProperty.listingType;

      // Geocode only this property's address
      let lat = null;
      let lon = null;
      if (newProperty.address?.trim()) {
        try {
          const g = await geocodeAddress(newProperty.address.trim());
          lat = Number.isFinite(g.lat) ? g.lat : null;
          lon = Number.isFinite(g.lon) ? g.lon : null;
          console.log("Geocoded:", { lat, lon, provider: g.provider });
        } catch (e) {
          console.warn("Geocode failed; proceeding without coords:", e);
        }
      }

      const propertyData = {
        ...newProperty,
        listingType: mappedListingType,
        ownerId: user?.id ? user.id : null, // keep your owner id behavior
        lat,
        lon,
        // let backend set timestamps / id
      };

      console.log("Final property data to be sent:", propertyData);

      const endpoint =
        mappedListingType === "rent" ? "rentListings" : "buyListings";

      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(propertyData),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create property: ${errorText}`);
      }

      const data = await res.json();

      // Flip back buy->sell for UI consistency
      const responseData = {
        ...data,
        listingType: data.listingType === "buy" ? "sell" : data.listingType,
      };

      dispatch({ type: "property/created", payload: responseData });
      return responseData;
    } catch (error) {
      console.error("Create property error:", error);
      dispatch({
        type: "rejected",
        payload: "There was an error creating the property...",
      });
      throw error;
    }
  }

  // Update an existing property
  async function updateProperty(id, updatedProperty) {
    dispatch({ type: "loading" });

    try {
      const propertyData = {
        ...updatedProperty,
        updatedAt: new Date().toISOString(),
      };

      // Determine which endpoint to use based on listingType
      const endpoint =
        updatedProperty.listingType === "rent" ? "rentListings" : "buyListings";

      const res = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(propertyData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update property: ${errorText}`);
      }

      const data = await res.json();
      dispatch({ type: "property/updated", payload: data });
      return data;
    } catch (error) {
      console.error("Update property error:", error);
      dispatch({
        type: "rejected",
        payload: "There was an error updating the property...",
      });
      throw error;
    }
  }

  // Delete a property
  async function deleteProperty(id) {
    dispatch({ type: "loading" });

    try {
      // Find the property to determine which endpoint to use
      const property = properties.find((p) => String(p.id) === String(id));
      if (!property) throw new Error("Property not found");

      const endpoint =
        property.listingType === "rent" ? "rentListings" : "buyListings";

      const res = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete property: ${errorText}`);
      }

      dispatch({ type: "property/deleted", payload: Number(id) });
    } catch (error) {
      console.error("Delete property error:", error);
      dispatch({
        type: "rejected",
        payload: "There was an error deleting the property...",
      });
      throw error;
    }
  }

  async function geocodeAddress(address) {
    if (!address || !address.trim())
      return { lat: null, lon: null, provider: null };

    // Try Google
    if (GOOGLE_GEOCODE_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${GOOGLE_GEOCODE_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const r = data.results?.[0];
          if (r?.geometry?.location) {
            const { lat, lng } = r.geometry.location;
            return { lat, lon: lng, provider: "google" };
          }
        }
      } catch (_) {
        /* empty */
      }
    }

    // Try Mapbox
    if (MAPBOX_TOKEN) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address,
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,place,poi`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const f = data.features?.[0];
          if (f?.center?.length === 2) {
            const [lon, lat] = f.center;
            return { lat, lon, provider: "mapbox" };
          }
        }
      } catch (_) {
        /* empty */
      }
    }

    // Try Maps.co (requires key now)
    if (MAPSCO_API_KEY) {
      try {
        const url = `https://geocode.maps.co/search?q=${encodeURIComponent(
          address,
        )}&api_key=${MAPSCO_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const hit = Array.isArray(data) ? data[0] : null;
          if (hit?.lat && hit?.lon) {
            return {
              lat: Number(hit.lat),
              lon: Number(hit.lon),
              provider: "maps.co",
            };
          }
        }
      } catch (_) {
        /* empty */
      }
    }

    // Fallback: Photon (no key)
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        address,
      )}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const f = data.features?.[0];
        const coords = f?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          const [lon, lat] = coords;
          return { lat: Number(lat), lon: Number(lon), provider: "photon" };
        }
      }
    } catch (_) {
      /* empty */
    }

    // Couldn’t geocode; store nulls so backend/UI can handle it gracefully.
    return { lat: null, lon: null, provider: null };
  }

  // Update filters
  function updateFilters(newFilters) {
    dispatch({ type: "filters/updated", payload: newFilters });
  }

  // Reset filters
  function resetFilters() {
    dispatch({ type: "filters/reset" });
  }

  // Clear error
  function clearError() {
    dispatch({ type: "error/cleared" });
  }

  // Get filtered properties based on current filters
  const filteredProperties = properties.filter((property) => {
    // Filter by listing type
    if (
      filters.listingType !== "all" &&
      property.listingType !== filters.listingType
    ) {
      return false;
    }

    // Filter by price range
    if (filters.minPrice && property.minPrice < parseInt(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && property.maxPrice > parseInt(filters.maxPrice)) {
      return false;
    }

    // Filter by bedrooms
    if (filters.bedrooms !== "all") {
      const bedroomCount = parseInt(filters.bedrooms);
      if (property.minBeds > bedroomCount || property.maxBeds < bedroomCount) {
        return false;
      }
    }

    // Filter by location (simple text search)
    if (
      filters.location &&
      !property.address
        .toLowerCase()
        .includes(filters.location.toLowerCase()) &&
      !property.name.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Search properties by text
  const searchProperties = useCallback(
    function searchProperties(searchTerm) {
      if (!searchTerm.trim()) return properties;

      const term = searchTerm.toLowerCase();
      return properties.filter(
        (property) =>
          property.name.toLowerCase().includes(term) ||
          property.address.toLowerCase().includes(term) ||
          (property.description &&
            property.description.toLowerCase().includes(term)),
      );
    },
    [properties],
  );

  return (
    <PropertiesContext.Provider
      value={{
        // State
        properties,
        isLoading,
        filteredProperties,
        isLoadingFavs,
        favorites,
        favoriteIds,
        currentProperty,
        error,
        filters,

        // Actions
        getCurrentUser,
        getProperty,
        createProperty,
        updateProperty,
        deleteProperty,
        updateFilters,
        updateFavorites,
        resetFilters,
        clearError,
        searchProperties,
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
}

function useProperties() {
  const context = useContext(PropertiesContext);
  if (context === undefined)
    throw new Error(
      "PropertiesContext was used outside the PropertiesProvider",
    );
  return context;
}

export { PropertiesProvider, useProperties };
