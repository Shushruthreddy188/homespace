import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import styles from "./ContactAgentCard.module.css";

export default function ContactAgentCard({ anchorRef, agent, onClose }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const el = anchorRef?.current;
    const card = cardRef.current;
    if (!el || !card) return;

    const rect = el.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate initial position
    let top = rect.bottom + 10;
    let left = rect.left + rect.width / 2;

    // Adjust horizontal position if card would go off-screen
    const cardWidth = cardRect.width || 280; // fallback width
    if (left + cardWidth / 2 > viewportWidth - 20) {
      left = viewportWidth - cardWidth / 2 - 20;
    }
    if (left - cardWidth / 2 < 20) {
      left = cardWidth / 2 + 20;
    }

    // Adjust vertical position if card would go off-screen
    const cardHeight = cardRect.height || 120; // fallback height
    if (top + cardHeight > viewportHeight - 20) {
      top = rect.top - cardHeight - 10; // Show above the anchor
    }

    setPos({ top, left });
  }, [anchorRef]);

  // 🔒 lock scrolling on mount, restore on unmount
  useEffect(() => {
    // lock body (no page scroll & no jump)
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      width: style.width,
      overflow: style.overflow,
    };
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    style.overflow = "hidden";

    // also lock your scrollable grid
    const grid = document.querySelector(".propertiesGrid");
    const prevGridOverflow = grid?.style.overflow;
    if (grid) grid.style.overflow = "hidden";

    return () => {
      // restore grid first
      if (grid) grid.style.overflow = prevGridOverflow || "";

      // restore body & scroll position
      style.position = prev.position || "";
      style.top = prev.top || "";
      style.width = prev.width || "";
      style.overflow = prev.overflow || "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const { fullName, company, email, phone, photoUrl } = agent || {};

  // Debug logging
  console.log("Card position:", pos);
  console.log("Agent data:", agent);

  return createPortal(
    <>
      {/* 🪟 backdrop blocks pointer/scroll */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div
        ref={cardRef}
        className={styles.portalCard}
        style={{
          top: `${pos.top}px`,
          left: `${pos.left}px`,
          visibility: pos.top > 0 ? "visible" : "hidden", // Hide until positioned
        }}
        role="dialog"
        aria-label="Agent details"
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
        <img
          src={photoUrl || "https://i.pravatar.cc/72"}
          alt={fullName || "Agent"}
          className={styles.avatar}
        />
        <div className={styles.info}>
          <div className={styles.name}>{fullName || "Your Agent"}</div>
          {company && <div className={styles.company}>{company}</div>}
          {email && (
            <a href={`mailto:${email}`} className={styles.line}>
              <svg
                className={styles.icon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className={styles.line}>
              <svg
                className={styles.icon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {phone}
            </a>
          )}
        </div>
        <span className={styles.caret} />
      </div>
    </>,
    document.body
  );
}

ContactAgentCard.propTypes = {
  anchorRef: PropTypes.object,
  agent: PropTypes.object,
  onClose: PropTypes.func,
};
