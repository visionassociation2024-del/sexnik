/**
 * Pinterest-Style Discovery & Masonry Engine
 * Handles pin rendering, image lazy loading, quick preview, and pin board saving.
 */

class PinDiscoveryEngine {
  constructor() {
    this.savedPinsKey = 'pinterest_saved_pins';
    this.historyKey = 'pinterest_watch_history';
    this.lazyObserver = null;
    this.init();
  }

  init() {
    this.initLazyLoading();
    this.bindGlobalEvents();
  }

  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.onload = () => img.classList.add('loaded');
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px 0px' });
    }
  }

  observeImages(container = document) {
    if (!this.lazyObserver) return;
    const lazyImages = container.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => this.lazyObserver.observe(img));
  }

  getSavedPins() {
    try {
      return JSON.parse(localStorage.getItem(this.savedPinsKey)) || [];
    } catch (e) {
      return [];
    }
  }

  isPinSaved(id) {
    const pins = this.getSavedPins();
    return pins.some(p => p.id === id || p.video_id === id);
  }

  toggleSavePin(pinData) {
    let pins = this.getSavedPins();
    const existingIndex = pins.findIndex(p => p.id === pinData.id || p.video_id === pinData.id);

    if (existingIndex > -1) {
      pins.splice(existingIndex, 1);
      localStorage.setItem(this.savedPinsKey, JSON.stringify(pins));
      this.showToast('Removed from your Saved Pins', 'info');
      return false;
    } else {
      pins.unshift({
        id: pinData.id || pinData.video_id,
        title: pinData.title || 'Saved Pin',
        thumbnail: pinData.thumbnail || pinData.thumb || '',
        duration: pinData.duration || '12:00',
        author: pinData.author || pinData.performer || 'Featured Star',
        savedAt: Date.now()
      });
      localStorage.setItem(this.savedPinsKey, JSON.stringify(pins));
      this.showToast('Saved to your Pins collection! 📌', 'success');
      return true;
    }
  }

  recordHistory(video) {
    try {
      let history = JSON.parse(localStorage.getItem(this.historyKey)) || [];
      history = history.filter(item => item.id !== video.id);
      history.unshift({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail || video.thumb,
        duration: video.duration || '10:00',
        author: video.author || 'Featured Star',
        timestamp: Date.now()
      });
      if (history.length > 100) history.pop();
      localStorage.setItem(this.historyKey, JSON.stringify(history));
    } catch (e) {}
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('pinToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pinToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #262622;
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 9999px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        z-index: 10000;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
        opacity: 0;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      document.body.appendChild(toast);
    }

    const icon = type === 'success' ? '📌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> ${message}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 2800);
  }

  bindGlobalEvents() {
    // Global Save Pin handler
    document.addEventListener('click', (e) => {
      const saveBtn = e.target.closest('.pin-save-cta') || e.target.closest('.js-save-pin');
      if (saveBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pinCard = saveBtn.closest('.pin-card') || document.querySelector('.watch-main-card');
        if (pinCard) {
          const pinData = {
            id: pinCard.dataset.id || saveBtn.dataset.id,
            title: pinCard.dataset.title || saveBtn.dataset.title || 'Video Pin',
            thumbnail: pinCard.dataset.thumb || saveBtn.dataset.thumb || '',
            duration: pinCard.dataset.duration || saveBtn.dataset.duration || '',
            author: pinCard.dataset.author || saveBtn.dataset.author || 'Star'
          };
          const isSaved = this.toggleSavePin(pinData);
          saveBtn.innerText = isSaved ? 'Saved' : 'Save';
          if (isSaved) {
            saveBtn.style.backgroundColor = '#262622';
          } else {
            saveBtn.style.backgroundColor = '#e60023';
          }
        }
      }
    });
  }
}

// Global Discovery Engine Instance
window.pinEngine = new PinDiscoveryEngine();
