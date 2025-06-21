// User Notification System for Error Messages and Status Updates
// Provides non-intrusive feedback for API operations and errors

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.initializeContainer();
        console.log('🔔 Notification System initialized');
    }
    
    initializeContainer() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
        
        // Add CSS if not already present
        this.addNotificationStyles();
    }
    
    addNotificationStyles() {
        if (document.getElementById('notification-styles')) {
            return; // Styles already added
        }
        
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }
            
            .notification {
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                margin-bottom: 12px;
                padding: 16px 20px;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                border-left: 4px solid var(--primary-color);
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .notification.success {
                border-left-color: #10B981;
                background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
            }
            
            .notification.warning {
                border-left-color: #F59E0B;
                background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
            }
            
            .notification.error {
                border-left-color: #EF4444;
                background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%);
            }
            
            .notification.info {
                border-left-color: #3B82F6;
                background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 0.95rem;
                color: var(--text-primary);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .notification-icon {
                font-size: 1.1rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                color: var(--text-secondary);
                transition: all 0.2s ease;
                line-height: 1;
            }
            
            .notification-close:hover {
                background: rgba(0, 0, 0, 0.1);
                color: var(--text-primary);
            }
            
            .notification-message {
                color: var(--text-secondary);
                font-size: 0.875rem;
                line-height: 1.4;
                margin: 0;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: var(--primary-color);
                transition: width linear;
                border-radius: 0 0 12px 12px;
            }
            
            .notification.success .notification-progress {
                background: #10B981;
            }
            
            .notification.warning .notification-progress {
                background: #F59E0B;
            }
            
            .notification.error .notification-progress {
                background: #EF4444;
            }
            
            .notification.info .notification-progress {
                background: #3B82F6;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .notification {
                    margin-bottom: 8px;
                    padding: 12px 16px;
                }
                
                .notification-title {
                    font-size: 0.9rem;
                }
                
                .notification-message {
                    font-size: 0.8rem;
                }
            }
            
            /* Animation keyframes */
            @keyframes notificationSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes notificationSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    show(options) {
        const notification = this.createNotification(options);
        this.addNotification(notification);
        return notification.id;
    }
    
    createNotification(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            persistent = false,
            actions = []
        } = options;
        
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const notification = {
            id,
            type,
            title,
            message,
            duration,
            persistent,
            actions,
            element: null,
            timeout: null,
            startTime: Date.now()
        };
        
        notification.element = this.createNotificationElement(notification);
        
        return notification;
    }
    
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.setAttribute('data-id', notification.id);
        
        // Get icon for notification type
        const icon = this.getNotificationIcon(notification.type);
        
        element.innerHTML = `
            <div class="notification-header">
                <h4 class="notification-title">
                    <span class="notification-icon">${icon}</span>
                    ${notification.title}
                </h4>
                <button class="notification-close" onclick="window.notificationSystem.dismiss('${notification.id}')" aria-label="閉じる">
                    ✕
                </button>
            </div>
            ${notification.message ? `<p class="notification-message">${notification.message}</p>` : ''}
            ${!notification.persistent ? '<div class="notification-progress"></div>' : ''}
        `;
        
        // Add action buttons if provided
        if (notification.actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'notification-actions';
            actionsContainer.style.cssText = 'margin-top: 12px; display: flex; gap: 8px;';
            
            notification.actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.label;
                button.className = 'btn btn-sm';
                button.style.cssText = 'padding: 4px 12px; font-size: 0.8rem; border-radius: 6px;';
                button.onclick = () => {
                    action.handler();
                    this.dismiss(notification.id);
                };
                actionsContainer.appendChild(button);
            });
            
            element.appendChild(actionsContainer);
        }
        
        return element;
    }
    
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    }
    
    addNotification(notification) {
        // Remove oldest notifications if we have too many
        while (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotificationElement(oldest);
        }
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Add to DOM
        this.container.appendChild(notification.element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
        
        // Set auto-dismiss timer if not persistent
        if (!notification.persistent && notification.duration > 0) {
            this.startProgressBar(notification);
            
            notification.timeout = setTimeout(() => {
                this.dismiss(notification.id);
            }, notification.duration);
        }
        
        console.log(`🔔 Notification shown: ${notification.type} - ${notification.title}`);
    }
    
    startProgressBar(notification) {
        const progressBar = notification.element.querySelector('.notification-progress');
        if (!progressBar) return;
        
        // Animate progress bar
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${notification.duration}ms linear`;
        
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
    }
    
    dismiss(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index === -1) return;
        
        const notification = this.notifications[index];
        
        // Clear timeout if exists
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }
        
        // Remove from array
        this.notifications.splice(index, 1);
        
        // Remove from DOM with animation
        this.removeNotificationElement(notification);
        
        console.log(`🔔 Notification dismissed: ${notificationId}`);
    }
    
    removeNotificationElement(notification) {
        if (!notification.element || !notification.element.parentNode) {
            return;
        }
        
        notification.element.classList.add('hide');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        }, 300);
    }
    
    dismissAll() {
        const notificationIds = this.notifications.map(n => n.id);
        notificationIds.forEach(id => this.dismiss(id));
    }
    
    // Convenience methods for different notification types
    success(title, message, options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }
    
    warning(title, message, options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }
    
    error(title, message, options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 8000, // Longer duration for errors
            ...options
        });
    }
    
    info(title, message, options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }
    
    // Update existing notification
    update(notificationId, updates) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return false;
        
        // Update notification properties
        Object.assign(notification, updates);
        
        // Update DOM element
        if (updates.title || updates.message) {
            const titleElement = notification.element.querySelector('.notification-title');
            const messageElement = notification.element.querySelector('.notification-message');
            
            if (updates.title && titleElement) {
                const icon = titleElement.querySelector('.notification-icon');
                titleElement.innerHTML = `<span class="notification-icon">${icon ? icon.textContent : this.getNotificationIcon(notification.type)}</span>${updates.title}`;
            }
            
            if (updates.message && messageElement) {
                messageElement.textContent = updates.message;
            }
        }
        
        return true;
    }
    
    // Get current notifications
    getNotifications() {
        return [...this.notifications];
    }
    
    // Clear all notifications
    clear() {
        this.dismissAll();
    }
}

// Initialize global notification system
if (typeof window !== 'undefined') {
    window.notificationSystem = new NotificationSystem();
    
    // Global convenience function
    window.showNotification = function(options) {
        return window.notificationSystem.show(options);
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}