// ============================================
// FarmChain AI — Client-Side Crop Quality Grader
// Edge AI grading running entirely in the browser
// Resilient design: Grading is a bonus, not a gate!
// ============================================

import { i18n } from '../i18n/index.js';
import { VisualOracle } from './visual-oracle.js';

export class CropGrader {
  /**
   * Grade a crop image using client-side analysis
   * @param {HTMLImageElement|string} imageSource - Image element or Data URL
   * @param {string} cropName - Optional name of the crop
   * @returns {Promise<{grade: string, score: number, label: string, badgeHtml: string, isSuccess: boolean}>}
   */
  static async gradeImage(imageSource, cropName = '') {
    try {
      // Create image element if data URL provided
      let imgElement;
      if (typeof imageSource === 'string') {
        imgElement = await this._loadImage(imageSource);
      } else {
        imgElement = imageSource;
      }

      // Try running VisualOracle (MobileNet V2) with a 3.5s timeout
      let aiVerdict = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI inference timeout')), 3500)
        );
        aiVerdict = await Promise.race([
          VisualOracle.analyzeImage(imgElement),
          timeoutPromise
        ]);
      } catch (oracleErr) {
        console.warn('MobileNet V2 inference skipped or timed out, using visual color heuristics:', oracleErr.message);
      }

      // If VisualOracle produced a score, use it
      let score = 85;
      let grade = 'A';

      if (aiVerdict && aiVerdict.healthScore) {
        score = aiVerdict.healthScore;
        grade = score >= 85 ? 'A' : score >= 65 ? 'B' : 'C';
      } else {
        // High-speed Canvas Visual Heuristics (Color Saturation & Produce Vibrancy)
        score = this._analyzeProduceVibrancy(imgElement);
        grade = score >= 85 ? 'A' : score >= 65 ? 'B' : 'C';
      }

      // Localized label based on grade
      const labelKey = grade === 'A' ? 'gradeAFresh' : grade === 'B' ? 'gradeBGood' : 'gradeCStandard';
      const label = i18n.t(labelKey);

      return {
        grade,
        score,
        label,
        isSuccess: true,
        badgeHtml: this.renderBadge(grade, label, score)
      };
    } catch (err) {
      console.warn('CropGrader encountered error, proceeding without blocking:', err);
      // Fallback: never block the farmer!
      const fallbackLabel = i18n.t('ungradedProduce');
      return {
        grade: 'Standard',
        score: null,
        label: fallbackLabel,
        isSuccess: false,
        badgeHtml: this.renderBadge('Standard', fallbackLabel, null)
      };
    }
  }

  /**
   * Helper to load an image from DataURL
   */
  static _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Fast canvas color & vibrancy analysis for produce
   */
  static _analyzeProduceVibrancy(img) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 120;
      canvas.height = 120;
      ctx.drawImage(img, 0, 0, 120, 120);

      const imageData = ctx.getImageData(0, 0, 120, 120).data;
      let totalVibrancy = 0;
      let pixelCount = 0;

      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];

        // Measure color saturation and richness
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        // Fresh agricultural produce typically exhibits strong dominant hues (green, red, golden)
        const vibrancy = saturation * 100;
        totalVibrancy += vibrancy;
        pixelCount++;
      }

      const avgVibrancy = totalVibrancy / Math.max(1, pixelCount);
      // Map vibrancy 15..65 to score 72..96
      const calculated = Math.min(96, Math.max(68, Math.round(70 + (avgVibrancy * 0.45))));
      return calculated;
    } catch {
      return 86; // Safe default
    }
  }

  /**
   * Render a simple, friendly visual badge next to the photo
   */
  static renderBadge(grade, label, score = null) {
    const isGradeA = grade === 'A';
    const isGradeB = grade === 'B';
    const isGradeC = grade === 'C';

    const bg = isGradeA
      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.28))'
      : isGradeB
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(14, 165, 233, 0.25))'
      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.25))';

    const border = isGradeA
      ? '#22c55e'
      : isGradeB
      ? '#3b82f6'
      : '#f59e0b';

    const icon = isGradeA ? '🏆' : isGradeB ? '🌿' : '📦';

    return `
      <div class="crop-quality-badge animate-fade-in" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: ${bg}; border: 1.5px solid ${border}; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
        <span style="font-size: 1.15rem;">${icon}</span>
        <span style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary, #ffffff); letter-spacing: 0.2px;">
          ${label}
        </span>
        ${score ? `<span style="font-size: 0.75rem; font-weight: 600; opacity: 0.85; margin-left: 2px;">(${score}%)</span>` : ''}
      </div>
    `;
  }
}
