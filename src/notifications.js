/**
 * Notifications Module - Multi-channel notification system
 */

/**
 * Request notification permission
 * @returns {Promise<boolean>} True if permission granted
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('Failed to request notification permission:', e);
      return false;
    }
  }

  return false;
}

/**
 * Send notification via Notification API
 * @param {string} title - Notification title
 * @param {object} options - Notification options {body, icon, tag}
 */
function sendNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    new Notification(title, {
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🎨</text></svg>',
      ...options,
    });
    return true;
  } catch (e) {
    console.error('Failed to send notification:', e);
    return false;
  }
}

/**
 * Send notification with fallback chain
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 */
async function notifyCompletion(title, body) {
  // Try Notification API
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      sendNotification(title, { body });
      return;
    }

    if (Notification.permission !== 'denied') {
      const granted = await requestNotificationPermission();
      if (granted) {
        sendNotification(title, { body });
        return;
      }
    }
  }

  // Fallback: GM_notification (if available in Tampermonkey)
  if (typeof GM_notification !== 'undefined') {
    try {
      GM_notification({
        title,
        text: body,
        timeout: 5000,
      });
      return;
    } catch (e) {
      console.error('GM_notification failed:', e);
    }
  }

  // Fallback: document.title change + alert
  const originalTitle = document.title;
  document.title = `🎨 ${title}`;

  setTimeout(() => {
    document.title = originalTitle;
  }, 5000);

  alert(`${title}\n\n${body}`);
}

/**
 * Notify optimization complete
 * @param {object} result - Best result {brightness, contrast, saturation, dithering, score}
 */
async function notifyOptimizationComplete(result) {
  const title = '🎨 Auto Colour Match Complete';
  const body = `
Best settings found:
• Brightness: ${result.brightness}
• Contrast: ${result.contrast}
• Saturation: ${result.saturation}
• Dithering: ${result.dithering}
• Score: ${(result.score * 100).toFixed(2)}%
`.trim();

  await notifyCompletion(title, body);
}

/**
 * Notify optimization stopped
 * @param {object} result - Best result at stop time
 */
async function notifyOptimizationStopped(result) {
  const title = '⏹️ Auto Colour Match Stopped';
  const body = `
Current best settings:
• Brightness: ${result.brightness}
• Contrast: ${result.contrast}
• Saturation: ${result.saturation}
• Dithering: ${result.dithering}
• Score: ${(result.score * 100).toFixed(2)}%
`.trim();

  await notifyCompletion(title, body);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    requestNotificationPermission,
    sendNotification,
    notifyCompletion,
    notifyOptimizationComplete,
    notifyOptimizationStopped,
  };
}
