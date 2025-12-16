/**
 * Cookie Consent Banner Styles
 * ChromebookUnlocked.Github.io
 */

/* Banner Container */
.cookie-consent-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(150%);
  max-width: 620px; /* ⬅ wider */
  width: calc(100% - 40px);

  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 30px rgba(139, 92, 246, 0.25);

  padding: 26px 28px;
  border-radius: 18px;
  z-index: 999999;

  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.35s ease;
}

.cookie-consent-banner.cookie-consent-visible {
  transform: translateX(-50%) translateY(0);
}

/* Content Layout */
.cookie-consent-content {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Text */
.cookie-consent-text h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.cookie-consent-text p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
}

.cookie-consent-text a {
  color: #a78bfa;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid rgba(167, 139, 250, 0.3);
}

.cookie-consent-text a:hover {
  color: #c4b5fd;
}

/* Buttons */
.cookie-consent-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cookie-btn {
  padding: 11px 22px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

/* Accept on the RIGHT */
.cookie-btn-accept {
  margin-left: auto;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
}

.cookie-btn-accept:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(139, 92, 246, 0.55);
}

.cookie-btn-settings {
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cookie-btn-settings:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

/* Expanded settings */
.cookie-settings-expanded {
  display: flex;
  gap: 12px;
}

.cookie-btn-decline {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Close Button — ONLY X visible */
.cookie-close-btn {
  position: absolute;
  top: 18px;
  right: 18px;

  background: none;
  border: none;
  padding: 0;
  margin: 0;

  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: color 0.2s ease, transform 0.2s ease;
}

/* Invisible hitbox */
.cookie-close-btn::before {
  content: "";
  position: absolute;
  inset: -12px;
}

.cookie-close-btn svg {
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.cookie-close-btn:hover {
  color: rgba(255, 255, 255, 0.95);
  transform: scale(1.1);
}

.cookie-close-btn:active {
  transform: scale(0.95);
}

.cookie-close-btn:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 4px;
  border-radius: 4px;
}

/* Mobile */
@media (max-width: 600px) {
  .cookie-consent-buttons {
    flex-direction: column;
  }

  .cookie-btn-accept {
    margin-left: 0;
    width: 100%;
  }

  .cookie-btn {
    width: 100%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
