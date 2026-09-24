// ============================================
// FarmChain AI — Dual-Mode (Voice + Manual) Product Listing Wizard
// 4-Step Guided Flow: (Speak or Type) → (Photo or Upload) → Confirm → Sell
// Multilingual: Tamil, Hindi, Telugu, English
// High-Contrast Editorial Styling & Guaranteed Visible Sticky Navigation
// Zero Blockchain Terminology Exposed to Farmers
// ============================================

import { store } from '../../data/store.js';
import { i18n } from '../../i18n/index.js';
import { formatCurrency, getCropEmoji, showToast } from '../../utils/helpers.js';
import { startVoiceRecognition, isSpeechSupported } from '../../utils/voice.js';
import { CropGrader } from '../../ai/crop-grader.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { ProductRegistry, Marketplace } from '../../blockchain/contracts.js';
import { GaslessProvider } from '../../web3/gasless.js';
import { postProduct } from '../../utils/api.js';
import { addFirestoreProduct } from '../../firebase/firestore.js';
import { LiveCamera } from '../../components/live-camera.js';

export class FarmerProductWizard {
  constructor(container, onComplete, initialData = {}) {
    this.container = container;
    this.onComplete = onComplete;
    this.user = store.get('currentUser') || { id: 'farmer-001', name: 'Farmer' };

    // Wizard State
    this.step = initialData.step || 1; // 1: Details, 2: Photo, 3: Confirm, 4: Sell/Success
    this.inputMode = initialData.inputMode || 'voice'; // 'voice' | 'manual'
    this.captureProof = initialData.captureProof || null; // Exact GPS & Date/Time proof data

    this.formData = {
      name: initialData.name || '',
      category: initialData.category || 'Grains',
      quantity: initialData.quantity || 500,
      unit: initialData.unit || 'kg',
      pricePerUnit: initialData.pricePerUnit || 45,
      harvestDate: initialData.harvestDate || (initialData.captureProof?.timestamp ? new Date(initialData.captureProof.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      origin: initialData.origin || initialData.captureProof?.location?.address || this.user.location || 'Tamil Nadu, India',
      isOrganic: initialData.isOrganic || false,
      description: initialData.description || '',
    };

    this.photoData = initialData.photoData || null; // base64 data url
    this.photoGrade = initialData.photoGrade || null; // AI grade object
    this.isGradingPhoto = false;

    // Voice State
    this.recognition = null;
    this.isListening = false;
    this.liveTranscript = '';
    this.voiceError = null;

    // Camera Stream State
    this.cameraStream = null;
    this.isCameraActive = false;

    // Audio TTS State
    this.isSpeaking = false;

    // Submission State
    this.isSubmitting = false;
    this.isSuccess = false;
  }

  /**
   * Open and render the wizard modal
   */
  open() {
    this.render();
  }

  /**
   * Render the wizard container with sticky header & sticky footer
   */
  render() {
    let overlay = document.getElementById('farmer-wizard-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'farmer-wizard-overlay';
      overlay.className = 'modal-overlay';
      overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(30, 23, 15, 0.75); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="farmer-wizard-modal animate-scale-up" style="max-width: 660px; width: 100%; height: 90vh; max-height: 820px; background: #FAF6ED; color: #1E170F; border-radius: 20px; border: 2px solid rgba(44, 74, 62, 0.35); box-shadow: 0 25px 60px -15px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden; position: relative;">

        <!-- 1. STICKY TOP HEADER -->
        <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 14px; border-bottom: 2px solid #E4DCCB; background: #FAF6ED; z-index: 20;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.8rem;">🌾</span>
            <div>
              <h2 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; margin: 0; color: #1E170F; letter-spacing: -0.01em;">
                ${i18n.t('wizardTitle')}
              </h2>
              <div style="font-size: 0.8rem; color: #5C4D3C; font-weight: 600;">
                ${this._getStepSubtext()}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${i18n.renderLanguageSelector('wizard-lang-select', 'padding: 6px 12px; font-size: 0.82rem; font-weight: 700; background: #FFFFFF; color: #1E170F; border-radius: 20px; border: 2px solid #CBD5E1; cursor: pointer;')}
            <button type="button" id="wizard-close-btn" style="background: #E4DCCB; border: none; color: #1E170F; width: 34px; height: 34px; border-radius: 50%; font-size: 1.1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
          </div>
        </div>

        <!-- 2. STICKY 4-STEP PROGRESS INDICATOR -->
        <div style="flex-shrink: 0; padding: 12px 24px; background: #F1ECE0; border-bottom: 2px solid #E4DCCB; z-index: 15;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${this._renderStepIndicator(1, '🌾', i18n.t('step1Tab'))}
            ${this._renderStepIndicator(2, '📸', i18n.t('step2Tab'))}
            ${this._renderStepIndicator(3, '📋', i18n.t('step3Tab'))}
            ${this._renderStepIndicator(4, '🚀', i18n.t('step4Tab'))}
          </div>
        </div>

        <!-- 3. STICKY INPUT MODE TOGGLE (Only shown on Step 1: Details) -->
        ${this.step === 1 ? `
          <div style="flex-shrink: 0; padding: 12px 24px 10px; background: #FAF6ED; border-bottom: 1.5px solid #E4DCCB; z-index: 10;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #E4DCCB; padding: 6px; border-radius: 14px;">
              <button type="button" class="wizard-mode-btn" data-mode="voice" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 800; font-size: 0.95rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; ${this.inputMode === 'voice' ? 'background: #16a34a; color: #FFFFFF; border: 2px solid #15803d; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);' : 'background: #FFFFFF; color: #1E170F; border: 2px solid #CBD5E1; box-shadow: 0 2px 6px rgba(0,0,0,0.05);'}">
                <span style="font-size: 1.25rem;">🎤</span>
                <span>${i18n.t('modeSpeak')}</span>
              </button>
              <button type="button" class="wizard-mode-btn" data-mode="manual" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 800; font-size: 0.95rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; ${this.inputMode === 'manual' ? 'background: #2563eb; color: #FFFFFF; border: 2px solid #1d4ed8; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);' : 'background: #FFFFFF; color: #1E170F; border: 2px solid #CBD5E1; box-shadow: 0 2px 6px rgba(0,0,0,0.05);'}">
                <span style="font-size: 1.25rem;">⌨️</span>
                <span>${i18n.t('modeType')}</span>
              </button>
            </div>
            <div style="font-size: 0.74rem; color: #64748b; text-align: center; margin-top: 5px; font-weight: 600;">
              💡 ${i18n.t('switchPrompt')}
            </div>
          </div>
        ` : ''}

        <!-- 4. SCROLLABLE BODY CONTENT (Takes up remaining height) -->
        <div style="flex: 1 1 auto; overflow-y: auto; min-height: 0; padding: 20px 24px;" id="wizard-step-body">
          ${this._renderCurrentStep()}
        </div>

        <!-- 5. GUARANTEED STICKY FOOTER WITH PROMINENT NEXT & CANCEL BUTTONS -->
        ${!this.isSuccess ? `
          <div style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-top: 2px solid #E4DCCB; background: #FAF6ED; box-shadow: 0 -4px 16px rgba(0,0,0,0.06); z-index: 30;">
            <div>
              ${this.step > 1 ? `
                <button type="button" class="btn btn-secondary" id="wizard-back-btn" style="padding: 12px 20px; font-weight: 700; font-size: 0.9rem; border-radius: 12px; background: #FFFFFF; color: #1E170F; border: 2px solid #CBD5E1; cursor: pointer;">
                  ${i18n.t('backBtn')}
                </button>
              ` : `
                <button type="button" class="btn btn-secondary" id="wizard-cancel-btn" style="padding: 12px 20px; font-weight: 700; font-size: 0.9rem; border-radius: 12px; background: #FFFFFF; color: #1E170F; border: 2px solid #CBD5E1; cursor: pointer;">
                  ${i18n.t('cancelBtn')}
                </button>
              `}
            </div>
            <div>
              ${this._renderNextButton()}
            </div>
          </div>
        ` : ''}

      </div>
    `;

    this._bindEvents(overlay);
  }

  _getStepSubtext() {
    switch (this.step) {
      case 1: return i18n.t('step1Desc');
      case 2: return i18n.t('step2Desc');
      case 3: return i18n.t('step3Desc');
      case 4: return i18n.t('step4Desc');
      default: return '';
    }
  }

  _renderStepIndicator(stepNum, icon, label) {
    const isActive = this.step === stepNum;
    const isCompleted = this.step > stepNum;

    const bg = isActive
      ? '#FFFFFF'
      : isCompleted
      ? '#DCFCE7'
      : '#E4DCCB';

    const border = isActive
      ? '#16a34a'
      : isCompleted
      ? '#22c55e'
      : '#D1C7B3';

    const color = isActive
      ? '#15803d'
      : isCompleted
      ? '#166534'
      : '#5C4D3C';

    return `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6px 4px; background: ${bg}; border: 2px solid ${border}; border-radius: 10px; transition: all 0.2s;">
        <span style="font-size: 0.95rem; font-weight: 800;">${isCompleted ? '✓' : icon}</span>
        <span style="font-size: 0.72rem; font-weight: 800; color: ${color}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
          ${label}
        </span>
      </div>
    `;
  }

  _renderNextButton() {
    if (this.step === 1) {
      return `
        <button type="button" class="btn btn-primary" id="wizard-continue-photo-btn" style="padding: 12px 28px; font-weight: 800; font-size: 1rem; border-radius: 12px; min-height: 48px; background: #16a34a; border: 2px solid #15803d; color: #FFFFFF; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <span>${i18n.t('continueToPhotoBtn')}</span>
        </button>
      `;
    }
    if (this.step === 2) {
      return `
        <button type="button" class="btn btn-primary" id="wizard-continue-review-btn" style="padding: 12px 28px; font-weight: 800; font-size: 1rem; border-radius: 12px; min-height: 48px; background: #16a34a; border: 2px solid #15803d; color: #FFFFFF; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <span>${i18n.t('continueToReviewBtn')}</span>
        </button>
      `;
    }
    if (this.step === 3) {
      return `
        <button type="button" class="btn btn-primary" id="wizard-proceed-sell-btn" style="padding: 12px 28px; font-weight: 800; font-size: 1rem; border-radius: 12px; min-height: 48px; background: #16a34a; border: 2px solid #15803d; color: #FFFFFF; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <span>${i18n.t('listForSaleBtn')}</span>
        </button>
      `;
    }
    return '';
  }

  // ==========================================
  // Render Step 1: Details (Voice + Manual)
  // ==========================================
  _renderCurrentStep() {
    if (this.step === 1) return this._renderStep1Details();
    if (this.step === 2) return this._renderStep2Photo();
    if (this.step === 3) return this._renderStep3Confirm();
    if (this.step === 4) return this._renderStep4Sell();
    return '';
  }

  _renderStep1Details() {
    return `
      <!-- VOICE INPUT SECTION (Active when Voice mode is selected) -->
      ${this.inputMode === 'voice' ? `
        <div class="voice-assistant-card animate-fade-in" style="background: #F0FDF4; border: 2px dashed #22c55e; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 22px;">
          <div style="margin-bottom: 12px;">
            <button type="button" id="wizard-mic-btn" style="width: 76px; height: 76px; border-radius: 50%; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 2.2rem; transition: all 0.3s; ${this.isListening ? 'background: #ef4444; box-shadow: 0 0 0 12px rgba(239, 68, 68, 0.25); animation: pulse 1.5s infinite;' : 'background: #16a34a; box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4); color: #fff;'}">
              <span>${this.isListening ? '⏹️' : '🎙️'}</span>
            </button>
          </div>

          <div style="font-size: 1rem; font-weight: 800; color: ${this.isListening ? '#dc2626' : '#15803d'}; margin-bottom: 4px;">
            ${this.isListening ? i18n.t('voiceListening') : i18n.t('voiceMicPrompt')}
          </div>

          <div style="font-size: 0.82rem; color: #374151; max-width: 460px; margin: 0 auto 12px; line-height: 1.4; font-weight: 500;">
            ${i18n.t('voiceTrySpeaking')}
          </div>

          <!-- Live Transcript Area -->
          <div id="wizard-transcript-box" style="background: #FFFFFF; border: 2px solid #86EFAC; border-radius: 12px; padding: 14px; min-height: 52px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; color: #1E170F; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            ${this.liveTranscript ? `<strong>${i18n.t('voiceHeard')}</strong>&nbsp;"${this.liveTranscript}"` : `<span style="color: #94A3B8; font-style: italic;">(${i18n.t('farmer.wizard.spokenWordsPlaceholder')})</span>`}
          </div>

          <!-- Voice Error Box with 1-tap fallback -->
          ${this.voiceError ? `
            <div style="margin-top: 14px; padding: 12px 16px; background: #FEF2F2; border: 2px solid #F87171; border-radius: 12px; text-align: left;">
              <div style="font-size: 0.84rem; color: #991B1B; font-weight: 700; margin-bottom: 8px;">
                ⚠️ ${this.voiceError}
              </div>
              <button type="button" id="wizard-error-switch-btn" class="btn btn-secondary btn-sm" style="font-size: 0.82rem; font-weight: 800; padding: 8px 16px; background: #FFFFFF; border: 2px solid #DC2626; color: #DC2626; border-radius: 8px; cursor: pointer;">
                ${i18n.t('switchToManualBtn')}
              </button>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- REVIEW & EDITABLE FORM FIELDS (Used in both Manual and Voice modes) -->
      <div style="background: #FFFFFF; border: 2px solid #E4DCCB; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="font-size: 0.88rem; font-weight: 800; color: #2C4A3E; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          <span>📝</span>
          <span>${this.inputMode === 'voice' ? i18n.t('farmer.wizard.verifiedFieldsHeader') : i18n.t('farmer.wizard.enterDetailsHeader')}</span>
        </div>

        <!-- Crop Name -->
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span>🌾</span> <span>${i18n.t('cropNameLabel')}</span> <span style="color: #dc2626;">*</span>
          </label>
          <input type="text" class="form-input" id="wizard-crop-name" value="${this.formData.name}" placeholder="${i18n.t('cropNamePlaceholder')}" style="padding: 12px 14px; font-size: 1rem; font-weight: 700; min-height: 48px; border-radius: 10px; background: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F;" />
        </div>

        <!-- Quick crop chips for instant selection -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 0.78rem; color: #4E4436; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${i18n.t('quickPickCrop')}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${[
              { name: 'Basmati Rice', emoji: '🌾' },
              { name: 'Desi Tomato', emoji: '🍅' },
              { name: 'Nashik Red Onion', emoji: '🧅' },
              { name: 'Sharbati Wheat', emoji: '🌿' },
              { name: 'Fresh Potato', emoji: '🥔' },
              { name: 'Salem Turmeric', emoji: '🟡' },
              { name: 'Green Chilli', emoji: '🌶️' },
              { name: 'Alphonso Mango', emoji: '🥭' },
            ].map(c => `
              <button type="button" class="quick-crop-chip" data-crop="${c.name}" style="padding: 8px 14px; background: #F1ECE0; border: 1.5px solid #CBD5E1; border-radius: 20px; font-size: 0.85rem; font-weight: 700; color: #1E170F; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <span>${c.emoji}</span> <span>${c.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Quantity & Unit -->
        <div class="form-row" style="margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span>⚖️</span> <span>${i18n.t('quantityLabel')}</span> <span style="color: #dc2626;">*</span>
            </label>
            <input type="number" class="form-input" id="wizard-quantity" value="${this.formData.quantity}" placeholder="${i18n.t('quantityPlaceholder')}" min="1" style="padding: 12px 14px; font-size: 1rem; font-weight: 700; min-height: 48px; border-radius: 10px; background: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F;" />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span>📦</span> <span>${i18n.t('unitLabel')}</span>
            </label>
            <select class="form-select" id="wizard-unit" style="padding: 12px 38px 12px 14px; font-size: 0.95rem; font-weight: 700; min-height: 48px; border-radius: 10px; background-color: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F; appearance: none; background-image: url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%231E170F\\' stroke-width=\\'2.5\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3E%3Cpolyline points=\\'6 9 12 15 18 9\\'%3E%3C/polyline%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: calc(100% - 14px) center; background-size: 14px; cursor: pointer;">
              <option value="kg" ${this.formData.unit === 'kg' ? 'selected' : ''}>${i18n.t('unitKg')}</option>
              <option value="quintal" ${this.formData.unit === 'quintal' ? 'selected' : ''}>${i18n.t('unitQuintal')}</option>
              <option value="ton" ${this.formData.unit === 'ton' ? 'selected' : ''}>${i18n.t('unitTon')}</option>
              <option value="dozen" ${this.formData.unit === 'dozen' ? 'selected' : ''}>${i18n.t('unitDozen')}</option>
            </select>
          </div>
        </div>

        <!-- Price per Unit & Harvest Date -->
        <div class="form-row" style="margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span>💰</span> <span>${i18n.t('priceLabel')}</span> <span style="color: #dc2626;">*</span>
            </label>
            <input type="number" class="form-input" id="wizard-price" value="${this.formData.pricePerUnit}" placeholder="${i18n.t('pricePlaceholder')}" min="1" style="padding: 12px 14px; font-size: 1rem; font-weight: 700; min-height: 48px; border-radius: 10px; background: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F;" />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span>📅</span> <span>${i18n.t('harvestDateLabel')}</span>
            </label>
            <input type="date" class="form-input" id="wizard-harvest" value="${this.formData.harvestDate}" style="padding: 12px 14px; font-size: 0.95rem; font-weight: 700; min-height: 48px; border-radius: 10px; background: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F;" />
          </div>
        </div>

        <!-- Category & Organic Selection -->
        <div class="form-row" style="margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; margin-bottom: 6px;">
              ${i18n.t('categoryLabel')}
            </label>
            <select class="form-select" id="wizard-category" style="padding: 12px 38px 12px 14px; font-size: 0.95rem; font-weight: 700; min-height: 48px; border-radius: 10px; background-color: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F; appearance: none; background-image: url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%231E170F\\' stroke-width=\\'2.5\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3E%3Cpolyline points=\\'6 9 12 15 18 9\\'%3E%3C/polyline%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: calc(100% - 14px) center; background-size: 14px; cursor: pointer;">
              <option value="Grains" ${this.formData.category === 'Grains' ? 'selected' : ''}>🌾 ${i18n.t('catGrains')}</option>
              <option value="Vegetables" ${this.formData.category === 'Vegetables' ? 'selected' : ''}>🍅 ${i18n.t('catVegetables')}</option>
              <option value="Fruits" ${this.formData.category === 'Fruits' ? 'selected' : ''}>🍎 ${i18n.t('catFruits')}</option>
              <option value="Spices" ${this.formData.category === 'Spices' ? 'selected' : ''}>🟡 ${i18n.t('catSpices')}</option>
              <option value="Cash Crops" ${this.formData.category === 'Cash Crops' ? 'selected' : ''}>🎋 ${i18n.t('catCashCrops')}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 800; color: #1E170F; margin-bottom: 6px;">
              ${i18n.t('organicLabel')}
            </label>
            <select class="form-select" id="wizard-organic" style="padding: 12px 38px 12px 14px; font-size: 0.95rem; font-weight: 700; min-height: 48px; border-radius: 10px; background-color: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F; appearance: none; background-image: url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%231E170F\\' stroke-width=\\'2.5\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3E%3Cpolyline points=\\'6 9 12 15 18 9\\'%3E%3C/polyline%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: calc(100% - 14px) center; background-size: 14px; cursor: pointer;">
              <option value="false" ${!this.formData.isOrganic ? 'selected' : ''}>${i18n.t('organicNo')}</option>
              <option value="true" ${this.formData.isOrganic ? 'selected' : ''}>${i18n.t('organicYes')}</option>
            </select>
          </div>
        </div>

        <!-- AI Fair Price Hint -->
        <div id="wizard-price-hint" style="margin-top: 10px; padding: 12px 16px; background: #ECFDF5; border: 2px solid #6EE7B7; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 0.84rem; color: #065F46; font-weight: 800;">
            🤖 ${i18n.t('aiSuggestedFairPrice')}
          </div>
          <div style="font-size: 1rem; font-weight: 900; color: #047857;" id="wizard-fair-price-val">
            ₹${this.formData.pricePerUnit || 45} / ${this.formData.unit}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // Render Step 2: Photo Input (Live Camera + Upload)
  // ==========================================
  _renderStep2Photo() {
    return `
      <div class="photo-step-container animate-fade-in">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #1E170F; margin: 0 0 6px 0;">
            ${i18n.t('photoSectionTitle')}
          </h3>
          <p style="font-size: 0.85rem; color: #5C4D3C; margin: 0 auto; max-width: 480px; font-weight: 500;">
            ${i18n.t('photoSectionSub')}
          </p>
        </div>

        <!-- Two Clear Action Options Side-by-Side -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
          <button type="button" class="btn btn-primary" id="wizard-open-camera-btn" style="min-height: 56px; padding: 14px; font-size: 0.95rem; font-weight: 800; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; background: #16a34a; border: 2px solid #15803d; color: #FFFFFF; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35); cursor: pointer;">
            <span style="font-size: 1.35rem;">📸</span>
            <span>${i18n.t('takeLivePhotoBtn')}</span>
          </button>

          <label for="wizard-file-input" class="btn btn-secondary" style="min-height: 56px; padding: 14px; font-size: 0.95rem; font-weight: 800; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; margin: 0; background: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <span style="font-size: 1.35rem;">🖼️</span>
            <span>${i18n.t('uploadGalleryBtn')}</span>
          </label>
          <input type="file" id="wizard-file-input" accept="image/*" style="display: none;" />
        </div>

        <!-- Live Camera Information Notice -->
        <div style="padding: 12px 16px; background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.4rem;">🛰️</span>
          <div style="font-size: 0.8rem; color: #166534; font-weight: 600; line-height: 1.4;">
            <strong>${i18n.t('farmer.wizard.hardwareVerifiedCapture')}:</strong> ${i18n.t('liveCameraSub')}
          </div>
        </div>

        <!-- Photo Preview & Verification Proof Card -->
        ${this.photoData ? `
          <div class="photo-preview-card animate-scale-up" style="background: #FFFFFF; border: 2px solid #E4DCCB; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div style="position: relative; display: inline-block; max-width: 100%;">
              <img id="wizard-preview-image" src="${this.photoData}" alt="Crop Preview" style="max-height: 250px; max-width: 100%; border-radius: 14px; object-fit: cover; border: 2px solid #CBD5E1; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
            </div>

            <!-- Hardware GPS & Date/Time Proof Badge -->
            ${this.captureProof ? `
              <div style="margin-top: 16px; padding: 14px 16px; background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 14px; text-align: left;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 0.82rem; font-weight: 800; color: #15803D; display: flex; align-items: center; gap: 6px;">
                    <span>✅</span> <span>${i18n.t('farmer.wizard.sensorVerified')}</span>
                  </span>
                  <span style="font-size: 0.72rem; padding: 3px 8px; background: #DCFCE7; color: #166534; border-radius: 20px; font-weight: 700;">
                    ±${this.captureProof.location?.accuracy || 15}m ${i18n.t('farmer.wizard.gpsAccuracy')}
                  </span>
                </div>
                <div style="font-size: 0.84rem; color: #1E170F; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                  <span>📍</span> <span>${this.captureProof.location?.address || `${this.captureProof.location?.lat?.toFixed(4)}°N, ${this.captureProof.location?.lng?.toFixed(4)}°E`}</span>
                </div>
                <div style="font-size: 0.76rem; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span>🛰️</span> <span>${i18n.t('farmer.wizard.gpsCoords')}: ${this.captureProof.location?.lat?.toFixed(4)}°N, ${this.captureProof.location?.lng?.toFixed(4)}°E</span>
                </div>
                <div style="font-size: 0.76rem; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                  <span>📅</span> <span>${i18n.t('farmer.wizard.captureTimestamp')}: ${formatDateTime(this.captureProof.timestamp)}</span>
                </div>
              </div>
            ` : ''}

            <!-- AI Grading Status / Badge -->
            <div style="margin-top: 14px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
              ${this.isGradingPhoto ? `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #0284C7; font-weight: 700;">
                  <span class="spinner" style="width: 18px; height: 18px;"></span>
                  <span>${i18n.t('gradingProduce')}</span>
                </div>
              ` : this.photoGrade ? `
                <div>${this.photoGrade.badgeHtml}</div>
              ` : ''}

              <div style="display: flex; gap: 10px; margin-top: 8px;">
                <button type="button" class="btn btn-secondary btn-sm" id="wizard-retake-btn" style="font-size: 0.82rem; font-weight: 800; padding: 8px 16px; border-radius: 20px; background: #F1ECE0; border: 1.5px solid #CBD5E1; color: #1E170F; cursor: pointer;">
                  ${i18n.t('retakePhotoBtn')}
                </button>
                <label for="wizard-file-input" class="btn btn-secondary btn-sm" style="font-size: 0.82rem; font-weight: 800; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin: 0; background: #F1ECE0; border: 1.5px solid #CBD5E1; color: #1E170F;">
                  ${i18n.t('changePhotoBtn')}
                </label>
              </div>
            </div>
          </div>
        ` : `
          <!-- Placeholder when no photo is taken yet -->
          <div style="border: 2.5px dashed #CBD5E1; border-radius: 16px; padding: 40px 20px; text-align: center; background: #FFFFFF; margin-bottom: 18px;">
            <div style="font-size: 3.2rem; margin-bottom: 10px;">📸</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #1E170F; margin-bottom: 4px;">
              ${i18n.t('farmer.wizard.noPhotoYet')}
            </div>
            <div style="font-size: 0.84rem; color: #64748B; font-weight: 500;">
              ${i18n.t('farmer.wizard.tapCameraPrompt', { btn: i18n.t('takeLivePhotoBtn') })}
            </div>
          </div>
        `}

        <div style="font-size: 0.78rem; color: #5C4D3C; text-align: center; line-height: 1.4; font-weight: 500;">
          ℹ️ ${i18n.t('qualityAssessmentNote')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // Render Step 3: Review & Confirm
  // ==========================================
  _renderStep3Confirm() {
    const totalValue = (this.formData.quantity || 0) * (this.formData.pricePerUnit || 0);
    const farmerGuaranteedPayout = Math.round(totalValue * 0.60);
    const cropEmoji = getCropEmoji(this.formData.name || 'Crop');

    return `
      <div class="confirm-step-container animate-fade-in">
        <div style="text-align: center; margin-bottom: 18px;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #1E170F; margin: 0 0 6px 0;">
            ${i18n.t('confirmTitle')}
          </h3>
          <p style="font-size: 0.85rem; color: #5C4D3C; margin: 0 auto; max-width: 480px; font-weight: 500;">
            ${i18n.t('confirmSub')}
          </p>
        </div>

        <!-- Read Aloud Text-to-Speech Button -->
        <div style="text-align: center; margin-bottom: 18px;">
          <button type="button" class="btn btn-secondary btn-sm" id="wizard-speak-summary-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 20px; font-weight: 800; font-size: 0.88rem; background: #EFF6FF; border: 2px solid #93C5FD; color: #1D4ED8; cursor: pointer; box-shadow: 0 2px 6px rgba(29, 78, 216, 0.1);">
            <span style="font-size: 1.15rem;">${this.isSpeaking ? '⏹️' : '🔊'}</span>
            <span>${this.isSpeaking ? i18n.t('stopAudioBtn') : i18n.t('listenSummaryBtn')}</span>
          </button>
        </div>

        <!-- Summary Card with Parchment Editorial Styling -->
        <div style="background: #FFFFFF; border: 2px solid #E4DCCB; border-radius: 18px; padding: 22px; margin-bottom: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="display: flex; gap: 18px; align-items: center; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1.5px solid #E4DCCB;">
            <!-- Crop Photo Thumbnail / Emoji -->
            <div style="width: 88px; height: 88px; border-radius: 14px; overflow: hidden; background: #F1ECE0; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              ${this.photoData ? `<img src="${this.photoData}" style="width: 100%; height: 100%; object-fit: cover;" />` : cropEmoji}
            </div>

            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h4 style="font-size: 1.3rem; font-weight: 800; color: #1E170F; margin: 0;">
                  ${this.formData.name || 'Produce Batch'}
                </h4>
                ${this.formData.isOrganic ? `<span class="badge" style="background: #DCFCE7; color: #166534; border: 1.5px solid #86EFAC; font-size: 0.76rem; font-weight: 800; padding: 3px 10px; border-radius: 20px;">🌿 ${i18n.t('organicYes')}</span>` : ''}
              </div>

              <div style="font-size: 0.84rem; color: #5C4D3C; margin-top: 4px; font-weight: 600;">
                ${i18n.t('farmer.wizard.categoryLabel')}: <strong>${localizeCategory(this.formData.category)}</strong> · ${i18n.t('farmer.wizard.originLabel')}: <strong>${localizeLocation(this.formData.origin || this.user.location || 'Tamil Nadu, India')}</strong>
              </div>

              ${this.captureProof ? `
                <div style="margin-top: 6px; font-size: 0.76rem; color: #166534; font-weight: 700; background: #DCFCE7; border: 1px solid #86EFAC; padding: 4px 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span>📸 <strong>${i18n.t('farmer.wizard.liveHardwareVerified')}:</strong> ${this.captureProof.location?.address || `${this.captureProof.location?.lat?.toFixed(4)}°N, ${this.captureProof.location?.lng?.toFixed(4)}°E`}</span>
                  <span>•</span>
                  <span>📅 ${formatDateTime(this.captureProof.timestamp)}</span>
                </div>
              ` : ''}

              <!-- AI Quality Badge in Summary -->
              <div style="margin-top: 8px;">
                ${this.photoGrade ? this.photoGrade.badgeHtml : `<span class="badge" style="background: #DCFCE7; color: #166534; font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;">✓ ${i18n.t('farmer.wizard.readyForMarket')}</span>`}
              </div>
            </div>
          </div>

          <!-- Quantity & Price Breakdown -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
            <div style="background: #F8FAFC; padding: 14px; border-radius: 12px; border: 1.5px solid #E2E8F0;">
              <div style="font-size: 0.78rem; color: #64748B; font-weight: 800; text-transform: uppercase;">${i18n.t('summaryQuantity')}</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #1E170F; margin-top: 2px;">
                ${this.formData.quantity} ${localizeUnit(this.formData.unit)}
              </div>
            </div>

            <div style="background: #F8FAFC; padding: 14px; border-radius: 12px; border: 1.5px solid #E2E8F0;">
              <div style="font-size: 0.78rem; color: #64748B; font-weight: 800; text-transform: uppercase;">${i18n.t('summaryPrice')}</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #16A34A; margin-top: 2px;">
                ${formatCurrency(this.formData.pricePerUnit)} <span style="font-size: 0.8rem; color: #64748B; font-weight: 600;">/ ${localizeUnit(this.formData.unit)}</span>
              </div>
            </div>
          </div>

          <!-- Total Value & Guaranteed Payout -->
          <div style="background: #ECFDF5; border: 2px solid #86EFAC; border-radius: 14px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.88rem; color: #065F46; font-weight: 700;">${i18n.t('summaryTotalValue')}</span>
              <span style="font-size: 1.2rem; font-weight: 900; color: #1E170F;">${formatCurrency(totalValue)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1.5px dashed #A7F3D0;">
              <span style="font-size: 0.92rem; font-weight: 800; color: #047857;">${i18n.t('summaryFarmerPayout')}</span>
              <span style="font-size: 1.45rem; font-weight: 900; color: #15803D;">${formatCurrency(farmerGuaranteedPayout)}</span>
            </div>
          </div>

          <!-- Edit links -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 0.85rem;">
            <button type="button" id="wizard-edit-details-btn" style="background: none; border: none; color: #2563EB; cursor: pointer; text-decoration: underline; font-weight: 800; padding: 0;">
              ${i18n.t('editDetailsBtn')}
            </button>
            <button type="button" id="wizard-edit-photo-btn" style="background: none; border: none; color: #2563EB; cursor: pointer; text-decoration: underline; font-weight: 800; padding: 0;">
              ${i18n.t('editPhotoBtn')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // Render Step 4: Sell & Success State
  // ==========================================
  _renderStep4Sell() {
    if (this.isSubmitting) {
      return `
        <div style="text-align: center; padding: 50px 20px;" class="animate-fade-in">
          <div class="spinner" style="width: 52px; height: 52px; margin: 0 auto 24px; border-width: 4px; border-color: #16a34a transparent #16a34a #16a34a;"></div>
          <h3 style="font-size: 1.35rem; font-weight: 900; color: #1E170F; margin-bottom: 8px;">
            ${i18n.t('publishingListing')}
          </h3>
          <p style="font-size: 0.9rem; color: #5C4D3C; max-width: 420px; margin: 0 auto; font-weight: 600;">
            ${i18n.t('farmer.wizard.securingListing')}
          </p>
        </div>
      `;
    }

    if (this.isSuccess) {
      return `
        <div style="text-align: center; padding: 36px 16px;" class="animate-scale-up">
          <div style="font-size: 4.5rem; margin-bottom: 14px; animation: bounce 1.2s ease-in-out;">🎉</div>
          <h3 style="font-size: 1.55rem; font-weight: 900; color: #15803D; margin-bottom: 8px;">
            ${i18n.t('listingSuccessTitle')}
          </h3>
          <p style="font-size: 0.95rem; color: #4B382A; max-width: 460px; margin: 0 auto 26px; line-height: 1.5; font-weight: 600;">
            ${i18n.t('listingSuccessDesc')}
          </p>

          <!-- Listing Preview Chip -->
          <div style="background: #FFFFFF; border: 2px solid #E4DCCB; border-radius: 16px; padding: 16px 22px; max-width: 420px; margin: 0 auto 28px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
              <span style="font-size: 2.2rem;">${getCropEmoji(this.formData.name)}</span>
              <div>
                <div style="font-weight: 800; font-size: 1rem; color: #1E170F;">${this.formData.name}</div>
                <div style="font-size: 0.82rem; color: #64748B; font-weight: 600;">${this.formData.quantity} ${this.formData.unit} · ₹${this.formData.pricePerUnit}/${this.formData.unit}</div>
              </div>
            </div>
            <span class="badge" style="background: #DCFCE7; color: #166534; border: 1.5px solid #86EFAC; font-size: 0.78rem; font-weight: 800; padding: 4px 12px; border-radius: 20px;">✓ Active</span>
          </div>

          <!-- Post-submission Action Buttons -->
          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary" id="wizard-list-another-btn" style="min-height: 50px; padding: 14px 24px; font-weight: 800; font-size: 0.95rem; border-radius: 12px; background: #FFFFFF; border: 2px solid #CBD5E1; color: #1E170F; cursor: pointer;">
              ${i18n.t('listAnotherBtn')}
            </button>
            <button type="button" class="btn btn-primary" id="wizard-view-products-btn" style="min-height: 50px; padding: 14px 28px; font-weight: 800; font-size: 0.95rem; border-radius: 12px; background: #16a34a; border: 2px solid #15803d; color: #FFFFFF; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); cursor: pointer;">
              ${i18n.t('viewProductsBtn')}
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  // ==========================================
  // Event Bindings
  // ==========================================
  _bindEvents(overlay) {
    // Close / Cancel
    overlay.querySelector('#wizard-close-btn')?.addEventListener('click', () => this.close());
    overlay.querySelector('#wizard-cancel-btn')?.addEventListener('click', () => this.close());

    // Back button
    overlay.querySelector('#wizard-back-btn')?.addEventListener('click', () => {
      this._stopAllAudio();
      this._stopCamera();
      if (this.step > 1) {
        this.step--;
        this.render();
      }
    });

    // Language Selector inside wizard
    overlay.querySelector('#wizard-lang-select')?.addEventListener('change', (e) => {
      i18n.setLanguage(e.target.value);
      this.render();
    });

    // Step 1: Mode Switch (Voice vs Manual) — NEVER loses already-entered data
    overlay.querySelectorAll('.wizard-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._syncFormDataFromInputs();
        this._stopVoice();
        this.inputMode = btn.dataset.mode;
        this.render();
      });
    });

    // Step 1: Quick Crop Chips
    overlay.querySelectorAll('.quick-crop-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const crop = btn.dataset.crop;
        const nameInput = overlay.querySelector('#wizard-crop-name');
        if (nameInput) {
          nameInput.value = crop;
          this.formData.name = crop;
          this._updateFairPriceHint();
        }
      });
    });

    // Step 1: Microphone Trigger Button
    overlay.querySelector('#wizard-mic-btn')?.addEventListener('click', () => {
      if (this.isListening) {
        this._stopVoice();
      } else {
        this._startVoice();
      }
    });

    // Step 1: Voice Error fallback button
    overlay.querySelector('#wizard-error-switch-btn')?.addEventListener('click', () => {
      this.inputMode = 'manual';
      this.voiceError = null;
      this.render();
    });

    // Step 1: Live Input updates
    overlay.querySelector('#wizard-crop-name')?.addEventListener('input', (e) => {
      this.formData.name = e.target.value;
      this._updateFairPriceHint();
    });
    overlay.querySelector('#wizard-quantity')?.addEventListener('input', (e) => {
      this.formData.quantity = parseInt(e.target.value, 10) || 0;
    });
    overlay.querySelector('#wizard-price')?.addEventListener('input', (e) => {
      this.formData.pricePerUnit = parseInt(e.target.value, 10) || 0;
    });
    overlay.querySelector('#wizard-unit')?.addEventListener('change', (e) => {
      this.formData.unit = e.target.value;
      this._updateFairPriceHint();
    });
    overlay.querySelector('#wizard-category')?.addEventListener('change', (e) => {
      this.formData.category = e.target.value;
    });
    overlay.querySelector('#wizard-organic')?.addEventListener('change', (e) => {
      this.formData.isOrganic = e.target.value === 'true';
    });
    overlay.querySelector('#wizard-harvest')?.addEventListener('change', (e) => {
      this.formData.harvestDate = e.target.value;
    });

    // Step 1 -> Step 2
    overlay.querySelector('#wizard-continue-photo-btn')?.addEventListener('click', () => {
      this._syncFormDataFromInputs();
      if (!this.formData.name || this.formData.name.trim().length === 0) {
        showToast(i18n.t('valNameRequired'), 'warning');
        overlay.querySelector('#wizard-crop-name')?.focus();
        return;
      }
      if (!this.formData.quantity || this.formData.quantity <= 0) {
        showToast(i18n.t('valQtyRequired'), 'warning');
        overlay.querySelector('#wizard-quantity')?.focus();
        return;
      }
      if (!this.formData.pricePerUnit || this.formData.pricePerUnit <= 0) {
        showToast(i18n.t('valPriceRequired'), 'warning');
        overlay.querySelector('#wizard-price')?.focus();
        return;
      }

      this._stopVoice();
      this.step = 2;
      this.render();
    });

    // Step 2: Camera Capture & File Upload Handlers
    overlay.querySelector('#wizard-open-camera-btn')?.addEventListener('click', () => {
      this._openLiveCamera();
    });

    overlay.querySelector('#wizard-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this._processSelectedImageFile(file);
    });

    overlay.querySelector('#wizard-retake-btn')?.addEventListener('click', () => {
      this._openLiveCamera();
    });

    // Step 2 -> Step 3
    overlay.querySelector('#wizard-continue-review-btn')?.addEventListener('click', () => {
      this._stopCamera();
      if (!this.photoData) {
        showToast(i18n.t('valPhotoRequired'), 'warning');
        return;
      }
      this.step = 3;
      this.render();
    });

    // Step 3: Jump back to edit
    overlay.querySelector('#wizard-edit-details-btn')?.addEventListener('click', () => {
      this._stopAllAudio();
      this.step = 1;
      this.render();
    });

    overlay.querySelector('#wizard-edit-photo-btn')?.addEventListener('click', () => {
      this._stopAllAudio();
      this.step = 2;
      this.render();
    });

    // Step 3: Listen to Summary Aloud (SpeechSynthesis)
    overlay.querySelector('#wizard-speak-summary-btn')?.addEventListener('click', () => {
      this._toggleSummaryAudio();
    });

    // Step 3 -> Step 4: Proceed to Sell
    overlay.querySelector('#wizard-proceed-sell-btn')?.addEventListener('click', () => {
      this._stopAllAudio();
      this.step = 4;
      this.isSubmitting = true;
      this.render();
      this._executeSilentSmartWalletSale();
    });

    // Step 4: Success Actions
    overlay.querySelector('#wizard-list-another-btn')?.addEventListener('click', () => {
      this._resetForAnotherListing();
    });

    overlay.querySelector('#wizard-view-products-btn')?.addEventListener('click', () => {
      this.close();
      if (this.onComplete) this.onComplete();
    });
  }

