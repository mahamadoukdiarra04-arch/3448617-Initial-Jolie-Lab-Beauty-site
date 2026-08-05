const ADMIN_HOME_URL = "/admin/index.php";
const ADMIN_ORDERS_URL = "/admin/orders.php?status=new";
const LOGO_URL = "/assets/brand/logo.png";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const title = "Nouvelle commande Jolie Lab Beauty";
  const options = {
    body: "Une nouvelle commande vient d'arriver dans l'espace admin.",
    icon: LOGO_URL,
    badge: LOGO_URL,
    tag: "jolie-lab-new-order",
    renotify: true,
    data: { url: ADMIN_ORDERS_URL },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || ADMIN_HOME_URL, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes("/admin/"));
      if (existing) {
        existing.focus();
        return existing.navigate(targetUrl);
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
