import styles from "./MapPopupCard.module.css";

export default function MapPopupCard({
  // eslint-disable-next-line react/prop-types
  property,
}) {
  // eslint-disable-next-line react/prop-types
  const { image, name, address, listingType, minPrice, maxPrice } = property;

  const formatPrice = () => {
    const minPriceStr = minPrice != null ? minPrice.toLocaleString() : "?";
    const maxPriceStr = maxPrice != null ? maxPrice.toLocaleString() : "?";

    if (listingType === "rent") {
      return `$${minPriceStr}–$${maxPriceStr} / mo`;
    }
    return `$${minPriceStr}–$${maxPriceStr}`;
  };

  return (
    <div className={styles.popupCard}>
      <div className={styles.imageContainer}>
        {image && (
          <img src={image} alt={name || "Property"} className={styles.image} />
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{name || "Property"}</div>
        <div className={styles.address}>{address}</div>
        <div className={styles.price}>{formatPrice()}</div>
      </div>
    </div>
  );
}