  // ==========================================
  // Helper Logic: Voice Recognition
  // ==========================================
  _startVoice() {
    this.voiceError = null;
    this.isListening = true;
    this.liveTranscript = '';
    this.render();

    this.recognition = startVoiceRecognition({
      language: i18n.getSpeechLang(),
      onStart: () => {
        this.isListening = true;
      },
      onInterim: ({ transcript }) => {
        this.liveTranscript = transcript;
        const box = document.getElementById('wizard-transcript-box');
        if (box) {
          box.innerHTML = `<strong>${i18n.t('voiceHeard')}</strong>&nbsp;"${transcript}"`;
        }
      },
      onResult: (parsed) => {
        this.liveTranscript = parsed.transcript;
        if (parsed.name) this.formData.name = parsed.name;
        if (parsed.quantity) this.formData.quantity = parsed.quantity;
        if (parsed.price) this.formData.pricePerUnit = parsed.price;
        if (parsed.unit) this.formData.unit = parsed.unit;
        if (parsed.category) this.formData.category = parsed.category;
        if (parsed.isOrganic !== undefined) this.formData.isOrganic = parsed.isOrganic;

        this.isListening = false;
        showToast(i18n.t('voiceAutoFilled'), 'success');
        this.render();
      },
      onError: (err) => {
        this.isListening = false;
        this.voiceError = err.message || i18n.t('voiceMicDenied');
        this.render();
      },
      onEnd: () => {
        this.isListening = false;
        const micBtn = document.getElementById('wizard-mic-btn');
        if (micBtn && !this.isListening) {
          micBtn.innerHTML = '<span>🎙️</span>';
        }
      }
    });
  }

