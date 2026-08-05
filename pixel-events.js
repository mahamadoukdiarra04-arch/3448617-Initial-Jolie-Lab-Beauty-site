(function () {
  function storageFor(scope) {
    try {
      return scope === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  function wasTracked(key, scope) {
    const storage = storageFor(scope);
    if (!storage) return false;
    return storage.getItem(key) === "1";
  }

  function markTracked(key, scope) {
    const storage = storageFor(scope);
    if (!storage) return;
    storage.setItem(key, "1");
  }

  function track(eventName, payload = {}) {
    if (typeof window.fbq !== "function") return false;
    window.fbq("track", eventName, payload);
    return true;
  }

  function trackOnce(eventName, payload = {}, onceKey, scope = "session") {
    const key = `joliePixel:${eventName}:${onceKey || JSON.stringify(payload)}`;
    if (wasTracked(key, scope)) return false;
    const tracked = track(eventName, payload);
    if (tracked) markTracked(key, scope);
    return tracked;
  }

  function contentId(product, variant) {
    const base = String(product?.id ?? product?.slug ?? product?.name ?? "product");
    return variant?.id ? `${base}:${variant.id}` : base;
  }

  window.JoliePixel = {
    track,
    trackOnce,
    contentId,
  };
})();
