// Weqaya Pro (وقاية برو) - Global Security, Age Verification (+18) & KSA Restriction Guard

(function initWeqayaGuard() {
  // 1. Check Saudi Arabia Geo Restriction (Client-side timezone check)
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
    <div style="position: fixed; inset: 0; background: #0a0a10; color: #fff; z-index: 99999999; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, -apple-system, sans-serif; direction: rtl; text-align: center;">
      <div style="background: rgba(22, 22, 34, 0.98); border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 24px; padding: 45px 35px; max-width: 560px; box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
        <div style="font-size: 55px; color: #ef4444; margin-bottom: 18px;">🚫</div>
        <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 12px; color: #fff;">عذراً، هذا الموقع محجوب في منطقتك</h1>
        <div style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; margin-bottom: 18px;">
          امتثالاً للأنظمة واللوائح المحلية (KSA Restricted)
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.7; margin-bottom: 18px;">
          تم حظر إمكانية الوصول إلى منصة <strong style="color: #ff007f;">وقاية برو (Weqaya Pro)</strong> من داخل المملكة العربية السعودية التزاماً بالأنظمة والتشريعات المحلية لتنظيم المحتوى الرقمي.
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 0; direction: ltr;">
          Access to <strong>Weqaya Pro</strong> is restricted in Saudi Arabia in compliance with local regulations.
        </p>
      </div>
    </div>
  `;
}

function checkAgeVerification() {
  const isAccepted = localStorage.getItem('weqaya_18_accepted');
  if (isAccepted === 'true') return;

  // Render Age Verification Modal
  let modal = document.getElementById('weqayaAgeGate');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'weqayaAgeGate';
    modal.className = 'age-gate-overlay';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="age-gate-card">
        <div class="age-gate-badge">
          <i class="fa fa-exclamation-triangle"></i> تنبيه محتوى للبالغين (+18)
        </div>
        
        <h2 class="age-gate-title">
          مرحباً بك في <span>wi9ayah.pro (وقاية برو)</span>
        </h2>
        
        <div class="age-gate-desc">
          <p style="margin-bottom: 10px;">
            أنت على وشك الدخول إلى منصة <strong>wi9ayah.pro (وقاية برو)</strong> المتخصصة في فهرسة وبث مقاطع الفيديو الترفيهية المخصصة حصرياً للبالغين ودليل الصحة الجنسية.
          </p>
          <p style="margin-bottom: 0; font-size: 12.5px; color: #94a3b8;">
            بالضغط على "أوافق ودخول"، فإنك تقر وتؤكد بأن عمرك لا يقل عن 18 عاماً (أو سن الرشد القانوني في بلد إقامتك)، وتوافق طوعاً على شروط الاستخدام وسياسة الخصوصية.
          </p>
        </div>

        <div class="age-gate-actions">
          <button class="btn-age-accept" onclick="acceptWeqayaAge()">
            <i class="fa fa-check-circle"></i> أوافق، عمري 18 عاماً أو أكثر (دخول)
          </button>
          <button class="btn-age-reject" onclick="rejectWeqayaAge()">
            <i class="fa fa-times-circle"></i> خروج (أقل من 18 عاماً)
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