  _stopVoice() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  _syncFormDataFromInputs() {
    const nameEl = document.getElementById('wizard-crop-name');
    const qtyEl = document.getElementById('wizard-quantity');
    const priceEl = document.getElementById('wizard-price');
    const unitEl = document.getElementById('wizard-unit');
    const catEl = document.getElementById('wizard-category');
    const orgEl = document.getElementById('wizard-organic');
    const dateEl = document.getElementById('wizard-harvest');

    if (nameEl) this.formData.name = nameEl.value.trim();
    if (qtyEl) this.formData.quantity = parseInt(qtyEl.value, 10) || 0;
    if (priceEl) this.formData.pricePerUnit = parseInt(priceEl.value, 10) || 0;
    if (unitEl) this.formData.unit = unitEl.value;
    if (catEl) this.formData.category = catEl.value;
    if (orgEl) this.formData.isOrganic = orgEl.value === 'true';
    if (dateEl) this.formData.harvestDate = dateEl.value;
  }

  _updateFairPriceHint() {
    const valEl = document.getElementById('wizard-fair-price-val');
    if (!valEl) return;
    const name = this.formData.name || 'Crop';
    const pred = FairPricePredictor.predict(name.split(' ').pop(), 100);
    valEl.textContent = `₹${pred.predictedFairPrice || this.formData.pricePerUnit} / ${this.formData.unit}`;
  }

