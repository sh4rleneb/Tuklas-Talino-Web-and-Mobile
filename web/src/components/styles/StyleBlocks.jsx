import React from 'react';

const TUKLAS_KAAGAPAY_BADGE_IMAGE = '/badges/kaagapay-sa-gawain.png';
const TUKLAS_BITUIN_BADGE_IMAGE = '/badges/bituin-sa-pagsagot.png';

function isTuklasKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code === 'group_1' || code.includes('kaagapay');
}

function isTuklasBituinBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'bituin sa pagsagot' || code === 'writing_3' || code.includes('writing') || code.includes('sagot');
}

function TuklasBadgeVisual({ badge, fallback = '🏅', size = 72 }) {
  if (isTuklasBituinBadge(badge)) {
    return (
      <img
        src={TUKLAS_BITUIN_BADGE_IMAGE}
        alt={badge?.name || 'Bituin sa Pagsagot'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasKaagapayBadge(badge)) {
    return (
      <img
        src={TUKLAS_KAAGAPAY_BADGE_IMAGE}
        alt={badge?.name || 'Kaagapay sa Gawain'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  return <>{badge?.icon || fallback}</>;
}


export function Grade46ReferenceStyles() {
  return (
    <style>{`
      .g46-ref-page {
        --tt-green: #15965a;
        --tt-green-dark: #0f7d49;
        --tt-green-soft: #edf8f1;
        --tt-yellow: #fff5cf;
        --tt-yellow-deep: #f6c453;
        --tt-purple: #7b4fd6;
        --tt-sky: #eef8ff;
        --tt-cream: #fffdf7;
        --tt-ink: #203451;
        --tt-muted: #526988;
        min-height: 100vh;
        padding: 28px;
        background:
          radial-gradient(circle at 12% 12%, rgba(255, 245, 207, 0.90), transparent 28%),
          radial-gradient(circle at 92% 82%, rgba(237, 248, 241, 0.88), transparent 30%),
          linear-gradient(135deg, #fffdf7 0%, #eef8ff 52%, #edf8f1 100%);
        color: var(--tt-ink);
      }

      .g46-ref-frame {
        width: min(1240px, calc(100vw - 44px));
        min-height: min(760px, calc(100vh - 56px));
        margin: 0 auto;
        display: grid;
        grid-template-columns: 214px minmax(0, 1fr);
        overflow: hidden;
        border-radius: 34px;
        background: #ffffff;
        border: 7px solid var(--tt-green);
        box-shadow: 0 28px 70px rgba(21, 150, 90, 0.20);
      }

      .g46-ref-sidebar {
        position: relative;
        padding: 24px 18px;
        background: linear-gradient(180deg, var(--tt-green) 0%, var(--tt-green-dark) 100%);
        color: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .g46-ref-brand {
        display: grid;
        justify-items: center;
        gap: 9px;
        margin-bottom: 6px;
        color: #ffffff;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .g46-ref-brand span:first-child {
        width: 50px;
        height: 50px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--tt-yellow);
        color: var(--tt-green-dark);
        font-size: 28px;
        box-shadow: 0 12px 26px rgba(5, 77, 42, 0.26);
      }

      .g46-ref-menu {
        display: grid;
        gap: 10px;
      }

      .g46-ref-menu button,
      .g46-ref-logout {
        border: 0;
        width: 100%;
        min-height: 46px;
        padding: 0 15px;
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.90);
        background: transparent;
        text-align: left;
        font-size: 14px;
        font-weight: 1000;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease;
      }

      .g46-ref-menu button:hover,
      .g46-ref-logout:hover {
        transform: translateX(3px);
        background: rgba(255, 255, 255, 0.13);
      }

      .g46-ref-menu button.active {
        color: var(--tt-green-dark);
        background: var(--tt-yellow);
        box-shadow: 0 10px 22px rgba(5, 77, 42, 0.18);
      }

      .g46-ref-progress-mini {
        margin-top: auto;
        border-radius: 24px;
        padding: 16px 12px;
        background: rgba(255, 255, 255, 0.14);
        text-align: center;
      }

      .g46-ref-ring {
        width: 78px;
        height: 78px;
        margin: 0 auto 10px;
        border-radius: 999px;
        display: grid;
        place-items: center;
      }

      .g46-ref-ring span {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: var(--tt-green-dark);
        color: #ffffff;
        font-size: 15px;
        font-weight: 1000;
      }

      .g46-ref-progress-mini b,
      .g46-ref-progress-mini small {
        display: block;
      }

      .g46-ref-progress-mini small {
        opacity: 0.82;
        margin-top: 4px;
        font-weight: 800;
      }

      .g46-ref-logout {
        margin-top: 0;
        background: rgba(255, 255, 255, 0.12);
        justify-content: center;
      }

      .g46-ref-main {
        min-width: 0;
        padding: 24px 26px 30px;
        background:
          radial-gradient(circle at 90% 16%, rgba(255, 245, 207, 0.54), transparent 24%),
          linear-gradient(180deg, #ffffff 0%, #fbfefc 100%);
        overflow: auto;
      }

      .g46-ref-topbar {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .g46-ref-student-pill {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .g46-ref-avatar-small {
        width: 52px;
        height: 52px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--tt-yellow);
        font-size: 30px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.28);
      }

      .g46-ref-student-pill b {
        display: block;
        color: var(--tt-ink);
        font-size: 20px;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .g46-ref-student-pill small {
        display: block;
        color: var(--tt-muted);
        font-weight: 850;
      }

      .g46-ref-top-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }

      .g46-ref-pill,
      .g46-ref-soft-btn {
        border: 0;
        min-height: 54px;
        padding: 0 22px;
        border-radius: 999px;
        background: var(--tt-green-soft);
        color: var(--tt-green-dark);
        font-size: 16px;
        font-weight: 1000;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .g46-ref-soft-btn {
        cursor: pointer;
        background: #ffffff;
        border: 2px solid rgba(21, 150, 90, 0.18);
      }

      .g46-ref-title-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 18px;
        margin-bottom: 18px;
        padding: 24px 26px;
        border-radius: 30px;
        background:
          radial-gradient(circle at 14% 14%, rgba(255, 245, 207, 0.82), transparent 34%),
          linear-gradient(135deg, #edf8f1, #ffffff 55%, #eef8ff);
        border: 1px solid rgba(21, 150, 90, 0.10);
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.07);
      }

      .g46-ref-title-left {
        display: flex;
        gap: 16px;
        align-items: center;
        min-width: 0;
      }

      .g46-ref-title-icon {
        width: 72px;
        height: 72px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: #ffffff;
        font-size: 40px;
        box-shadow: inset 0 0 0 2px rgba(21, 150, 90, 0.10);
      }

      .g46-ref-title-card h1 {
        margin: 0;
        color: var(--tt-green);
        font-size: clamp(34px, 4vw, 54px);
        line-height: 0.98;
        letter-spacing: -0.055em;
        font-weight: 1000;
      }

      .g46-ref-title-card p {
        margin: 8px 0 0;
        color: var(--tt-muted);
        font-size: 17px;
        font-weight: 850;
        line-height: 1.45;
      }

      .g46-ref-title-side {
        min-width: 190px;
        border-radius: 24px;
        padding: 18px;
        background: #ffffff;
        border: 1px solid rgba(246, 196, 83, 0.30);
      }

      .g46-ref-level-line {
        display: grid;
        grid-template-columns: auto auto minmax(110px, 1fr);
        align-items: center;
        gap: 10px;
        color: var(--tt-ink);
        font-weight: 1000;
      }

      .g46-ref-level-line strong {
        color: var(--tt-green-dark);
        font-size: 18px;
        font-weight: 1000;
        white-space: nowrap;
      }

      .g46-ref-level-line i,
      .g46-ref-mini-track,
      .g46-ref-module-progress,
      .g46-ref-stat-track {
        display: block;
        height: 12px;
        width: 100%;
        border-radius: 999px;
        background: #e5efe9;
        overflow: hidden;
      }

      .g46-ref-level-line i span,
      .g46-ref-mini-track span,
      .g46-ref-module-progress span,
      .g46-ref-stat-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--tt-green), var(--tt-yellow-deep));
      }

      .g46-ref-content {
        display: grid;
        gap: 18px;
      }

      .g46-ref-dashboard-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
        gap: 18px;
        align-items: start;
      }

      .g46-ref-column {
        display: grid;
        gap: 18px;
      }

      .g46-ref-panel {
        border-radius: 28px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(21, 150, 90, 0.08);
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.06);
      }

      .g46-ref-panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }

      .g46-ref-panel h2,
      .g46-ref-panel h3 {
        margin: 0;
        color: var(--tt-ink);
        font-size: 25px;
        letter-spacing: -0.04em;
        font-weight: 1000;
      }

      .g46-ref-panel p,
      .g46-ref-muted {
        color: var(--tt-muted);
        font-size: 15px;
        line-height: 1.5;
        font-weight: 850;
      }

      .g46-ref-panel-link {
        border: 0;
        background: transparent;
        color: var(--tt-green);
        font-weight: 1000;
        cursor: pointer;
      }

      .g46-ref-plan-grid,
      .g46-ref-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .g46-ref-plan-card,
      .g46-ref-card {
        border: 0;
        min-height: 148px;
        padding: 18px;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        cursor: pointer;
        color: var(--tt-ink);
        background: var(--tt-sky);
        transition: transform 0.16s ease, box-shadow 0.16s ease;
        box-shadow: 0 10px 20px rgba(31, 73, 61, 0.05);
      }

      .g46-ref-plan-card:hover,
      .g46-ref-card:hover,
      .g46-ref-soft-btn:hover,
      .g46-ref-primary-btn:hover {
        transform: translateY(-2px);
      }

      .g46-ref-plan-card.green,
      .g46-ref-card.green { background: #edf8f1; }
      .g46-ref-plan-card.yellow,
      .g46-ref-card.yellow { background: #fff5cf; }
      .g46-ref-plan-card.blue,
      .g46-ref-card.blue { background: #eef8ff; }
      .g46-ref-plan-card.purple,
      .g46-ref-card.purple { background: #f5f1ff; }
      .g46-ref-plan-card.pink,
      .g46-ref-card.pink { background: #fff0f5; }

      .g46-ref-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .g46-ref-card-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.75);
        font-size: 34px;
      }

      .g46-ref-card h4 {
        margin: 12px 0 6px;
        color: var(--tt-ink);
        font-size: 22px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .g46-ref-tag {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: var(--tt-green-dark);
        font-size: 12px;
        font-weight: 1000;
      }

      .g46-ref-primary-btn {
        border: 0;
        min-height: 42px;
        padding: 0 18px;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--tt-green), var(--tt-green-dark));
        color: #ffffff;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 10px 18px rgba(21, 150, 90, 0.16);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        text-align: center;
      }

      .g46-ref-start-pill {
        width: max-content;
        min-width: 92px;
        margin-top: 8px;
      }

      .g46-ref-primary-btn.secondary {
        background: #ffffff;
        color: var(--tt-green-dark);
        border: 2px solid rgba(21, 150, 90, 0.18);
        box-shadow: none;
      }

      .g46-ref-stat-row {
        display: grid;
        gap: 12px;
      }

      .g46-ref-stat-item {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr) 46px;
        gap: 10px;
        align-items: center;
      }

      .g46-ref-stat-item span {
        color: var(--tt-muted);
        font-size: 13px;
        font-weight: 900;
      }

      .g46-ref-stat-item b {
        color: var(--tt-ink);
        font-size: 14px;
        font-weight: 1000;
        text-align: right;
      }

      .g46-ref-badge-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .g46-ref-badge {
        min-height: 94px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        text-align: center;
        background: var(--tt-green-soft);
        color: var(--tt-ink);
        font-weight: 1000;
      }

      .g46-ref-badge span {
        display: block;
        font-size: 34px;
        line-height: 1;
        margin-bottom: 4px;
      }

      .g46-ref-badge strong {
        display: block;
        color: var(--tt-ink);
        font-size: 15px;
        line-height: 1.1;
        font-weight: 1000;
      }

      .g46-ref-badge-status {
        display: block;
        margin-top: 6px;
        color: var(--tt-green-dark);
        font-size: 11px;
        line-height: 1.25;
        font-weight: 900;
      }

      .g46-ref-badge.locked {
        background: #f8fafc;
        color: #64748b;
        border: 1px dashed rgba(100, 116, 139, 0.32);
      }

      .g46-ref-badge.locked span {
        opacity: 0.82;
        filter: grayscale(0.35);
      }

      .g46-ref-badge.locked strong {
        color: #475569;
      }

      .g46-ref-badge.locked .g46-ref-badge-status {
        color: #64748b;
      }

      .g46-ref-task-row,
      .g46-ref-list-row {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 16px;
        border-radius: 22px;
        background: #fbfefc;
        border: 1px solid rgba(21, 150, 90, 0.08);
        margin-bottom: 12px;
      }

      .g46-ref-empty {
        padding: 24px;
        border-radius: 22px;
        background: #fbfefc;
        border: 1px dashed rgba(21, 150, 90, 0.20);
        color: var(--tt-muted);
        font-weight: 900;
        text-align: center;
      }

      .g46-ref-filter-row,
      .g46-ref-action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }

      .g46-ref-filter-row button,
      .g46-ref-choice {
        border: 0;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 999px;
        background: #ffffff;
        color: var(--tt-ink);
        box-shadow: inset 0 0 0 1px rgba(21, 150, 90, 0.12);
        font-weight: 1000;
        cursor: pointer;
      }

      .g46-ref-filter-row button.active,
      .g46-ref-choice.selected {
        background: var(--tt-green-soft);
        color: var(--tt-green-dark);
        box-shadow: inset 0 0 0 2px rgba(21, 150, 90, 0.20);
      }

      .g46-ref-avatar-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .g46-ref-avatar-choice {
        border: 0;
        min-height: 92px;
        border-radius: 24px;
        background: #ffffff;
        font-size: 42px;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgba(21, 150, 90, 0.12), 0 10px 20px rgba(31, 73, 61, 0.04);
      }

      .g46-ref-avatar-choice.selected {
        background: var(--tt-yellow);
        box-shadow: inset 0 0 0 3px rgba(21, 150, 90, 0.25), 0 12px 24px rgba(31, 73, 61, 0.07);
      }

      .missions-wrap.standard {
        padding: 0 !important;
      }

      .g46-ref-page .missions-bottom-nav {
        display: none !important;
      }

      @media (max-width: 980px) {
        .g46-ref-page { padding: 12px; }
        .g46-ref-frame {
          width: calc(100vw - 24px);
          min-height: calc(100vh - 24px);
          grid-template-columns: 1fr;
        }
        .g46-ref-sidebar {
          flex-direction: row;
          align-items: center;
          overflow-x: auto;
          padding: 14px;
        }
        .g46-ref-brand { display: none; }
        .g46-ref-menu {
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          display: grid;
        }
        .g46-ref-menu button { width: auto; white-space: nowrap; }
        .g46-ref-progress-mini,
        .g46-ref-logout { display: none; }
        .g46-ref-dashboard-grid,
        .g46-ref-title-card,
        .g46-ref-plan-grid,
        .g46-ref-card-grid {
          grid-template-columns: 1fr;
        }
        .g46-ref-main { padding: 18px; }
        .g46-ref-topbar { align-items: flex-start; flex-direction: column; }
        .g46-ref-title-side { min-width: 0; }
      }
    
      /* === Grade 3-6 Badges StyleBlock Final Polish === */
      .g46-badge-subsection {
        padding: 18px !important;
        border-radius: 28px !important;
        background: rgba(248, 250, 252, 0.74) !important;
        border: 1px solid rgba(21, 150, 90, 0.08) !important;
      }

      .g46-badge-subsection + .g46-badge-subsection {
        margin-top: 28px !important;
      }

      .g46-badge-subsection-head {
        margin-bottom: 18px !important;
        background: linear-gradient(135deg, #ffffff, #f0fbf5) !important;
        border: 1px solid rgba(21, 150, 90, 0.14) !important;
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06) !important;
      }

      .g46-badge-subsection-head > span {
        background: linear-gradient(135deg, #fff5cf, #ffffff) !important;
        box-shadow: 0 12px 26px rgba(246, 196, 83, 0.18) !important;
      }

      .g46-ref-badge-grid {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
        gap: 16px !important;
        align-items: stretch !important;
      }

      .g46-ref-badge {
        min-height: 168px !important;
        padding: 22px 18px !important;
        border-radius: 24px !important;
        display: grid !important;
        place-items: center !important;
        text-align: center !important;
        position: relative !important;
      }

      .g46-ref-badge > div {
        width: 100% !important;
        display: grid !important;
        justify-items: center !important;
        gap: 8px !important;
      }

      .g46-ref-badge-animated {
        background:
          radial-gradient(circle at 20% 12%, rgba(246, 196, 83, 0.22), transparent 28%),
          linear-gradient(135deg, #ffffff, #edf8f1) !important;
        border: 1px solid rgba(21, 150, 90, 0.18) !important;
        box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08) !important;
      }

      .g46-ref-badge-animated::after {
        content: 'Nakuha na';
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(21, 150, 90, 0.10);
        color: #07924a;
        font-size: 11px;
        font-weight: 1000;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .g46-ref-badge-animated span,
      .g46-ref-badge-locked span {
        width: 56px !important;
        height: 56px !important;
        display: grid !important;
        place-items: center !important;
        border-radius: 18px !important;
        background: #ffffff !important;
        font-size: 34px !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08) !important;
      }

      .g46-ref-badge-animated strong,
      .g46-ref-badge-locked strong {
        color: #14223b !important;
        font-size: 17px !important;
        font-weight: 1000 !important;
        line-height: 1.18 !important;
      }

      .g46-badge-reason {
        max-width: 250px !important;
        margin: 0 auto !important;
        color: #506176 !important;
        font-size: 13.5px !important;
        line-height: 1.32 !important;
        font-weight: 850 !important;
      }

      .g46-locked-badge-section {
        background:
          radial-gradient(circle at 10% 10%, rgba(148, 163, 184, 0.12), transparent 24%),
          rgba(248, 250, 252, 0.92) !important;
        border-color: rgba(100, 116, 139, 0.14) !important;
      }

      .g46-ref-badge-locked {
        min-height: 178px !important;
        background:
          linear-gradient(135deg, rgba(241, 245, 249, 0.98), rgba(255, 255, 255, 0.92)) !important;
        border: 2px dashed rgba(100, 116, 139, 0.36) !important;
        box-shadow: none !important;
        opacity: 0.76 !important;
        filter: grayscale(0.42) !important;
      }

      .g46-ref-badge-locked::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          -45deg,
          rgba(100, 116, 139, 0.03) 0,
          rgba(100, 116, 139, 0.03) 8px,
          transparent 8px,
          transparent 16px
        );
        pointer-events: none;
      }

      .g46-ref-badge-locked::after {
        content: '🔒 Naka-lock' !important;
        position: absolute !important;
        top: 12px !important;
        right: 12px !important;
        padding: 6px 11px !important;
        border-radius: 999px !important;
        background: rgba(15, 23, 42, 0.08) !important;
        color: #475569 !important;
        border: 1px solid rgba(100, 116, 139, 0.18) !important;
        font-size: 11px !important;
        font-weight: 1000 !important;
        letter-spacing: 0.03em !important;
        text-transform: uppercase !important;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06) !important;
      }

      .g46-ref-badge-locked:hover {
        opacity: 1 !important;
        filter: grayscale(0.08) !important;
        transform: translateY(-5px) !important;
        border-color: rgba(21, 150, 90, 0.32) !important;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.10) !important;
      }

      .g46-ref-badge-locked span {
        opacity: 0.68 !important;
        background: #f8fafc !important;
        box-shadow: inset 0 0 0 1px rgba(100, 116, 139, 0.12) !important;
      }

      .g46-ref-badge-locked .g46-badge-reason {
        padding: 8px 10px !important;
        border-radius: 14px !important;
        background: rgba(255, 255, 255, 0.72) !important;
        color: #64748b !important;
      }
      /* === End Grade 3-6 Badges StyleBlock Final Polish === */


      /* === Grade 3-6 Badges Final Clean UI === */
      .g46-badge-subsection {
        padding: 24px !important;
        border-radius: 30px !important;
        background:
          radial-gradient(circle at 8% 0%, rgba(21, 150, 90, 0.07), transparent 26%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92)) !important;
        border: 1px solid rgba(21, 150, 90, 0.10) !important;
        box-shadow: 0 18px 46px rgba(15, 23, 42, 0.06) !important;
      }

      .g46-badge-subsection + .g46-badge-subsection {
        margin-top: 30px !important;
      }

      .g46-badge-subsection-head {
        padding: 0 0 16px !important;
        margin: 0 0 20px !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(21, 150, 90, 0.12) !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      .g46-badge-subsection-head > span {
        width: 44px !important;
        height: 44px !important;
        border-radius: 16px !important;
        font-size: 24px !important;
        background: linear-gradient(135deg, #fff5cf, #ffffff) !important;
        box-shadow: 0 10px 22px rgba(246, 196, 83, 0.18) !important;
      }

      .g46-badge-subsection-head strong {
        font-size: 20px !important;
        line-height: 1.1 !important;
      }

      .g46-badge-subsection-head p {
        max-width: 720px !important;
        margin-top: 4px !important;
        font-size: 14.5px !important;
        line-height: 1.35 !important;
      }

      .g46-ref-badge-grid {
        gap: 18px !important;
      }

      .g46-ref-badge,
      .g46-ref-badge-animated,
      .g46-ref-badge-locked {
        transition:
          transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
          box-shadow 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
          border-color 240ms ease,
          opacity 240ms ease,
          filter 240ms ease,
          background 240ms ease !important;
        will-change: transform !important;
      }

      .g46-ref-badge-animated:hover {
        transform: translateY(-8px) scale(1.012) !important;
        box-shadow: 0 24px 54px rgba(15, 23, 42, 0.12) !important;
        border-color: rgba(21, 150, 90, 0.28) !important;
      }

      .g46-ref-badge-locked {
        min-height: 184px !important;
        background:
          repeating-linear-gradient(
            -45deg,
            rgba(100, 116, 139, 0.035) 0,
            rgba(100, 116, 139, 0.035) 9px,
            transparent 9px,
            transparent 18px
          ),
          linear-gradient(135deg, rgba(241, 245, 249, 0.98), rgba(255, 255, 255, 0.92)) !important;
        border: 2px dashed rgba(100, 116, 139, 0.38) !important;
        box-shadow: none !important;
        opacity: 0.68 !important;
        filter: grayscale(0.62) saturate(0.82) !important;
      }

      .g46-ref-badge-locked:hover {
        opacity: 0.98 !important;
        filter: grayscale(0.18) saturate(0.92) !important;
        transform: translateY(-7px) scale(1.01) !important;
        border-color: rgba(21, 150, 90, 0.34) !important;
        box-shadow: 0 22px 48px rgba(15, 23, 42, 0.10) !important;
      }

      .g46-ref-badge-locked::after {
        content: '🔒 Naka-lock' !important;
        background: rgba(15, 23, 42, 0.09) !important;
        color: #475569 !important;
        border: 1px solid rgba(100, 116, 139, 0.18) !important;
      }

      .g46-ref-badge-locked span {
        opacity: 0.62 !important;
        background: #f8fafc !important;
        box-shadow: inset 0 0 0 1px rgba(100, 116, 139, 0.14) !important;
      }

      .g46-ref-badge-locked strong {
        color: #475569 !important;
      }

      .g46-ref-badge-locked .g46-badge-reason {
        width: fit-content !important;
        max-width: 230px !important;
        padding: 9px 11px !important;
        border-radius: 15px !important;
        background: rgba(255, 255, 255, 0.78) !important;
        color: #64748b !important;
      }

      .g46-locked-goal-text span {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-right: 6px !important;
        padding: 2px 7px !important;
        border-radius: 999px !important;
        background: rgba(100, 116, 139, 0.11) !important;
        color: #475569 !important;
        font-size: 10px !important;
        font-weight: 1000 !important;
        letter-spacing: 0.04em !important;
        text-transform: uppercase !important;
      }
      /* === End Grade 3-6 Badges Final Clean UI === */


      .vault-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .vault-card {
        width: min(520px, 92vw);
        background: #ffffff;
        border-radius: 28px;
        padding: 24px;
      }

      .vault-row {
        padding: 14px 0;
        border-bottom: 1px solid #E2E8F0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .vault-row strong {
        color: #0F172A;
        font-size: 14px;
        font-weight: 800;
      }

      .vault-row span {
        color: #334155;
        font-size: 16px;
      }

      .vault-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }

      .vault-pin {
        margin-top: 10px;
        padding: 14px;
        border-radius: 16px;
        background: #EFF6FF;
        border: 1px solid #BFDBFE;
        color: #1D4ED8;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 0.25em;
        text-align: center;
      }

      .vault-note {
        margin-top: 14px;
        color: #475569;
        font-size: 14px;
      }

`}</style>
  );
}

export function EarlyStudentSubpageStyles() {
  return (
    <style>{`
      .g12-page {
        min-height: 100vh;
        padding-bottom: 116px;
        background:
          radial-gradient(circle at 3% 22%, rgba(147, 197, 253, 0.10), transparent 24%),
          radial-gradient(circle at 95% 74%, rgba(253, 230, 138, 0.15), transparent 22%),
          linear-gradient(180deg, #fffdf7 0%, #f7fbff 48%, #fff8ef 100%);
        color: #24324a;
      }

      .g12-topbar {
        position: sticky;
        top: 0;
        z-index: 60;
        min-height: 88px;
        padding: 16px 28px;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(30, 160, 92, 0.08);
        box-shadow: 0 8px 20px rgba(32, 90, 54, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .g12-brand {
        border: 0;
        background: transparent;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #15965a;
        font-size: 29px;
        font-weight: 950;
        letter-spacing: -0.045em;
        white-space: nowrap;
        cursor: pointer;
      }

      .g12-brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: #fff6dc;
        box-shadow: inset 0 0 0 2px rgba(238, 202, 95, 0.22);
        font-size: 28px;
      }

      .g12-top-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        flex-wrap: wrap;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 52px;
        border-radius: 20px;
        padding: 0 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        font-size: 17px;
        font-weight: 950;
      }

      .g12-pill {
        background: #fff5cf;
        border: 1px solid #f7dfa0;
        color: #22324a;
      }

      .g12-action-btn {
        border: 2px solid #2fbf73;
        background: #ffffff;
        color: #14975a;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(47, 191, 115, 0.08);
      }

      .g12-shell {
        padding: 22px 24px 132px;
      }

      .g12-subpage-shell {
        max-width: 1380px;
        margin: 0 auto;
      }

      .g12-subpage-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 20px;
        align-items: center;
        margin-bottom: 22px;
        padding: 28px 32px;
        border-radius: 34px;
        background:
          radial-gradient(circle at 8% 18%, rgba(255, 239, 187, 0.65), transparent 28%),
          radial-gradient(circle at 90% 20%, rgba(224, 242, 254, 0.70), transparent 34%),
          linear-gradient(115deg, #fff4d7 0%, #fff8f2 48%, #eef8ff 100%);
        border: 1px solid rgba(46, 184, 127, 0.12);
        box-shadow: 0 18px 36px rgba(31, 73, 61, 0.08);
      }

      .g12-subpage-title {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .g12-subpage-icon {
        width: 76px;
        height: 76px;
        border-radius: 26px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.72);
        font-size: 42px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
      }

      .g12-subpage-title h1 {
        margin: 0;
        color: #16a362;
        font-size: clamp(38px, 4vw, 58px);
        line-height: 0.95;
        font-weight: 1000;
        letter-spacing: -0.055em;
      }

      .g12-subpage-title p {
        margin: 10px 0 0;
        color: #425a7c;
        font-size: 18px;
        font-weight: 850;
      }

      .g12-mini-progress {
        min-width: 300px;
        padding: 20px 22px;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.86);
        border: 2px solid rgba(255, 217, 102, 0.28);
        box-shadow: 0 14px 28px rgba(58, 82, 84, 0.06);
      }

      .g12-mini-progress strong {
        display: block;
        color: #14223b;
        font-size: 28px;
        font-weight: 1000;
        letter-spacing: -0.04em;
        margin-bottom: 12px;
      }

      .g12-progress-track,
      .g12-module-progress {
        width: 100%;
        border-radius: 999px;
        background: #eef7f1;
        overflow: hidden;
        border: 1px solid #d8efe0;
      }

      .g12-progress-track {
        height: 14px;
      }

      .g12-module-progress {
        height: 12px;
        background: rgba(255, 255, 255, 0.75);
      }

      .g12-progress-fill,
      .g12-module-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #9be8ba);
      }

      .g12-section-card {
        margin-top: 22px;
        padding: 30px;
        border-radius: 32px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(31, 154, 92, 0.06);
        box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
      }

      .g12-section-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }

      .g12-section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #15965a;
        font-size: 31px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-section-subtitle {
        margin: 6px 0 0;
        color: #425a7c;
        font-size: 16px;
        font-weight: 850;
      }

      .g12-filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }

      .g12-chip {
        border: 0;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 18px;
        background: #ffffff;
        color: #203451;
        font-size: 15px;
        font-weight: 950;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgba(31, 154, 92, 0.10);
      }

      .g12-chip.active {
        background: #edf8f1;
        color: #15965a;
        box-shadow: inset 0 0 0 2px rgba(39, 174, 96, 0.18);
      }

      .g12-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .g12-tile {
        border: 0;
        min-height: 168px;
        padding: 20px 22px;
        border-radius: 28px;
        background: #ffffff;
        color: #22324a;
        text-align: left;
        display: grid;
        grid-template-columns: 96px minmax(0, 1fr) 50px;
        gap: 18px;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 12px 22px rgba(47, 78, 84, 0.05);
        border: 1px solid rgba(48, 120, 100, 0.08);
        transition: 0.16s ease;
      }

      .g12-tile:hover,
      .g12-action-btn:hover,
      .g12-chip:hover {
        transform: translateY(-2px);
      }

      .g12-tile.green { background: #edf9f0; }
      .g12-tile.blue { background: #eef7ff; }
      .g12-tile.purple { background: #f6f0ff; }
      .g12-tile.yellow { background: #fff7dd; }
      .g12-tile.pink { background: #fff0f5; }

      .g12-tile-icon {
        width: 86px;
        height: 86px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        font-size: 42px;
        background: rgba(255, 255, 255, 0.70);
      }

      .g12-tile h3 {
        margin: 0 0 8px;
        color: #22324a;
        font-size: 27px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-tile p,
      .g12-muted {
        margin: 0;
        color: #526988;
        font-size: 15px;
        line-height: 1.45;
        font-weight: 850;
      }

      .g12-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        width: max-content;
        min-height: 34px;
        padding: 0 12px;
        margin-top: 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        color: #15965a;
        font-size: 13px;
        font-weight: 950;
      }

      .g12-arrow {
        width: 50px;
        height: 50px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.82);
        color: #15965a;
        font-size: 28px;
        font-weight: 1000;
      }

      .g12-empty {
        padding: 28px;
        border-radius: 26px;
        background: #ffffff;
        border: 1px dashed rgba(31, 154, 92, 0.18);
        color: #526988;
        font-weight: 900;
        text-align: center;
      }

      .g12-group-card,
      .g12-profile-card,
      .g12-badge-card,
      .g12-lesson-panel {
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(31, 154, 92, 0.07);
        box-shadow: 0 14px 26px rgba(47, 78, 84, 0.05);
        padding: 22px;
      }

      .g12-group-card h3,
      .g12-profile-card h3,
      .g12-badge-card h3,
      .g12-lesson-panel h3 {
        margin: 0 0 8px;
        color: #22324a;
        font-size: 25px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-task-card {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 16px;
        border-radius: 22px;
        background: #f8fcff;
        border: 1px solid #e2f0ff;
      }

      .g12-task-icon {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        font-size: 28px;
        background: #fff5cf;
      }

      .g12-main-btn {
        min-height: 50px;
        border: 0;
        padding: 0 20px;
        border-radius: 18px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(32, 156, 96, 0.16);
      }

      .g12-outline-btn {
        min-height: 50px;
        border: 2px solid #2fbf73;
        padding: 0 20px;
        border-radius: 18px;
        background: #ffffff;
        color: #14975a;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
      }

      .g12-badge-grid,
      .g12-avatar-grid,
      .g12-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .g12-badge-card {
        min-height: 150px;
        display: grid;
        place-items: center;
        text-align: center;
      }

      .g12-badge-big {
        font-size: 54px;
        line-height: 1;
        filter: drop-shadow(0 10px 12px rgba(122, 66, 195, 0.14));
      }

      .g12-badge-card strong {
        display: block;
        margin-top: 10px;
        color: #6f42c1;
        font-size: 17px;
        font-weight: 1000;
      }

      .g12-avatar-choice {
        min-height: 112px;
        border: 0;
        border-radius: 28px;
        background: #ffffff;
        font-size: 46px;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgba(31, 154, 92, 0.10), 0 12px 22px rgba(47, 78, 84, 0.04);
      }

      .g12-avatar-choice.selected {
        background: #edf8f1;
        box-shadow: inset 0 0 0 3px rgba(39, 174, 96, 0.26), 0 14px 26px rgba(47, 78, 84, 0.06);
      }

      .g12-summary-box {
        padding: 20px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid rgba(31, 154, 92, 0.08);
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .g12-summary-box span {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        background: #fff5cf;
        display: grid;
        place-items: center;
        font-size: 28px;
      }

      .g12-summary-box b {
        display: block;
        color: #14223b;
        font-size: 24px;
        font-weight: 1000;
      }

      .g12-summary-box small {
        display: block;
        color: #526988;
        font-weight: 850;
      }

      .g12-lesson-layout {
        display: grid;
        gap: 18px;
      }

      .g12-reading-box {
        padding: 22px;
        border-radius: 24px;
        background: #f8fcff;
        border: 1px solid #e1eefe;
        color: #26354d;
        font-size: 22px;
        line-height: 1.85;
        font-weight: 750;
      }

      .g12-nav {
        position: fixed;
        left: 50%;
        bottom: 22px;
        transform: translateX(-50%);
        width: min(1120px, calc(100vw - 40px));
        z-index: 80;
        min-height: 82px;
        padding: 10px 20px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(39, 174, 96, 0.08);
        box-shadow: 0 14px 30px rgba(25, 78, 54, 0.09);
        backdrop-filter: blur(16px);
      }

      .g12-nav button {
        border: 0;
        background: transparent;
        border-radius: 24px;
        color: #203451;
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .g12-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .g12-nav-icon {
        font-size: 34px;
        line-height: 1;
      }

      /* Grade 1-2 shared Kid Curious UI for Lessons, Mga Misyon, Groups, Badges, and Profile. */
      .g12-page {
        background:
          radial-gradient(circle at 14% 18%, rgba(255, 245, 207, 0.95), transparent 24%),
          radial-gradient(circle at 86% 72%, rgba(237, 248, 241, 0.95), transparent 26%),
          linear-gradient(135deg, #e8fff1 0%, #fffdf7 46%, #fff5cf 100%);
      }

      .g12-topbar {
        width: min(1280px, calc(100vw - 32px));
        margin: 14px auto 0;
        border-radius: 34px;
        border: 3px solid rgba(21, 150, 90, 0.12);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.08), 0 22px 42px rgba(21, 150, 90, 0.10);
      }

      .g12-shell,
      .g12-subpage-shell {
        width: min(1280px, calc(100vw - 32px));
        max-width: none;
        margin: 0 auto;
      }

      .g12-brand {
        font-size: 34px;
      }

      .g12-brand-icon {
        width: 64px;
        height: 64px;
        border-radius: 24px;
        font-size: 38px;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 60px;
        border-radius: 24px;
        font-size: 19px;
      }

      .g12-subpage-hero {
        border-radius: 44px;
        padding: 38px 42px;
        border: 4px solid rgba(21, 150, 90, 0.13);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.08), 0 26px 48px rgba(21, 150, 90, 0.12);
        background:
          radial-gradient(circle at 12% 20%, rgba(255, 245, 207, 0.92), transparent 28%),
          radial-gradient(circle at 86% 26%, rgba(255, 255, 255, 0.80), transparent 18%),
          linear-gradient(135deg, #28c98a 0%, #15965a 42%, #edf8f1 43%, #fffdf7 100%);
      }

      .g12-subpage-icon {
        width: 100px;
        height: 100px;
        border-radius: 34px;
        background: #fff5cf;
        font-size: 58px;
        box-shadow: 0 8px 0 #f6c453, inset 0 0 0 3px rgba(255,255,255,0.72);
      }

      .g12-subpage-title h1 {
        color: #14223b;
        font-size: clamp(54px, 5.6vw, 82px);
        line-height: 0.94;
        text-shadow: none;
      }

      .g12-subpage-title p {
        color: #334155;
        font-size: 24px;
        line-height: 1.35;
        text-shadow: none;
      }

      .g12-subpage-title > div {
        padding: 18px 22px;
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.74);
        border: 3px solid rgba(255, 245, 207, 0.72);
        box-shadow: 0 12px 26px rgba(20, 34, 59, 0.09);
        backdrop-filter: blur(8px);
      }

      .g12-mini-progress {
        min-width: 360px;
        padding: 26px;
        border-radius: 34px;
        border: 4px solid rgba(255, 245, 207, 0.78);
        box-shadow: 0 9px 0 rgba(246, 196, 83, 0.55), 0 20px 34px rgba(20, 34, 59, 0.12);
      }

      .g12-mini-progress strong {
        font-size: 36px;
      }

      .g12-progress-track,
      .g12-module-progress {
        height: 20px;
        border: 3px solid #d8efe0;
      }

      .g12-section-card,
      .g12-group-card,
      .g12-profile-card,
      .g12-badge-card,
      .g12-lesson-panel {
        border-radius: 42px;
        padding: 36px;
        border: 4px solid rgba(21, 150, 90, 0.11);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.07), 0 26px 46px rgba(21, 150, 90, 0.10);
      }

      .g12-section-title {
        font-size: clamp(38px, 4vw, 58px);
      }

      .g12-section-subtitle,
      .g12-muted,
      .g12-tile p {
        font-size: 21px;
      }

      .g12-card-grid {
        gap: 24px;
      }

      .g12-tile {
        min-height: 232px;
        grid-template-columns: 124px minmax(0, 1fr) 68px;
        gap: 24px;
        padding: 28px;
        border-radius: 38px;
        border: 4px solid rgba(255, 255, 255, 0.76);
        box-shadow: 0 10px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(21, 150, 90, 0.10);
      }

      .g12-tile-icon {
        width: 108px;
        height: 108px;
        border-radius: 34px;
        font-size: 62px;
      }

      .g12-tile h3 {
        font-size: 38px;
      }

      .g12-status-pill {
        min-height: 46px;
        padding: 0 18px;
        font-size: 17px;
      }

      .g12-arrow {
        width: 66px;
        height: 66px;
        font-size: 38px;
      }

      .g12-main-btn,
      .g12-outline-btn {
        min-height: 68px;
        border-radius: 26px;
        padding: 0 28px;
        font-size: 22px;
      }

      .g12-main-btn {
        background: linear-gradient(180deg, #ffe46c, #ffc928);
        color: #14223b;
        text-shadow: none;
        box-shadow: 0 8px 0 #e7a90f, 0 18px 28px rgba(245, 158, 11, 0.20);
      }

      .g12-outline-btn {
        border: 3px solid rgba(21, 150, 90, 0.24);
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.12), 0 16px 26px rgba(21, 150, 90, 0.08);
      }

      .g12-task-card {
        grid-template-columns: 84px minmax(0, 1fr) auto;
        padding: 24px;
        border-radius: 32px;
      }

      .g12-task-icon {
        width: 74px;
        height: 74px;
        border-radius: 26px;
        font-size: 42px;
      }

      .g12-badge-grid,
      .g12-avatar-grid,
      .g12-summary-grid {
        gap: 24px;
      }

      .g12-badge-card {
        min-height: 210px;
      }

      .g12-badge-big {
        font-size: 82px;
      }

      .g12-badge-card strong {
        font-size: 24px;
      }

      .g12-avatar-choice {
        min-height: 150px;
        border-radius: 38px;
        font-size: 74px;
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.10), inset 0 0 0 2px rgba(21, 150, 90, 0.12);
      }

      .g12-summary-box {
        min-height: 132px;
        border-radius: 34px;
        padding: 26px;
      }

      .g12-summary-box span {
        width: 76px;
        height: 76px;
        border-radius: 26px;
        font-size: 42px;
      }

      .g12-summary-box b {
        font-size: 32px;
      }

      .g12-summary-box small {
        font-size: 18px;
      }

      .g12-reading-box {
        border-radius: 34px;
        padding: 30px;
        font-size: 30px;
      }

      .g12-nav {
        min-height: 96px;
        border-radius: 42px;
        border: 4px solid rgba(21, 150, 90, 0.10);
        box-shadow: 0 12px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(20, 34, 59, 0.12);
      }

      .g12-nav button {
        border-radius: 32px;
        font-size: 19px;
      }

      .g12-nav button.active {
        background: #fff5cf;
        color: #0f7d49;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.28);
      }

      .g12-nav-icon {
        font-size: 40px;
      }

      .g12-page .missions-wrap.early > .missions-hero {
        display: none;
      }

      .g12-page .missions-wrap.early .missions-game-card {
        min-height: 300px;
        border-radius: 38px;
        padding: 26px;
        border: 4px solid rgba(255,255,255,0.76);
        box-shadow: 0 10px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(21, 150, 90, 0.10);
      }

      .g12-page .missions-wrap.early .missions-game-icon {
        width: 92px;
        height: 92px;
        border-radius: 30px;
        font-size: 54px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4 {
        font-size: 36px;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .g12-page .missions-wrap.early .missions-section-head p,
      .g12-page .missions-wrap.early .missions-stat-card span {
        font-size: 20px;
      }

      .g12-page .missions-wrap.early .missions-play-btn {
        min-height: 66px;
        border-radius: 26px;
        background: linear-gradient(180deg, #ffe46c, #ffc928);
        box-shadow: 0 8px 0 #e7a90f, 0 18px 28px rgba(245, 158, 11, 0.20);
        font-size: 22px;
      }


      /* Grade 1-2 balanced subpage font sizing. */
      .g12-brand {
        font-size: 28px;
      }

      .g12-brand-icon {
        width: 54px;
        height: 54px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 50px;
        border-radius: 20px;
        font-size: 16px;
        padding: 0 16px;
      }

      .g12-subpage-hero {
        padding: 28px 32px;
        border-radius: 36px;
      }

      .g12-subpage-icon {
        width: 78px;
        height: 78px;
        border-radius: 26px;
        font-size: 42px;
      }

      .g12-subpage-title h1 {
        font-size: clamp(34px, 4vw, 50px);
        line-height: 1;
      }

      .g12-subpage-title p {
        font-size: 17px;
        line-height: 1.45;
      }

      .g12-subpage-title > div {
        padding: 14px 18px;
        border-radius: 24px;
      }

      .g12-mini-progress {
        min-width: 300px;
        padding: 22px;
        border-radius: 28px;
      }

      .g12-mini-progress strong {
        font-size: 24px;
      }

      .g12-progress-track,
      .g12-module-progress {
        height: 14px;
        border-width: 2px;
      }

      .g12-section-card,
      .g12-group-card,
      .g12-profile-card,
      .g12-badge-card,
      .g12-lesson-panel {
        padding: 28px;
        border-radius: 34px;
      }

      .g12-section-title {
        font-size: clamp(28px, 3vw, 38px);
      }

      .g12-section-subtitle,
      .g12-muted,
      .g12-tile p {
        font-size: 16px;
      }

      .g12-card-grid {
        gap: 20px;
      }

      .g12-tile {
        min-height: 180px;
        grid-template-columns: 96px minmax(0, 1fr) 52px;
        gap: 18px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-tile-icon {
        width: 84px;
        height: 84px;
        border-radius: 26px;
        font-size: 46px;
      }

      .g12-tile h3 {
        font-size: 28px;
        line-height: 1.08;
      }

      .g12-status-pill {
        min-height: 38px;
        padding: 0 14px;
        font-size: 14px;
      }

      .g12-arrow {
        width: 52px;
        height: 52px;
        font-size: 30px;
      }

      .g12-main-btn,
      .g12-outline-btn {
        min-height: 54px;
        border-radius: 20px;
        padding: 0 22px;
        font-size: 17px;
      }

      .g12-task-card {
        grid-template-columns: 66px minmax(0, 1fr) auto;
        padding: 18px;
        border-radius: 26px;
      }

      .g12-task-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-badge-grid,
      .g12-avatar-grid,
      .g12-summary-grid {
        gap: 18px;
      }

      .g12-badge-card {
        min-height: 160px;
      }

      .g12-badge-big {
        font-size: 58px;
      }

      .g12-badge-card strong {
        font-size: 18px;
      }

      .g12-avatar-choice {
        min-height: 112px;
        border-radius: 30px;
        font-size: 52px;
      }

      .g12-summary-box {
        min-height: 104px;
        border-radius: 28px;
        padding: 22px;
      }

      .g12-summary-box span {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-summary-box b {
        font-size: 24px;
      }

      .g12-summary-box small {
        font-size: 15px;
      }

      .g12-reading-box {
        padding: 24px;
        border-radius: 28px;
        font-size: 22px;
        line-height: 1.65;
      }

      .g12-nav {
        min-height: 78px;
        border-radius: 34px;
      }

      .g12-nav button {
        border-radius: 26px;
        font-size: 15px;
      }

      .g12-nav-icon {
        font-size: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-card {
        min-height: 230px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-icon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        font-size: 40px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4 {
        font-size: 28px;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .g12-page .missions-wrap.early .missions-section-head p,
      .g12-page .missions-wrap.early .missions-stat-card span {
        font-size: 16px;
      }

      .g12-page .missions-wrap.early .missions-play-btn {
        min-height: 54px;
        border-radius: 20px;
        font-size: 17px;
      }

      @media (max-width: 1000px) {
        .g12-subpage-hero,
        .g12-card-grid,
        .g12-badge-grid,
        .g12-avatar-grid,
        .g12-summary-grid {
          grid-template-columns: 1fr;
        }

        .g12-mini-progress {
          min-width: 0;
        }

        .g12-tile {
          grid-template-columns: 86px minmax(0, 1fr) 42px;
        }
      }

      @media (max-width: 760px) {
        .g12-topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 16px;
        }

        .g12-top-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .g12-pill,
        .g12-action-btn {
          min-height: 48px;
          font-size: 14px;
          padding: 0 14px;
        }

        .g12-shell {
          padding: 14px 14px 120px;
        }

        .g12-subpage-hero {
          padding: 22px;
          border-radius: 28px;
        }

        .g12-subpage-title {
          align-items: flex-start;
          flex-direction: column;
        }

        .g12-subpage-title h1 {
          font-size: 40px;
        }

        .g12-section-card {
          padding: 20px;
        }

        .g12-tile {
          grid-template-columns: 76px minmax(0, 1fr);
        }

        .g12-arrow {
          display: none;
        }

        .g12-task-card {
          grid-template-columns: 1fr;
        }

        .g12-nav {
          width: calc(100vw - 18px);
          bottom: 10px;
          border-radius: 24px;
          padding: 8px;
          gap: 4px;
        }

        .g12-nav button {
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
        }

        .g12-nav-icon {
          font-size: 26px;
        }
      }
    `}</style>
  );
}

export function TeacherRedesignStyles() {
  return (
    <style>{`
      .teacher-redesign-page {
        min-height: 100vh;
        background:
          radial-gradient(circle at 4% 100%, rgba(46, 204, 113, 0.08), transparent 24%),
          radial-gradient(circle at 96% 100%, rgba(46, 204, 113, 0.08), transparent 24%),
          linear-gradient(180deg, #fbfefc 0%, #f5faf7 100%);
        color: #17243b;
        font-family: inherit;
      }

      .teacher-main-header {
        height: 88px;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(18px);
        border-bottom: 1px solid #e8efe9;
        box-shadow: 0 10px 28px rgba(26, 75, 43, 0.055);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 36px;
        position: sticky;
        top: 0;
        z-index: 40;
      }

      .teacher-brand-area {
        display: flex;
        align-items: center;
        gap: 30px;
        min-width: 0;
      }

      .teacher-brand-mark {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-right: 28px;
        border-right: 1px solid #dfe8e2;
      }

      .teacher-brand-icon {
        width: 50px;
        height: 50px;
        border-radius: 17px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #f4ffe3, #dff9e8);
        box-shadow: inset 0 0 0 1px rgba(39, 174, 96, 0.16);
        font-size: 26px;
      }

      .teacher-brand-text strong {
        display: block;
        color: #12a05a;
        font-size: 24px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 950;
      }

      .teacher-brand-text small {
        display: block;
        color: #738277;
        font-size: 11px;
        margin-top: 5px;
        font-weight: 800;
      }

      .teacher-nav-links {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .teacher-nav-links button {
        border: 0;
        background: transparent;
        color: #26354d;
        padding: 12px 16px;
        border-radius: 14px;
        font-weight: 850;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: 0.18s ease;
      }

      .teacher-nav-links button:hover,
      .teacher-nav-links button.active {
        background: #eaf8ef;
        color: #07884b;
      }

      .teacher-header-actions {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .teacher-profile-pill {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 176px;
        padding: 10px 14px;
        background: #ffffff;
        border: 1px solid #dbeae1;
        border-radius: 18px;
        box-shadow: 0 8px 20px rgba(32, 93, 52, 0.06);
      }

      .teacher-profile-avatar {
        width: 44px;
        height: 44px;
        border-radius: 15px;
        display: grid;
        place-items: center;
        background: #fff7c9;
        font-size: 24px;
      }

      .teacher-profile-text {
        flex: 1;
        min-width: 0;
      }

      .teacher-profile-text strong {
        display: block;
        color: #193421;
        font-size: 15px;
        line-height: 1;
      }

      .teacher-profile-text small {
        display: block;
        color: #6d7d73;
        font-size: 12px;
        margin-top: 5px;
      }

      .teacher-logout-btn {
        height: 52px;
        border-radius: 16px;
        padding: 0 24px;
        border: 2px solid #0a9b53;
        background: #ffffff;
        color: #07884b;
        font-weight: 950;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .teacher-logout-btn:hover {
        background: #eaf8ef;
        transform: translateY(-1px);
      }

      .teacher-main-content {
        max-width: 1370px;
        margin: 0 auto;
        padding: 34px 28px 28px;
      }

      .lms-page-title {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-end;
        margin-bottom: 22px;
        position: relative;
      }

      .lms-title-copy h1 {
        margin: 0;
        color: #182237;
        font-size: 40px;
        letter-spacing: -0.045em;
        font-weight: 950;
      }

      .lms-title-copy p {
        margin: 8px 0 0;
        color: #667668;
        font-size: 16px;
        line-height: 1.6;
        max-width: 660px;
      }

      .lms-teacher-illustration {
        min-width: 270px;
        height: 130px;
        border-radius: 28px;
        background:
          radial-gradient(circle at 72% 10%, #fff2ba 0 28%, transparent 29%),
          linear-gradient(135deg, #fffdfa, #edf9f0);
        border: 1px solid #e5eee8;
        position: relative;
        overflow: hidden;
      }

      .lms-teacher-illustration::before {
        content: '👩‍🏫';
        position: absolute;
        right: 92px;
        top: 22px;
        font-size: 66px;
      }

      .lms-teacher-illustration::after {
        content: '🌿 📚';
        position: absolute;
        right: 20px;
        bottom: 18px;
        font-size: 34px;
      }

      .lms-overview-panel {
        background: #ffffff;
        border: 1px solid #e4eee8;
        border-radius: 28px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.06);
        margin-bottom: 24px;
      }

      .lms-greeting-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
        margin-bottom: 18px;
      }

      .lms-greeting-row h2 {
        margin: 0;
        color: #17243b;
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.03em;
      }

      .lms-greeting-row p {
        margin: 6px 0 0;
        color: #65766b;
      }

      .lms-view-button,
      .lms-view-lessons-btn {
        border: 1.8px solid #0a9b53;
        color: #07884b;
        background: #ffffff;
        border-radius: 14px;
        padding: 12px 18px;
        font-weight: 950;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: 0.18s ease;
      }

      .lms-view-button:hover,
      .lms-view-lessons-btn:hover {
        background: #eaf8ef;
        transform: translateY(-1px);
      }

      .lms-metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .lms-metric-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 22px;
        border: 1px solid #e5eee8;
        background: #fff;
        min-height: 110px;
      }

      .lms-metric-card.green { background: linear-gradient(135deg, #f1fbf4, #ffffff); }
      .lms-metric-card.yellow { background: linear-gradient(135deg, #fff8df, #ffffff); }
      .lms-metric-card.blue { background: linear-gradient(135deg, #edf6ff, #ffffff); }
      .lms-metric-card.purple { background: linear-gradient(135deg, #f6efff, #ffffff); }

      .lms-metric-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        display: grid;
        place-items: center;
        font-size: 28px;
      }

      .lms-metric-card.green .lms-metric-icon { background: #dff7e8; }
      .lms-metric-card.yellow .lms-metric-icon { background: #fff0bd; }
      .lms-metric-card.blue .lms-metric-icon { background: #dff0ff; }
      .lms-metric-card.purple .lms-metric-icon { background: #efe3ff; }

      .lms-metric-card span {
        display: block;
        font-weight: 850;
        color: #253044;
        margin-bottom: 4px;
      }

      .lms-metric-card strong {
        display: block;
        color: #17243b;
        font-size: 30px;
        font-weight: 950;
        line-height: 1;
      }

      .lms-metric-card small {
        display: block;
        color: #728177;
        font-weight: 700;
        margin-top: 7px;
      }

      .lms-tip-strip {
        margin-top: 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 20px;
        background: linear-gradient(135deg, #eefaf2, #f9fffb);
        border: 1px solid #dcefe2;
      }

      .lms-tip-icon {
        width: 50px;
        height: 50px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: #2fb86f;
        color: white;
        font-size: 24px;
      }

      .lms-tip-strip strong {
        display: block;
        color: #1f5632;
        margin-bottom: 3px;
      }

      .lms-tip-strip p {
        margin: 0;
        color: #627569;
      }

      .teacher-builder-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(330px, 0.7fr);
        gap: 24px;
        align-items: start;
      }

      .teacher-builder-main,
      .teacher-builder-side {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .teacher-design-card,
      .teacher-side-card {
        background: #ffffff;
        border: 1px solid #e4eee8;
        border-radius: 26px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.055);
      }

      .teacher-design-card.soft {
        background: linear-gradient(180deg, #ffffff 0%, #fcfffd 100%);
      }

      .teacher-design-heading {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 18px;
      }

      .teacher-design-step {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #149a57;
        color: white;
        font-weight: 950;
        box-shadow: 0 8px 18px rgba(20, 154, 87, 0.2);
        flex: 0 0 auto;
      }

      .teacher-design-heading h2 {
        margin: 0;
        color: #0c6a3b;
        font-size: 21px;
        font-weight: 950;
        letter-spacing: -0.02em;
      }

      .teacher-design-heading p {
        margin: 4px 0 0;
        color: #6c7b72;
        font-size: 13px;
      }

      .teacher-form-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .teacher-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .teacher-field label {
        color: #17243b;
        font-weight: 900;
        font-size: 13px;
      }

      .teacher-field .input-field,
      .teacher-design-card .input-field {
        border: 1.5px solid #d8e6dc;
        border-radius: 13px;
        background: #ffffff;
        min-height: 48px;
        padding: 13px 15px;
        font-weight: 700;
        color: #213047;
      }

      .teacher-field textarea.input-field {
        font-weight: 600;
        line-height: 1.6;
        min-height: 110px;
      }

      .lms-editor-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1.5px solid #d8e6dc;
        border-bottom: 0;
        border-radius: 14px 14px 0 0;
        background: #fbfefd;
      }

      .lms-editor-toolbar button {
        width: 30px;
        height: 30px;
        border: 0;
        background: transparent;
        border-radius: 9px;
        cursor: default;
        font-weight: 900;
        color: #213047;
      }

      .lms-editor-area {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      }

      .lms-activity-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .teacher-activity-block {
        border-radius: 16px;
        border: 1px solid #e4eee8;
        background: #ffffff;
        overflow: hidden;
      }

      .teacher-activity-top {
        display: grid;
        grid-template-columns: 46px minmax(160px, 1fr) minmax(220px, 1.6fr) auto;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: linear-gradient(90deg, rgba(20,154,87,0.08), #ffffff);
      }

      .teacher-activity-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 950;
      }

      .teacher-activity-copy strong {
        display: block;
        color: #1d2d44;
        font-weight: 950;
      }

      .teacher-activity-copy small {
        color: #6d7b73;
        font-weight: 700;
      }

      .teacher-activity-mini-preview {
        font-size: 12px;
        color: #6d7b73;
        background: rgba(255,255,255,0.68);
        border: 1px solid rgba(216,230,220,0.8);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .teacher-activity-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .teacher-activity-action {
        border: 1px solid #d8e6dc;
        background: #ffffff;
        color: #1d2d44;
        padding: 8px 10px;
        border-radius: 10px;
        font-weight: 850;
        cursor: pointer;
      }

      .teacher-activity-action:hover {
        background: #f2faf5;
      }

      .teacher-activity-action.danger {
        color: #e74c3c;
      }

      .teacher-activity-body {
        padding: 12px;
        background: #ffffff;
        border-top: 1px solid #edf3ef;
      }


      .teacher-activity-row {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: start;
        padding: 12px;
        border: 1px solid #e4eee8;
        border-radius: 16px;
        background: linear-gradient(90deg, rgba(20,154,87,0.06), #ffffff);
      }

      .teacher-activity-row-icon {
        width: 40px;
        height: 40px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        color: #ffffff;
        font-weight: 950;
        box-shadow: 0 8px 18px rgba(0,0,0,0.08);
      }

      .teacher-activity-row-main {
        min-width: 0;
      }

      .teacher-activity-row-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
      }

      .teacher-activity-row-head strong {
        color: #17243b;
        font-weight: 950;
      }

      .teacher-activity-row-head small {
        color: #6d7b73;
        font-weight: 750;
      }

      .teacher-activity-row-fields {
        display: grid;
        gap: 10px;
      }

      .teacher-activity-row-fields.grid2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .teacher-inline-mcq,
      .teacher-inline-pairs,
      .teacher-inline-words {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .lms-side-activity .choice-infographic { background: #27ae60; }
      .lms-side-activity .choice-vocabulary { background: #f4b942; }
      .lms-side-activity .choice-matching { background: #3498db; }
      .lms-side-activity .choice-mcq { background: #8e44ad; }
      .lms-side-activity .choice-speech { background: #ec407a; }
      .lms-side-activity .choice-writing { background: #16a9b7; }

      .teacher-add-mini,
      .lms-add-block-btn {
        border: 1.5px dashed #b9dfc8;
        background: #f7fdf9;
        color: #0b8e4e;
        border-radius: 14px;
        padding: 14px 16px;
        font-weight: 950;
        cursor: pointer;
        width: 100%;
        transition: 0.18s ease;
      }

      .teacher-add-mini:hover,
      .lms-add-block-btn:hover {
        background: #eaf8ef;
      }

      .lms-empty-activity {
        padding: 22px;
        border: 1.5px dashed #b9dfc8;
        border-radius: 18px;
        text-align: center;
        background: linear-gradient(135deg, #fbfffd, #f1fbf4);
        color: #587064;
      }

      .lms-empty-activity strong {
        display: block;
        color: #215a36;
        margin-bottom: 6px;
      }

      .lms-add-choice-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .lms-add-choice {
        min-height: 86px;
        border-radius: 16px;
        border: 1px solid #dfece4;
        background: #ffffff;
        color: #27344c;
        font-weight: 900;
        display: grid;
        place-items: center;
        gap: 6px;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .lms-add-choice span {
        width: 34px;
        height: 34px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        color: white;
      }

      .lms-add-choice:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(30, 71, 44, 0.08);
      }

      .choice-infographic span { background: #27ae60; }
      .choice-vocabulary span { background: #f4b942; }
      .choice-matching span { background: #3498db; }
      .choice-mcq span { background: #8e44ad; }
      .choice-speech span { background: #ec407a; }
      .choice-writing span { background: #16a9b7; }

      .lms-preview-card-inner {
        border-radius: 22px;
        border: 1px solid #dfece4;
        background: linear-gradient(180deg, #ffffff, #fbfffc);
        padding: 18px;
      }

      .lms-preview-badges,
      .lms-preview-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
      }

      .lms-preview-badge,
      .lms-preview-stat {
        padding: 9px 12px;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid #dfece4;
        color: #0b8e4e;
        font-weight: 950;
      }

      .lms-preview-title {
        color: #17243b;
        font-size: 27px;
        letter-spacing: -0.04em;
        margin: 10px 0 14px;
        font-weight: 950;
      }

      .lms-preview-illustration {
        height: 160px;
        border-radius: 18px;
        background: linear-gradient(135deg, #eaf9ef, #f7fffa);
        display: grid;
        place-items: center;
        font-size: 80px;
        margin: 12px 0 16px;
        border: 1px solid #e0eee5;
      }

      .lms-preview-textbox {
        padding: 14px;
        border: 1px solid #e0eee5;
        border-radius: 14px;
        color: #586b60;
        line-height: 1.55;
        background: #ffffff;
        min-height: 74px;
        white-space: pre-wrap;
        margin-bottom: 12px;
      }

      .lms-student-preview-btn {
        width: 100%;
        border: 1.8px solid #0a9b53;
        background: #ffffff;
        color: #07884b;
        border-radius: 14px;
        padding: 14px;
        font-weight: 950;
        cursor: pointer;
      }

      .lms-side-activity-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .lms-side-activity {
        display: grid;
        grid-template-columns: 34px 28px 1fr 20px;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border: 1px solid #e5eee8;
        border-radius: 12px;
        background: #ffffff;
        color: #24324a;
        font-weight: 850;
      }

      .lms-side-activity .icon {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 950;
      }

      .lms-side-activity .order {
        color: #6d7b73;
        font-weight: 950;
        text-align: center;
      }

      .lms-recent-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        overflow: hidden;
        border: 1px solid #e5eee8;
        border-radius: 14px;
      }

      .lms-recent-table th {
        text-align: left;
        color: #52665a;
        background: #fbfefd;
        font-size: 12px;
        padding: 12px;
      }

      .lms-recent-table td {
        padding: 12px;
        border-top: 1px solid #eef4f0;
        color: #22324a;
        font-size: 13px;
        font-weight: 700;
      }

      .lms-status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 900;
      }

      .lms-status.published {
        background: #e8f8ef;
        color: #0b8e4e;
      }

      .lms-status.draft {
        background: #e9f3ff;
        color: #2f80ed;
      }

      .lms-show-more {
        border: 0;
        background: transparent;
        color: #0b8e4e;
        font-weight: 950;
        margin: 14px auto 0;
        display: block;
        cursor: pointer;
      }

      .lms-bottom-action-bar {
        margin-top: 22px;
        display: grid;
        grid-template-columns: 1fr 1fr 1.35fr;
        gap: 16px;
      }

      .lms-action-secondary,
      .lms-action-primary {
        height: 58px;
        border-radius: 16px;
        font-weight: 950;
        cursor: pointer;
      }

      .lms-action-secondary {
        border: 1.8px solid #0a9b53;
        background: #ffffff;
        color: #07884b;
      }

      .lms-action-primary {
        border: 0;
        background: linear-gradient(135deg, #12a05a, #07884b);
        color: #ffffff;
        box-shadow: 0 12px 24px rgba(8, 136, 75, 0.18);
      }

      .lms-tips-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .lms-tip-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        color: #455b4e;
        font-weight: 700;
      }

      .lms-tip-item span {
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: #eef8f2;
        flex: 0 0 auto;
      }

      .teacher-footer {
        color: #7c8b82;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 28px;
        padding: 18px 4px 0;
        border-top: 1px solid #e5eee8;
      }


      .lms-feature-section {
        margin-top: 26px;
        background: #ffffff;
        border: 1px solid #e5eee8;
        border-radius: 26px;
        padding: 24px;
        box-shadow: 0 16px 40px rgba(31, 73, 43, 0.06);
      }

      .lms-feature-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .lms-feature-head h2 {
        margin: 4px 0 6px;
        color: #17243b;
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      .lms-feature-head p {
        margin: 0;
        color: #748378;
        line-height: 1.6;
        max-width: 760px;
      }

      .lms-section-label {
        color: #079b55;
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .lms-tools-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .lms-tool-card {
        background: linear-gradient(180deg, #fbfffc, #f7fbf8);
        border: 1px solid #e2ede6;
        border-radius: 22px;
        padding: 18px;
      }

      .lms-tool-card h3 {
        margin: 0 0 6px;
        color: #1a3b29;
        font-size: 18px;
      }

      .lms-tool-card p {
        margin: 0 0 14px;
        color: #748378;
        font-size: 13px;
        line-height: 1.5;
      }

      .lms-tool-card .input-field {
        background: #ffffff;
      }

      .lms-form-gap {
        height: 10px;
      }

      .lms-groups-list {
        margin-top: 18px;
        display: grid;
        gap: 14px;
      }

      .lms-group-card {
        border: 1px solid #e5eee8;
        border-radius: 20px;
        background: #ffffff;
        padding: 16px;
      }

      .lms-group-top {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        align-items: flex-start;
      }

      .lms-group-top strong {
        color: #17243b;
      }

      .lms-group-desc {
        color: #748378;
        font-size: 13px;
        margin-top: 4px;
      }

      .lms-mini-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: #eefaf3;
        color: #087c45;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 900;
        white-space: nowrap;
      }

      .lms-group-member-row {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #edf3ef;
      }

      .lms-monitor-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .lms-monitor-actions button,
      .lms-tool-card button,
      .lms-group-member-row button {
        cursor: pointer;
      }

      .lms-report-button {
        border: 1px solid #dbe9e1;
        background: #ffffff;
        color: #157a45;
        border-radius: 14px;
        padding: 10px 12px;
        font-weight: 900;
      }

      .lms-table-card {
        overflow: hidden;
      }

      .lms-table-scroll {
        width: 100%;
        overflow-x: auto;
      }

      .lms-recent-table.monitoring td,
      .lms-recent-table.monitoring th {
        white-space: nowrap;
      }

      .lms-status.neutral {
        background: #eef6ff;
        color: #2f80ed;
      }

      .lms-empty-line {
        padding: 18px;
        color: #748378;
        background: #f8fcf9;
        border: 1px dashed #d8e9df;
        border-radius: 18px;
      }

      .lms-main-action {
        height: 44px;
        border: 0;
        border-radius: 14px;
        background: linear-gradient(135deg, #11a85f, #06934e);
        color: white;
        padding: 0 16px;
        font-weight: 950;
        box-shadow: 0 10px 20px rgba(17, 168, 95, 0.18);
      }

      .lms-outline-action {
        height: 44px;
        border: 1px solid #dbe9e1;
        border-radius: 14px;
        background: white;
        color: #117a45;
        padding: 0 16px;
        font-weight: 950;
      }

      @media (max-width: 920px) {
        .lms-tools-grid {
          grid-template-columns: 1fr;
        }

        .lms-feature-head,
        .lms-group-top,
        .lms-group-member-row {
          flex-direction: column;
          align-items: stretch;
        }
      }


      @media (max-width: 1120px) {
        .teacher-builder-layout,
        .teacher-form-row,
        .lms-metric-grid {
          grid-template-columns: 1fr;
        }

        .lms-add-choice-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .lms-page-title {
          flex-direction: column;
          align-items: flex-start;
        }

        .lms-teacher-illustration {
          width: 100%;
        }
      }

      @media (max-width: 760px) {
        .teacher-main-header {
          height: auto;
          align-items: flex-start;
          flex-direction: column;
          padding: 18px;
          gap: 14px;
        }

        .teacher-brand-area,
        .teacher-header-actions,
        .teacher-nav-links {
          flex-wrap: wrap;
          width: 100%;
        }

        .teacher-main-content {
          padding: 22px 14px;
        }

        .lms-title-copy h1 {
          font-size: 30px;
        }

        .lms-add-choice-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .teacher-activity-top {
          grid-template-columns: 42px 1fr;
        }

        .teacher-activity-mini-preview,
        .teacher-activity-actions {
          grid-column: 1 / -1;
        }

        .teacher-activity-row {
          grid-template-columns: 42px 1fr;
        }

        .teacher-activity-actions {
          grid-column: 1 / -1;
          justify-content: flex-start;
        }

        .teacher-activity-row-fields.grid2 {
          grid-template-columns: 1fr;
        }

        .lms-bottom-action-bar {
          grid-template-columns: 1fr;
        }

        .lms-recent-table {
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        }
      }
      /* Cleaner teacher workspace layout: keeps every feature, but groups them into tabs. */
      .teacher-main-header-clean {
        height: 74px;
        padding: 0 28px;
      }

      .teacher-main-header-clean .teacher-brand-icon {
        width: 44px;
        height: 44px;
        border-radius: 15px;
        font-size: 23px;
      }

      .teacher-main-header-clean .teacher-brand-text strong {
        font-size: 21px;
      }

      .teacher-main-header-clean .teacher-brand-text small {
        font-size: 10px;
      }

      .teacher-main-header-clean .teacher-nav-links button {
        padding: 10px 13px;
        border-radius: 13px;
        font-size: 13px;
      }

      .teacher-main-content-clean {
        max-width: 1360px;
        padding: 24px 28px 36px;
      }

      .teacher-clean-hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 22px 24px;
        border-radius: 26px;
        background:
          radial-gradient(circle at 92% 20%, rgba(255, 218, 121, 0.24), transparent 22%),
          linear-gradient(135deg, #ffffff 0%, #f3fbf6 100%);
        border: 1px solid #e3efe8;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.055);
      }

      .teacher-clean-hero-copy h1 {
        margin: 4px 0 8px;
        color: #17243b;
        font-size: clamp(30px, 3vw, 42px);
        letter-spacing: -0.05em;
        line-height: 1.05;
      }

      .teacher-clean-hero-copy p {
        margin: 0;
        max-width: 760px;
        color: #64746b;
        font-weight: 700;
        line-height: 1.55;
      }

      .teacher-clean-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
        flex: 0 0 auto;
      }

      .teacher-logout-btn.light {
        background: #ffffff;
        color: #0c8d4f;
        border: 1px solid #cfe9da;
        box-shadow: none;
      }

      .teacher-clean-metrics {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .teacher-clean-metric {
        min-height: 96px;
        border: 1px solid #e5eee8;
        background: #ffffff;
        border-radius: 22px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 14px;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.045);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      }

      .teacher-clean-metric:hover {
        transform: translateY(-2px);
        border-color: #cfe9da;
        box-shadow: 0 16px 30px rgba(30, 71, 44, 0.075);
      }

      .teacher-clean-metric .metric-icon {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        font-size: 22px;
        flex: 0 0 auto;
      }

      .teacher-clean-metric .metric-icon.green { background: #e8f8ef; }
      .teacher-clean-metric .metric-icon.yellow { background: #fff6df; }
      .teacher-clean-metric .metric-icon.blue { background: #eaf4ff; }
      .teacher-clean-metric .metric-icon.purple { background: #f3edff; }

      .teacher-clean-metric small {
        display: block;
        color: #75867b;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .teacher-clean-metric strong {
        display: block;
        margin-top: 4px;
        color: #17243b;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .teacher-clean-tabs {
        position: sticky;
        top: 74px;
        z-index: 25;
        margin-top: 18px;
        padding: 10px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(14px);
        border: 1px solid #e1eee7;
        border-radius: 22px;
        box-shadow: 0 10px 26px rgba(30, 71, 44, 0.05);
      }

      .teacher-clean-tabs button {
        border: 0;
        background: transparent;
        border-radius: 16px;
        padding: 13px 14px;
        color: #3d5145;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        transition: 0.18s ease;
      }

      .teacher-clean-tabs button:hover,
      .teacher-clean-tabs button.active {
        background: linear-gradient(135deg, #149a57, #0a8a4b);
        color: #ffffff;
        box-shadow: 0 10px 20px rgba(20, 154, 87, 0.2);
      }

      .teacher-clean-panel {
        margin-top: 18px;
        animation: teacherPanelIn 0.18s ease;
      }

      @keyframes teacherPanelIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .teacher-clean-tools {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .lms-tool-card.compact {
        padding: 18px;
        border-radius: 22px;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.045);
      }

      .teacher-clean-subhead {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 14px;
        margin: 22px 0 12px;
        padding-top: 4px;
      }

      .teacher-clean-subhead h3 {
        margin: 0;
        color: #17243b;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .teacher-clean-subhead p {
        margin: 0;
        color: #75867b;
        font-weight: 700;
      }

      .teacher-clean-group-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .lms-group-card.clean {
        margin: 0;
        padding: 16px;
        border-radius: 20px;
        box-shadow: none;
      }

      .lms-feature-head.clean {
        align-items: center;
        margin-bottom: 16px;
      }

      .teacher-builder-layout {
        gap: 18px;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 0.55fr);
      }

      .teacher-design-card,
      .teacher-side-card {
        border-radius: 22px;
        padding: 20px;
        box-shadow: 0 10px 26px rgba(30, 71, 44, 0.045);
      }

      .teacher-design-heading {
        margin-bottom: 14px;
      }

      .teacher-design-heading h2 {
        font-size: 20px;
      }

      .teacher-design-heading p {
        font-size: 13px;
        line-height: 1.45;
      }

      .lms-add-choice-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .lms-add-choice {
        min-height: 58px;
        padding: 10px;
      }

      .teacher-activity-row {
        padding: 15px;
        border-radius: 20px;
      }

      .teacher-activity-row-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
      }

      .teacher-activity-row-head {
        margin-bottom: 10px;
      }

      .lms-recent-table th,
      .lms-recent-table td {
        padding: 12px 10px;
      }

      .lms-bottom-action-bar {
        background: #ffffff;
        border: 1px solid #e4eee8;
        border-radius: 22px;
        padding: 14px;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.045);
      }

      .lms-action-secondary,
      .lms-action-primary {
        height: 50px;
      }

      @media (max-width: 1120px) {
        .teacher-clean-metrics,
        .teacher-clean-tools,
        .teacher-clean-group-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .teacher-builder-layout {
          grid-template-columns: 1fr;
        }

        .teacher-clean-tabs {
          position: static;
        }
      }

      @media (max-width: 760px) {
        .teacher-main-header-clean {
          height: auto;
          padding: 14px;
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .teacher-main-content-clean {
          padding: 16px;
        }

        .teacher-clean-hero,
        .teacher-clean-subhead,
        .lms-feature-head.clean {
          flex-direction: column;
          align-items: flex-start;
        }

        .teacher-clean-actions {
          width: 100%;
          justify-content: stretch;
        }

        .teacher-clean-actions button {
          flex: 1;
        }

        .teacher-clean-metrics,
        .teacher-clean-tools,
        .teacher-clean-group-list,
        .teacher-clean-tabs,
        .lms-add-choice-grid {
          grid-template-columns: 1fr;
        }
      }

          /* Final cleanup for Group Manager and Student Monitoring panels */
      .teacher-workspace-card {
        margin-top: 18px;
        background: #ffffff;
        border: 1px solid #e3eee7;
        border-radius: 26px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.055);
      }

      .teacher-workspace-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
        margin-bottom: 18px;
      }

      .teacher-workspace-heading h2 {
        margin: 4px 0 6px;
        color: #17243b;
        font-size: 26px;
        letter-spacing: -0.04em;
      }

      .teacher-workspace-heading p {
        margin: 0;
        color: #6f8176;
        font-weight: 700;
        line-height: 1.55;
      }

      .teacher-group-layout {
        display: grid;
        grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
        gap: 18px;
        align-items: start;
      }

      .teacher-group-tools {
        display: grid;
        gap: 14px;
      }

      .teacher-tool-box {
        background: linear-gradient(180deg, #fbfffc 0%, #f7fbf8 100%);
        border: 1px solid #e2ede6;
        border-radius: 22px;
        padding: 18px;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.04);
      }

      .teacher-tool-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        margin-bottom: 10px;
        font-size: 20px;
      }

      .teacher-tool-icon.purple {
        background: #f3edff;
      }

      .teacher-tool-icon.orange {
        background: #fff4df;
      }

      .teacher-tool-box h3 {
        margin: 0 0 6px;
        color: #183523;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .teacher-tool-box p {
        margin: 0 0 14px;
        color: #748378;
        line-height: 1.5;
        font-weight: 700;
      }

      .teacher-tool-box .input-field {
        width: 100%;
        margin-bottom: 10px;
        min-height: 48px;
      }

      .teacher-two-fields {
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: 10px;
      }

      .lms-main-action.full,
      .lms-outline-action.full {
        width: 100%;
      }

      .teacher-groups-area {
        min-width: 0;
        background: #fbfefd;
        border: 1px solid #e7f0ea;
        border-radius: 22px;
        padding: 18px;
      }

      .teacher-mini-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
      }

      .teacher-mini-heading h3 {
        margin: 0 0 4px;
        color: #17243b;
        font-size: 21px;
        letter-spacing: -0.03em;
      }

      .teacher-mini-heading p {
        margin: 0;
        color: #75867b;
        font-weight: 700;
        line-height: 1.45;
      }

      .teacher-groups-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .teacher-group-item {
        border: 1px solid #e1eee7;
        border-radius: 20px;
        background: #ffffff;
        padding: 15px;
      }

      .teacher-group-item-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      .teacher-group-item strong {
        color: #17243b;
        font-size: 16px;
      }

      .teacher-group-item p {
        margin: 4px 0 0;
        color: #738177;
        line-height: 1.45;
      }

      .teacher-add-member-row {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #edf3ef;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
      }

      .teacher-add-member-row .input-field {
        min-width: 0;
      }

      .teacher-empty-panel {
        min-height: 160px;
        border: 1px dashed #cfe7d8;
        border-radius: 20px;
        background: #f8fcf9;
        color: #728277;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 22px;
        grid-column: 1 / -1;
      }

      .teacher-empty-panel div {
        font-size: 30px;
      }

      .teacher-empty-panel strong {
        margin-top: 6px;
        color: #1d3c29;
      }

      .teacher-empty-panel p {
        margin: 4px 0 0;
      }

      .teacher-workspace-heading.monitor {
        align-items: center;
      }

      .teacher-monitor-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      .teacher-monitor-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .teacher-monitor-summary div {
        border: 1px solid #e5eee8;
        background: #f9fcfa;
        border-radius: 18px;
        padding: 14px;
      }

      .teacher-monitor-summary span {
        display: block;
        color: #728277;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 950;
      }

      .teacher-monitor-summary strong {
        display: block;
        margin-top: 4px;
        color: #17243b;
        font-size: 25px;
      }

      .teacher-table-wrapper {
        width: 100%;
        overflow-x: auto;
        border: 1px solid #e5eee8;
        border-radius: 20px;
        background: #ffffff;
      }

      .teacher-monitor-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }

      .teacher-monitor-table th,
      .teacher-monitor-table td {
        padding: 15px 16px;
        border-bottom: 1px solid #edf3ef;
        text-align: left;
        color: #17243b;
      }

      .teacher-monitor-table th {
        background: #fbfefd;
        color: #40554a;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .teacher-monitor-table td strong {
        display: block;
        font-size: 15px;
      }

      .teacher-monitor-table td small {
        display: block;
        margin-top: 4px;
        color: #738177;
      }

      .teacher-progress-cell {
        display: grid;
        gap: 7px;
        min-width: 150px;
      }

      .teacher-progress-cell span {
        color: #173c27;
        font-weight: 900;
      }

      .teacher-progress-track {
        height: 8px;
        border-radius: 999px;
        background: #eaf4ee;
        overflow: hidden;
      }

      .teacher-progress-track div {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #13a85f, #7fda95);
      }

      .teacher-empty-panel.table {
        min-height: 180px;
      }

      @media (max-width: 1100px) {
        .teacher-group-layout {
          grid-template-columns: 1fr;
        }

        .teacher-groups-grid {
          grid-template-columns: 1fr;
        }

        .teacher-workspace-heading.monitor {
          align-items: flex-start;
          flex-direction: column;
        }

        .teacher-monitor-actions {
          justify-content: flex-start;
        }
      }

      @media (max-width: 700px) {
        .teacher-workspace-card {
          padding: 16px;
          border-radius: 22px;
        }

        .teacher-monitor-summary,
        .teacher-two-fields,
        .teacher-add-member-row {
          grid-template-columns: 1fr;
        }

        .teacher-monitor-actions button {
          width: 100%;
        }
      }



      /* Teacher readability upgrade */
      .teacher-redesign-page {
        font-size: 17px;
        line-height: 1.58;
      }

      .teacher-main-header {
        min-height: 96px;
      }

      .teacher-brand-text strong {
        font-size: 21px;
      }

      .teacher-brand-text small,
      .teacher-top-user small,
      .teacher-workspace-heading p,
      .teacher-mini-heading p,
      .teacher-group-item p,
      .teacher-monitor-table td small {
        font-size: 14.5px;
        line-height: 1.5;
      }

      .teacher-nav-links button,
      .teacher-monitor-actions button,
      .lms-report-button,
      .quiz-secondary {
        font-size: 15.5px;
        min-height: 46px;
        padding: 11px 17px;
      }

      .teacher-workspace-heading h2 {
        font-size: clamp(29px, 3vw, 40px);
        line-height: 1.14;
      }

      .teacher-mini-heading h3,
      .teacher-group-item strong {
        font-size: 19.5px;
      }

      .teacher-workspace-card {
        padding: clamp(22px, 2.5vw, 32px);
      }

      .teacher-monitor-summary div {
        min-height: 108px;
        padding: 19px;
      }

      .teacher-monitor-summary span {
        font-size: 14.5px;
      }

      .teacher-monitor-summary strong {
        font-size: clamp(28px, 3vw, 38px);
      }

      .teacher-monitor-table th,
      .teacher-monitor-table td {
        font-size: 16px;
        padding: 17px 15px;
      }

      .teacher-monitor-table th {
        font-size: 13px;
      }

      .teacher-monitor-table td strong {
        font-size: 17px;
      }

      .teacher-progress-cell span,
      .lms-mini-pill,
      .lms-section-label {
        font-size: 14px;
      }

      .teacher-empty-panel strong {
        font-size: 21px;
      }

      .teacher-empty-panel p {
        font-size: 15.5px;
      }



      /* Teacher control size upgrade */
      .teacher-main-header-clean {
        min-height: 104px;
        padding: 0 42px;
      }

      .teacher-main-header-clean .teacher-brand-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        font-size: 28px;
      }

      .teacher-main-header-clean .teacher-brand-text strong {
        font-size: 24px;
        line-height: 1.1;
      }

      .teacher-main-header-clean .teacher-brand-text small {
        font-size: 12.5px;
        line-height: 1.35;
      }

      .teacher-main-header-clean .teacher-nav-links {
        gap: 14px;
      }

      .teacher-main-header-clean .teacher-nav-links button {
        min-height: 56px;
        padding: 14px 22px;
        border-radius: 18px;
        font-size: 17px;
        font-weight: 950;
        gap: 10px;
      }

      .teacher-header-actions {
        gap: 18px;
      }

      .teacher-profile-pill {
        min-height: 72px;
        padding: 12px 18px;
        border-radius: 22px;
        gap: 14px;
      }

      .teacher-profile-avatar {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        font-size: 26px;
      }

      .teacher-profile-text strong {
        font-size: 18px;
      }

      .teacher-profile-text small {
        font-size: 14px;
      }

      .teacher-logout-btn {
        min-height: 62px;
        padding: 0 28px;
        border-radius: 20px;
        font-size: 17px;
        font-weight: 950;
      }

      .teacher-clean-actions {
        gap: 16px;
      }

      .teacher-clean-actions .lms-view-button,
      .teacher-clean-actions .teacher-logout-btn.light {
        min-height: 66px;
        padding: 0 30px;
        border-radius: 22px;
        font-size: 17px;
        font-weight: 950;
      }

      .teacher-clean-tabs {
        gap: 16px;
        padding: 16px;
      }

      .teacher-clean-tabs button {
        min-height: 68px;
        padding: 16px 24px;
        border-radius: 20px;
        font-size: 17px;
        font-weight: 950;
        gap: 12px;
      }

      .teacher-clean-tabs button span {
        font-size: 22px;
      }



      /* Teacher sidebar LMS layout */
      .teacher-main-header-clean .teacher-brand-area {
        gap: 0;
      }

      .teacher-main-header-clean .teacher-brand-mark {
        border-right: 0;
        padding-right: 0;
      }

      .teacher-sidebar-layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }

      .teacher-main-workarea {
        min-width: 0;
      }

      .teacher-side-nav {
        position: sticky;
        top: 124px;
        align-self: start;
        display: grid;
        gap: 10px;
        padding: 18px;
        border-radius: 28px;
        background: #ffffff;
        border: 1px solid #e5eee8;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.07);
      }

      .teacher-side-nav-title {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px 14px;
        color: #07884b;
        font-size: 15px;
        font-weight: 1000;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .teacher-sidebar-button {
        width: 100%;
        min-height: 62px;
        border: 0;
        border-radius: 20px;
        background: transparent;
        color: #26354d;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        text-align: left;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .teacher-sidebar-button span {
        width: 34px;
        height: 34px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        background: #f2f7f4;
        font-size: 18px;
        flex: 0 0 auto;
      }

      .teacher-sidebar-button strong {
        font-size: 16.5px;
        line-height: 1.2;
        font-weight: 950;
      }

      .teacher-sidebar-button:hover,
      .teacher-sidebar-button.active {
        background: #eaf8ef;
        color: #07884b;
        transform: translateX(2px);
      }

      .teacher-sidebar-button.active {
        box-shadow: inset 4px 0 0 #0c9b59;
      }

      .teacher-sidebar-button.danger {
        margin-top: 10px;
        color: #9b1f3c;
        background: #fff5f7;
      }

      .teacher-sidebar-button.danger span {
        background: #ffe6ec;
      }

      .teacher-sidebar-button.danger:hover {
        background: #ffeaf0;
        color: #851531;
      }

      .teacher-clean-tabs {
        display: none;
      }

      @media (max-width: 1050px) {
        .teacher-sidebar-layout {
          grid-template-columns: 1fr;
        }

        .teacher-side-nav {
          position: static;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .teacher-side-nav-title {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 680px) {
        .teacher-side-nav {
          grid-template-columns: 1fr;
        }
      }



      /* Teacher sidebar spacing refinement */
      .teacher-main-content-clean {
        max-width: none;
        width: 100%;
        padding: 24px 34px 42px 28px;
      }

      .teacher-sidebar-layout {
        grid-template-columns: 300px minmax(0, 1fr);
        gap: 22px;
      }

      .teacher-side-nav {
        margin-left: 0;
      }

      .teacher-main-workarea {
        width: 100%;
      }

      .teacher-clean-hero,
      .teacher-clean-metrics,
      .teacher-clean-panel,
      .teacher-workspace-card {
        width: 100%;
      }

      @media (max-width: 1050px) {
        .teacher-main-content-clean {
          padding: 20px;
        }
      }


      /* Fix monitoring action buttons so they are clearly clickable and never covered by nearby layout layers. */
      .teacher-workspace-heading.monitor {
        position: relative;
        z-index: 5;
      }

      .teacher-monitor-actions {
        position: relative;
        z-index: 10;
        pointer-events: auto;
      }

      .teacher-monitor-actions .lms-report-button {
        position: relative;
        z-index: 11;
        pointer-events: auto;
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .teacher-monitor-actions .lms-report-button:hover {
        background: #eefaf3;
        border-color: #9fd8b8;
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(20, 154, 87, 0.1);
      }

      .teacher-monitor-actions .lms-report-button:active {
        transform: translateY(0);
      }
    `}</style>
  );
}

export function MissionStyles() {
  return (
    <style>{`
      .missions-wrap {
        display: grid;
        gap: 18px;
      }

      .missions-wrap.early {
        --mission-text: #26354d;
        --mission-muted: #526988;
        --mission-primary: #15965a;
      }

      .missions-wrap.standard {
        --mission-text: #17243b;
        --mission-muted: #64748b;
        --mission-primary: #2563eb;
        padding: 18px 0 96px;
      }

      .missions-hero {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
        gap: 18px;
        align-items: stretch;
        border-radius: 34px;
        padding: 26px;
        background:
          radial-gradient(circle at 10% 20%, rgba(255, 236, 163, 0.78), transparent 28%),
          radial-gradient(circle at 90% 16%, rgba(219, 234, 254, 0.80), transparent 28%),
          linear-gradient(135deg, #ffffff, #f0fff5 48%, #eef8ff);
        border: 1px solid rgba(31, 154, 92, 0.10);
        box-shadow: 0 16px 34px rgba(39, 87, 63, 0.07);
      }

      .missions-wrap.standard .missions-hero {
        background: linear-gradient(135deg, #eef2ff, #ffffff 54%, #f8fafc);
        border-color: rgba(37, 99, 235, 0.10);
        box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
      }

      .missions-hero-copy h2 {
        margin: 0;
        color: var(--mission-primary);
        font-size: clamp(38px, 4.6vw, 62px);
        line-height: 0.96;
        letter-spacing: -0.055em;
        font-weight: 1000;
      }

      .missions-wrap.standard .missions-hero-copy h2 {
        font-size: clamp(34px, 4vw, 52px);
        letter-spacing: -0.045em;
      }

      .missions-hero-copy p {
        margin: 12px 0 0;
        color: var(--mission-muted);
        max-width: 720px;
        font-size: 18px;
        line-height: 1.55;
        font-weight: 850;
      }

      .missions-hero-icon {
        width: 96px;
        height: 96px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
        border-radius: 30px;
        background: #fff5cf;
        font-size: 54px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.22);
      }

      .missions-progress-card {
        border-radius: 30px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.92);
        border: 2px solid rgba(255, 217, 102, 0.32);
        box-shadow: 0 14px 30px rgba(20, 34, 59, 0.08);
        align-self: stretch;
        display: grid;
        align-content: center;
      }

      .missions-progress-card strong {
        color: #14223b;
        font-size: clamp(26px, 3vw, 38px);
        font-weight: 1000;
        letter-spacing: -0.045em;
      }

      .missions-progress-track {
        height: 15px;
        margin-top: 14px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }

      .missions-progress-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #facc15);
      }

      .missions-wrap.standard .missions-progress-fill {
        background: linear-gradient(90deg, #2563eb, #7c3aed);
      }

      .missions-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .missions-stat-card {
        min-height: 104px;
        padding: 18px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.20);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
      }

      .missions-stat-card b {
        display: block;
        color: var(--mission-text);
        font-size: 30px;
        font-weight: 1000;
        line-height: 1;
      }

      .missions-stat-card span {
        display: block;
        margin-top: 8px;
        color: var(--mission-muted);
        font-weight: 850;
      }

      .missions-section {
        border-radius: 32px;
        padding: 26px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(31, 154, 92, 0.07);
        box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
      }

      .missions-wrap.standard .missions-section {
        border-color: rgba(37, 99, 235, 0.09);
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
      }

      .missions-section-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .missions-section-head h3 {
        margin: 0;
        color: var(--mission-primary);
        font-size: clamp(28px, 3.3vw, 42px);
        line-height: 1;
        letter-spacing: -0.045em;
        font-weight: 1000;
      }

      .missions-section-head p {
        margin: 8px 0 0;
        color: var(--mission-muted);
        font-weight: 850;
        line-height: 1.5;
      }

      .missions-game-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
        gap: 16px;
      }

      .missions-wrap.early .missions-game-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .missions-game-card {
        border: 0;
        min-height: 238px;
        border-radius: 28px;
        padding: 18px;
        text-align: left;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 14px;
        cursor: pointer;
        color: #24324a;
        box-shadow: 0 12px 24px rgba(47, 78, 84, 0.06);
        border: 2px solid transparent;
        transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
      }

      .missions-game-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 30px rgba(47, 78, 84, 0.10);
      }

      .missions-game-card.locked {
        opacity: 0.68;
        cursor: not-allowed;
      }

      .missions-game-card.sky { background: #e0f2fe; }
      .missions-game-card.sun { background: #fef3c7; }
      .missions-game-card.mint { background: #dcfce7; }
      .missions-game-card.pink { background: #fce7f3; }
      .missions-game-card.violet { background: #ede9fe; }
      .missions-game-card.rose { background: #ffe4e6; }
      .missions-game-card.orange { background: #ffedd5; }

      .missions-game-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .missions-game-icon {
        width: 66px;
        height: 66px;
        display: grid;
        place-items: center;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.72);
        font-size: 38px;
      }

      .missions-status {
        min-height: 32px;
        padding: 0 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: #334155;
        font-size: 12px;
        font-weight: 1000;
      }

      .missions-game-card h4 {
        margin: 12px 0 8px;
        color: #14223b;
        font-size: 24px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .missions-game-card p {
        margin: 0;
        color: #385075;
        font-size: 15px;
        line-height: 1.45;
        font-weight: 800;
      }

      .missions-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
      }

      .missions-tag {
        min-height: 30px;
        padding: 0 10px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        color: #334155;
        font-size: 12px;
        font-weight: 1000;
      }

      .missions-play-btn {
        width: 100%;
        min-height: 48px;
        border: 0;
        border-radius: 18px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(32, 156, 96, 0.16);
        display: grid;
        place-items: center;
      }

      .missions-wrap.standard .missions-play-btn {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        box-shadow: 0 12px 18px rgba(37, 99, 235, 0.16);
      }

      .missions-play-btn.locked {
        background: #94a3b8;
        box-shadow: none;
        cursor: not-allowed;
      }

      .missions-badge-card {
        border-radius: 28px;
        padding: 24px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 14px 26px rgba(15, 23, 42, 0.05);
      }

      .missions-badge-card h3 {
        margin: 0 0 10px;
        color: var(--mission-primary);
        font-size: 30px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .missions-badge-card p {
        color: var(--mission-muted);
        font-weight: 850;
        line-height: 1.6;
      }

      .missions-badge-preview-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 14px;
      }

      .missions-badge-preview {
        min-height: 108px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        text-align: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-weight: 950;
      }

      .missions-badge-preview span {
        display: block;
        font-size: 34px;
        margin-bottom: 6px;
      }

      .missions-bottom-nav {
        position: fixed;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        width: min(760px, calc(100vw - 24px));
        z-index: 90;
        min-height: 76px;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
        backdrop-filter: blur(14px);
      }

      .missions-bottom-nav button {
        border: 0;
        border-radius: 20px;
        background: transparent;
        color: #475569;
        font-size: 12px;
        font-weight: 950;
        cursor: pointer;
        display: grid;
        place-items: center;
        gap: 2px;
      }

      .missions-bottom-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .missions-wrap.standard + .missions-bottom-nav button.active {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .missions-bottom-nav span {
        font-size: 24px;
        line-height: 1;
      }

      .mission-play-shell {
        display: grid;
        gap: 18px;
      }

      .mission-play-card {
        border-radius: 36px;
        padding: 32px;
        background:
          radial-gradient(circle at 10% 18%, rgba(255, 236, 163, 0.78), transparent 28%),
          radial-gradient(circle at 90% 16%, rgba(219, 234, 254, 0.80), transparent 30%),
          linear-gradient(135deg, #ffffff, #f8fcff);
        border: 1px solid rgba(31, 154, 92, 0.10);
        box-shadow: 0 18px 38px rgba(39, 87, 63, 0.08);
      }

      .mission-play-head {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr);
        gap: 20px;
        align-items: center;
        margin-bottom: 22px;
      }

      .mission-play-icon {
        width: 110px;
        height: 110px;
        border-radius: 34px;
        display: grid;
        place-items: center;
        background: #fff5cf;
        font-size: 62px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.22);
      }

      .mission-play-head h2 {
        margin: 0;
        color: #15965a;
        font-size: clamp(40px, 5vw, 68px);
        line-height: 0.95;
        letter-spacing: -0.06em;
        font-weight: 1000;
      }

      .mission-play-head p {
        margin: 10px 0 0;
        color: #526988;
        font-size: 18px;
        line-height: 1.55;
        font-weight: 850;
      }

      .mission-prompt-box {
        padding: 24px;
        border-radius: 28px;
        background: #ffffff;
        border: 1px dashed #cbd5e1;
        color: #24324a;
        font-size: clamp(22px, 3vw, 34px);
        line-height: 1.55;
        font-weight: 1000;
      }

      .mission-play-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .mission-play-choice {
        min-height: 72px;
        border: 2px solid rgba(47, 191, 115, 0.20);
        border-radius: 22px;
        background: #ffffff;
        color: #24324a;
        font-size: 18px;
        font-weight: 1000;
        cursor: pointer;
        padding: 12px 16px;
        text-align: center;
      }

      .mission-play-choice.selected,
      .mission-play-choice:hover {
        background: #edf8f1;
        color: #15965a;
        border-color: rgba(47, 191, 115, 0.46);
      }

      .mission-result {
        margin-top: 16px;
        padding: 18px;
        border-radius: 22px;
        background: #fff8cf;
        color: #24324a;
        font-size: 18px;
        font-weight: 1000;
        line-height: 1.45;
      }

      .mission-result.good {
        background: #e9fbef;
        color: #0d7f48;
        border: 1px solid #bfeacb;
      }

      .mission-play-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }

      .mission-play-action {
        min-height: 58px;
        border: 0;
        border-radius: 20px;
        padding: 0 22px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 17px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 20px rgba(32, 156, 96, 0.14);
      }

      .mission-play-action.secondary {
        background: #ffffff;
        color: #14975a;
        border: 2px solid #2fbf73;
        box-shadow: none;
      }

      .mission-play-action.purple {
        background: linear-gradient(135deg, #a770ef, #7b4fd6);
      }

      /* Duolingo-inspired mission polish */
      .missions-wrap.early {
        gap: 24px;
      }

      .missions-wrap.early .missions-game-card,
      .missions-wrap.early .mission-play-card,
      .missions-wrap.early .missions-section,
      .missions-wrap.early .missions-badge-card,
      .missions-wrap.early .missions-stat-card {
        border: 3px solid rgba(209, 250, 229, 0.95);
        box-shadow: 0 9px 0 rgba(188, 221, 198, 0.72), 0 18px 34px rgba(25, 78, 54, 0.08);
      }

      .missions-wrap.early .missions-game-card {
        min-height: 258px;
        position: relative;
        overflow: hidden;
        transform: translateY(0);
      }

      .missions-wrap.early .missions-game-card::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: 24px;
        border: 2px solid rgba(255, 255, 255, 0.42);
        pointer-events: none;
      }

      .missions-wrap.early .missions-game-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 0 rgba(188, 221, 198, 0.84), 0 24px 42px rgba(25, 78, 54, 0.12);
      }

      .missions-wrap.early .missions-game-card:active {
        transform: translateY(3px);
        box-shadow: 0 5px 0 rgba(188, 221, 198, 0.84), 0 14px 26px rgba(25, 78, 54, 0.10);
      }

      .missions-wrap.early .missions-game-icon,
      .missions-wrap.early .mission-play-icon {
        background: #ffffff;
        border: 3px solid rgba(255, 238, 174, 0.85);
        box-shadow: 0 6px 0 rgba(246, 196, 83, 0.18);
      }

      .missions-wrap.early .missions-play-btn,
      .missions-wrap.early .mission-play-action {
        min-height: 56px;
        border-radius: 18px;
        background: linear-gradient(180deg, #58cc02 0%, #40a900 100%);
        box-shadow: 0 6px 0 #2f8500, 0 12px 20px rgba(88, 204, 2, 0.18);
        letter-spacing: 0.01em;
      }

      .missions-wrap.early .missions-play-btn {
        text-transform: uppercase;
        font-size: 16px;
      }

      .missions-wrap.early .mission-play-action:hover,
      .missions-wrap.early .missions-play-btn:hover {
        filter: brightness(1.03);
      }

      .missions-wrap.early .mission-play-action:active,
      .missions-wrap.early .missions-play-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #2f8500, 0 8px 14px rgba(88, 204, 2, 0.16);
      }

      .missions-wrap.early .mission-play-action.secondary {
        background: #ffffff;
        color: #15965a;
        border: 3px solid #b7efc5;
        box-shadow: 0 6px 0 #d4ead9;
      }

      .missions-wrap.early .mission-play-action.purple {
        background: linear-gradient(180deg, #8b5cf6 0%, #6d45d8 100%);
        box-shadow: 0 6px 0 #4f2faf, 0 12px 20px rgba(139, 92, 246, 0.18);
      }

      .missions-wrap.early .mission-prompt-box {
        background: #ffffff;
        border: 3px solid #e5eef9;
        box-shadow: inset 0 -5px 0 rgba(226, 232, 240, 0.62);
      }

      .missions-wrap.early .mission-play-choice {
        min-height: 86px;
        border: 3px solid #dbeafe;
        border-bottom-width: 7px;
        border-radius: 24px;
        background: #ffffff;
        color: #24324a;
        box-shadow: none;
        transition: 0.14s ease;
      }

      .missions-wrap.early .mission-play-choice:hover,
      .missions-wrap.early .mission-play-choice.selected {
        background: #ecfdf5;
        color: #15965a;
        border-color: #8ce0ae;
        transform: translateY(-2px);
      }

      .missions-wrap.early .mission-result {
        border: 3px solid #fde68a;
        box-shadow: 0 6px 0 #f7d86b;
      }

      .missions-wrap.early .mission-result.good {
        border-color: #86efac;
        box-shadow: 0 6px 0 #60c983;
      }

      .missions-wrap.early .mission-play-card {
        position: relative;
        overflow: hidden;
      }

      .missions-wrap.early .mission-play-card::before {
        content: '⭐';
        position: absolute;
        right: 28px;
        top: 26px;
        font-size: 34px;
        opacity: 0.38;
        pointer-events: none;
      }

      .g12-mission-play-nohero {
        padding-top: 22px;
      }

      .g12-mission-play-nav {
        grid-template-columns: repeat(6, 1fr);
      }


      /* Grade 1-2 Mga Misyon and game screen balanced font sizing. */
      .missions-wrap.early .missions-section,
      .missions-wrap.early .missions-badge-card,
      .missions-wrap.early .missions-stat-card,
      .missions-wrap.early .mission-play-card {
        border-radius: 30px;
      }

      .missions-wrap.early .missions-section {
        padding: 24px;
      }

      .missions-wrap.early .missions-stat-card {
        min-height: 92px;
        padding: 16px;
      }

      .missions-wrap.early .missions-stat-card b {
        font-size: 24px;
      }

      .missions-wrap.early .missions-stat-card span,
      .missions-wrap.early .missions-section-head p,
      .missions-wrap.early .missions-badge-card p {
        font-size: 15px;
        line-height: 1.45;
      }

      .missions-wrap.early .missions-section-head h3,
      .missions-wrap.early .missions-badge-card h3 {
        font-size: clamp(24px, 3vw, 34px);
        line-height: 1.05;
      }

      .g12-page .missions-wrap.early .missions-game-card,
      .missions-wrap.early .missions-game-card {
        min-height: 230px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-icon,
      .missions-wrap.early .missions-game-icon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        font-size: 40px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4,
      .missions-wrap.early .missions-game-card h4 {
        font-size: 28px;
        line-height: 1.08;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .missions-wrap.early .missions-game-card p {
        font-size: 16px;
      }

      .g12-page .missions-wrap.early .missions-play-btn,
      .missions-wrap.early .missions-play-btn {
        min-height: 54px;
        border-radius: 20px;
        font-size: 16px;
      }

      .missions-wrap.early .missions-badge-preview {
        min-height: 92px;
        border-radius: 20px;
        font-size: 14px;
      }

      .missions-wrap.early .missions-badge-preview span {
        font-size: 28px;
      }

      .missions-wrap.early .mission-play-card {
        padding: 28px;
      }

      .missions-wrap.early .mission-play-head {
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 18px;
        margin-bottom: 20px;
      }

      .missions-wrap.early .mission-play-icon {
        width: 84px;
        height: 84px;
        border-radius: 28px;
        font-size: 46px;
      }

      .missions-wrap.early .mission-play-head h2 {
        font-size: clamp(30px, 3.8vw, 46px);
        line-height: 1;
      }

      .missions-wrap.early .mission-play-head p {
        font-size: 16px;
        line-height: 1.45;
      }

      .missions-wrap.early .mission-prompt-box {
        padding: 22px;
        border-radius: 24px;
        font-size: clamp(18px, 2.2vw, 26px);
        line-height: 1.6;
      }

      .missions-wrap.early .mission-play-options {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .missions-wrap.early .mission-play-choice {
        min-height: 68px;
        border-radius: 22px;
        font-size: 16px;
      }

      .missions-wrap.early .mission-result {
        padding: 16px;
        border-radius: 20px;
        font-size: 16px;
      }

      .missions-wrap.early .mission-play-action {
        min-height: 54px;
        border-radius: 20px;
        padding: 0 22px;
        font-size: 16px;
      }

      @media (max-width: 960px) {
        .missions-hero,
        .missions-wrap.early .missions-game-grid {
          grid-template-columns: 1fr;
        }

        .missions-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mission-play-head {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .missions-hero,
        .missions-section,
        .missions-badge-card,
        .mission-play-card {
          border-radius: 26px;
          padding: 20px;
        }

        .missions-stat-grid,
        .missions-badge-preview-row {
          grid-template-columns: 1fr;
        }

        .missions-bottom-nav {
          width: calc(100vw - 18px);
          bottom: 10px;
          border-radius: 22px;
        }

        .missions-bottom-nav button {
          font-size: 10px;
        }

        .mission-play-icon {
          width: 84px;
          height: 84px;
          border-radius: 28px;
          font-size: 48px;
        }
      }
    `}</style>
  );
}
