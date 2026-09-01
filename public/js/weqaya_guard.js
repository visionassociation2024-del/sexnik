// wi9ayah.pro - Global Security, Age Verification (+18) & KSA Restriction Guard

(function initWeqayaGuard() {
  // 1. Check Saudi Arabia Geo Restriction (Client-side timezone check fallback)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Riyadh') {
      document.addEventListener('DOMContentLoaded', () => {
        showKsaRestrictionScreen();
      });
      return;
    }
  } catch (e) {}

  // 2. Check 18+ Age Acceptance
  document.addEventListener('DOMContentLoaded', () => {
    checkAgeVerification();
  });
})();

function showKsaRestrictionScreen() {
  document.body.innerHTML = `
    <div style="position: fixed; inset: 0; background: #0a0a10; color: #fff; z-index: 99999999; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Inter', system-ui, sans-serif; text-align: center;">
      <div style="background: rgba(18, 18, 28, 0.98); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 40px 30px; max-width: 520px; box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
        <div style="font-size: 50px; color: #ef4444; margin-bottom: 16px;">🚫</div>
        <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 10px; color: #fff;">Content Unavailable in Your Region</h1>
        <div style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 14px; border-radius: 20px; font-size: 11.5px; font-weight: 700; display: inline-block; margin-bottom: 16px;">
          Compliance Notice (HTTP 451: KSA Restricted)
        </div>
        <p style="color: #94a3b8; font-size: 13.5px; line-height: 1.7; margin-bottom: 16px;">
          Access to <strong style="color: #ff007f;">wi9ayah.pro</strong> is restricted for visitors connecting from Saudi Arabia in accordance with local digital content regulations and statutory guidelines.
        </p>
      </div>
    </div>
  `;
}

function checkAgeVerification() {
  const isAccepted = localStorage.getItem('weqaya_18_accepted');
  if (isAccepted === 'true') return;

  // Render Clean Minimalist Age Verification Modal
  let modal = document.getElementById('weqayaAgeGate');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'weqayaAgeGate';
    modal.className = 'age-gate-overlay';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="age-gate-card">
        <div class="age-gate-badge">
          <i class="fa fa-shield-halved"></i> 18+ Adult Content & Health Notice
        </div>
        
        <h2 class="age-gate-title">
          Welcome to <span>wi9ayah.pro</span>
        </h2>
        
        <div class="age-gate-desc">
          <p style="margin-bottom: 10px;">
            You are entering <strong>wi9ayah.pro</strong>, a search engine and indexing hub for adult entertainment (18+) and sexual health awareness resources.
          </p>
          <p style="margin-bottom: 0; font-size: 12.5px; color: #94a3b8;">
            By clicking <strong>"I am 18 or older — Enter"</strong>, you confirm that you are at least 18 years of age (or legal age of majority in your jurisdiction) and agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div class="age-gate-actions">
          <button class="btn-age-accept" onclick="acceptWeqayaAge()">
            <i class="fa fa-check-circle"></i> I am 18 or older — Enter
          </button>
          <button class="btn-age-reject" onclick="rejectWeqayaAge()">
            <i class="fa fa-times-circle"></i> Exit (Under 18)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  }
}

function acceptWeqayaAge() {
  localStorage.setItem('weqaya_18_accepted', 'true');
  const modal = document.getElementById('weqayaAgeGate');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function rejectWeqayaAge() {
  window.location.href = 'https://www.google.com';
}