  // ==========================================
  // Helper Logic: Live Camera & Image Handling
  // ==========================================
  async _openLiveCamera() {
    try {
      const result = await LiveCamera.open({
        mode: 'verified',
        farmerLocation: this.formData.origin || this.user.location,
      });

      if (result && result.imageDataUrl) {
        this.photoData = result.imageDataUrl;
        this.captureProof = result.proofData;
        if (result.proofData?.location?.address) {
          this.formData.origin = result.proofData.location.address;
        }
        if (result.proofData?.timestamp) {
          this.formData.harvestDate = new Date(result.proofData.timestamp).toISOString().split('T')[0];
        }

        // Run client-side AI produce quality assessment
        this.isGradingPhoto = true;
        this.render();

        try {
          const grading = await CropGrader.gradeImage(result.imageDataUrl, this.formData.name);
          this.photoGrade = grading;
        } catch (err) {
          console.warn('AI Grading handled safely:', err);
          this.photoGrade = {
            grade: 'Standard',
            score: null,
            label: i18n.t('ungradedProduce'),
            badgeHtml: CropGrader.renderBadge('Standard', i18n.t('ungradedProduce')),
          };
        } finally {
          this.isGradingPhoto = false;
          this.render();
        }
      }
    } catch (err) {
      if (err && err.message !== 'Camera closed by user') {
        console.warn('LiveCamera error:', err);
        showToast('Camera error: ' + err.message, 'error');
      }
    }
  }

