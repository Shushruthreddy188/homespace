import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertiesContext";

/**
 * Shared favorite behaviour for the property lists. The context updates favoriteIds
 * optimistically, so components don't need their own local mirror of the list.
 */
export function useFavoriteToggle() {
  const { user } = useAuth();
  const { favoriteIds, updateFavorites } = useProperties();

  const isFavorited = (propertyId) => (favoriteIds || []).includes(propertyId);

  const toggleFavorite = async (property) => {
    if (!user?.id) {
      alert("Please sign in to save favorites.");
      return;
    }

    const current = favoriteIds || [];
    const updated = current.includes(property.id)
      ? current.filter((id) => id !== property.id)
      : [...current, property.id];

    try {
      await updateFavorites(updated);
    } catch {
      alert("Failed to update favorites. Please try again.");
    }
  };

  return { toggleFavorite, isFavorited, favoriteIds };
}
