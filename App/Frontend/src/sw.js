/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 04/06/2026
**/

self.addEventListener('push', event => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'EliasDH Portal', {
            body: data.body || '',
            icon: '/assets/media/images/logo.png',
            badge: '/assets/media/images/logo.png',
            data: { url: data.url || '/dashboard' }
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || '/dashboard';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            return clients.openWindow(url);
        })
    );
});