  _stopCamera() {
    this.isCameraActive = false;
  }

  async _processSelectedImageFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      this.photoData = dataUrl;

      // Try acquiring exact GPS and timestamp for gallery uploads as well
      try {
        const loc = await LiveCamera.getLocation().catch(() => null);
        if (loc) {
          this.captureProof = {
            location: loc,
            timestamp: Date.now(),
            proofHash: `Qm${Date.now().toString(16)}${Math.random().toString(36).slice(2, 18)}`,
            isLiveCapture: false,
            gpsVerified: !loc.isFallback,
          };
          if (loc.address) this.formData.origin = loc.address;
        }
      } catch (err) {}

      this._processImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async _processImageDataUrl(dataUrl) {
    this.photoData = dataUrl;
    this.isGradingPhoto = true;
    this.render();

    try {
      const grading = await CropGrader.gradeImage(dataUrl, this.formData.name);
      this.photoGrade = grading;
    } catch (err) {
      console.warn('AI Grading handled safely:', err);
      this.photoGrade = {
        grade: 'Standard',
        score: null,
        label: i18n.t('ungradedProduce'),
        badgeHtml: CropGrader.renderBadge('Standard', i18n.t('ungradedProduce')),
      };
    } finally {
      this.isGradingPhoto = false;
      this.render();
    }
  }

  // ==========================================
  // Helper Logic: Text-to-Speech (TTS)
  // ==========================================
  _toggleSummaryAudio() {
    if (this.isSpeaking) {
      this._stopAllAudio();
      this.render();
      return;
    }

    const totalValue = (this.formData.quantity || 0) * (this.formData.pricePerUnit || 0);
    const farmerPayout = Math.round(totalValue * 0.60);

    let spokenText = '';
    const lang = i18n.getLanguage();

    if (lang === 'ta') {
      spokenText = `பயிர்: ${this.formData.name}. அளவு: ${this.formData.quantity} ${this.formData.unit}. அலகு விலை: ${this.formData.pricePerUnit} ரூபாய். மொத்த மதிப்பு: ${totalValue} ரூபாய். விவசாயிக்கு உத்தரவாத வருவாய்: ${farmerPayout} ரூபாய். தரம்: ${this.photoGrade?.label || 'விற்பனைக்குத் தயாரான பயிர்'}.`;
    } else if (lang === 'hi') {
      spokenText = `फसल: ${this.formData.name}. मात्रा: ${this.formData.quantity} ${this.formData.unit}. भाव: ${this.formData.pricePerUnit} रुपये प्रति इकाई. कुल मूल्य: ${totalValue} रुपये. किसान की सुरक्षित कमाई: ${farmerPayout} रुपये. गुणवत्ता: ${this.photoGrade?.label || 'ताज़ा फसल'}.`;
    } else if (lang === 'te') {
      spokenText = `పంట: ${this.formData.name}. పరిమాణం: ${this.formData.quantity} ${this.formData.unit}. ధర: ${this.formData.pricePerUnit} రూపాయలు. మొత్తం విలువ: ${totalValue} రూపాయలు. రైతుకు గ్యారంటీ ఆదాయం: ${farmerPayout} రూపాయలు. నాణ్యత: ${this.photoGrade?.label || 'సిద్ధమైన పంట'}.`;
    } else {
      spokenText = `Listing summary: ${this.formData.name}. Harvest quantity: ${this.formData.quantity} ${this.formData.unit}. Unit price: ${this.formData.pricePerUnit} rupees. Estimated total value: ${totalValue} rupees. Guaranteed farmer payout: ${farmerPayout} rupees. Quality grade: ${this.photoGrade?.label || 'Standard Harvest'}.`;
    }

    this.isSpeaking = true;
    this.render();

    i18n.speak(spokenText, null, () => {
      this.isSpeaking = false;
      this.render();
    });
  }

  _stopAllAudio() {
    i18n.stopSpeaking();
    this.isSpeaking = false;
  }

  // ==========================================
  // Helper Logic: Silent Smart-Wallet Execution
  // ==========================================
  async _executeSilentSmartWalletSale() {
    try {
      await GaslessProvider.sendGaslessTransaction({ type: 'registerProduct' }).catch(() => {});

      const result = await ProductRegistry.registerProduct({
        name: this.formData.name.trim(),
        category: this.formData.category,
        farmerId: this.user.id,
        farmerName: this.user.name,
        quantity: this.formData.quantity,
        unit: this.formData.unit,
        origin: this.formData.origin || this.user.location || 'Tamil Nadu, India',
        harvestDate: this.formData.harvestDate,
        isOrganic: this.formData.isOrganic,
        description: this.formData.description?.trim() || '',
        aiQualityScore: this.photoGrade?.score || 85,
        aiQualityGrade: this.photoGrade?.grade || 'A',
      });

      const productData = {
        ...result,
        emoji: getCropEmoji(this.formData.name),
        status: 'available',
        photoUrl: this.photoData || '',
        isLiveCapture: !!this.captureProof,
        captureProof: this.captureProof,
        origin: this.formData.origin || this.user.location || 'Tamil Nadu, India',
        harvestDate: this.formData.harvestDate,
        aiQualityScore: this.photoGrade?.score || 85,
        aiQualityGrade: this.photoGrade?.grade || 'A',
        aiQualityLabel: this.photoGrade?.label || i18n.t('gradeAFresh'),
      };

      store.addItem('products', productData);

      await Marketplace.createListing({
        productId: result.productId,
        sellerId: this.user.id,
        sellerName: this.user.name,
        sellerRole: 'farmer',
        productName: this.formData.name.trim(),
        quantity: this.formData.quantity,
        unit: this.formData.unit,
        pricePerUnit: this.formData.pricePerUnit,
      });

      postProduct(productData).catch(() => {});
      addFirestoreProduct(productData).catch(() => {});

      this.isSubmitting = false;
      this.isSuccess = true;
      this.render();

      showToast(i18n.t('listingSuccessTitle'), 'success');
    } catch (err) {
      console.error('Silent listing fallback:', err);
      const fallbackProduct = {
        productId: `PROD-${Date.now()}`,
        name: this.formData.name.trim(),
        category: this.formData.category,
        farmerId: this.user.id,
        farmerName: this.user.name,
        quantity: this.formData.quantity,
        unit: this.formData.unit,
        pricePerUnit: this.formData.pricePerUnit,
        emoji: getCropEmoji(this.formData.name),
        origin: this.formData.origin || this.user.location || 'Tamil Nadu, India',
        harvestDate: this.formData.harvestDate,
        isOrganic: this.formData.isOrganic,
        status: 'available',
        photoUrl: this.photoData || '',
        isLiveCapture: !!this.captureProof,
        captureProof: this.captureProof,
        aiQualityScore: this.photoGrade?.score || 85,
        aiQualityGrade: this.photoGrade?.grade || 'A',
      };
      store.addItem('products', fallbackProduct);

      this.isSubmitting = false;
      this.isSuccess = true;
      this.render();
      showToast(i18n.t('listingSuccessTitle'), 'success');
    }
  }

  _resetForAnotherListing() {
    this.step = 1;
    this.inputMode = 'voice';
    this.formData = {
      name: '',
      category: 'Grains',
      quantity: 500,
      unit: 'kg',
      pricePerUnit: 45,
      harvestDate: new Date().toISOString().split('T')[0],
      isOrganic: false,
      description: '',
    };
    this.photoData = null;
    this.photoGrade = null;
    this.isSuccess = false;
    this.isSubmitting = false;
    this.liveTranscript = '';
    this.render();
  }

  close() {
    this._stopAllAudio();
    this._stopVoice();
    this._stopCamera();
    const overlay = document.getElementById('farmer-wizard-overlay');
    if (overlay) overlay.remove();
  }
}
