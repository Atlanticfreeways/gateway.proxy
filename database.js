// Database Integration - Firebase Firestore wrapper
class DatabaseService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        this.initializeFirebase();
        this.setupOfflineSync();
    }

    // Initialize Firebase (placeholder - requires actual config)
    initializeFirebase() {
        // Firebase config would go here
        this.firebaseConfig = {
            apiKey: "your-api-key",
            authDomain: "gateways-proxy.firebaseapp.com",
            projectId: "gateways-proxy",
            storageBucket: "gateways-proxy.appspot.com"
        };
        
        // For now, simulate Firebase connection
        this.connected = false;
        console.log('Database: Using localStorage fallback');
    }

    // Setup offline synchronization
    setupOfflineSync() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Generic CRUD operations
    async create(collection, data) {
        const id = Date.now().toString();
        const record = { id, ...data, createdAt: new Date().toISOString() };
        
        if (this.isOnline && this.connected) {
            // Firebase create
            return this.firebaseCreate(collection, record);
        } else {
            // Local storage fallback
            return this.localCreate(collection, record);
        }
    }

    async read(collection, id = null) {
        if (this.isOnline && this.connected) {
            return this.firebaseRead(collection, id);
        } else {
            return this.localRead(collection, id);
        }
    }

    async update(collection, id, data) {
        const record = { ...data, updatedAt: new Date().toISOString() };
        
        if (this.isOnline && this.connected) {
            return this.firebaseUpdate(collection, id, record);
        } else {
            return this.localUpdate(collection, id, record);
        }
    }

    async delete(collection, id) {
        if (this.isOnline && this.connected) {
            return this.firebaseDelete(collection, id);
        } else {
            return this.localDelete(collection, id);
        }
    }

    // Local storage operations
    localCreate(collection, record) {
        const data = JSON.parse(localStorage.getItem(collection) || '[]');
        data.push(record);
        localStorage.setItem(collection, JSON.stringify(data));
        this.queueForSync('create', collection, record);
        return record;
    }

    localRead(collection, id) {
        const data = JSON.parse(localStorage.getItem(collection) || '[]');
        return id ? data.find(item => item.id === id) : data;
    }

    localUpdate(collection, id, record) {
        const data = JSON.parse(localStorage.getItem(collection) || '[]');
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...record };
            localStorage.setItem(collection, JSON.stringify(data));
            this.queueForSync('update', collection, data[index]);
            return data[index];
        }
        return null;
    }

    localDelete(collection, id) {
        const data = JSON.parse(localStorage.getItem(collection) || '[]');
        const filtered = data.filter(item => item.id !== id);
        localStorage.setItem(collection, JSON.stringify(filtered));
        this.queueForSync('delete', collection, { id });
        return true;
    }

    // Firebase operations (placeholder)
    async firebaseCreate(collection, record) {
        // Actual Firebase implementation would go here
        console.log(`Firebase CREATE: ${collection}`, record);
        return record;
    }

    async firebaseRead(collection, id) {
        console.log(`Firebase READ: ${collection}`, id);
        return this.localRead(collection, id);
    }

    async firebaseUpdate(collection, id, record) {
        console.log(`Firebase UPDATE: ${collection}/${id}`, record);
        return record;
    }

    async firebaseDelete(collection, id) {
        console.log(`Firebase DELETE: ${collection}/${id}`);
        return true;
    }

    // Sync queue management
    queueForSync(operation, collection, data) {
        if (!this.isOnline) {
            this.syncQueue.push({ operation, collection, data, timestamp: Date.now() });
            localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        }
    }

    async syncOfflineData() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`Syncing ${this.syncQueue.length} offline operations...`);
        
        for (const item of this.syncQueue) {
            try {
                switch (item.operation) {
                    case 'create':
                        await this.firebaseCreate(item.collection, item.data);
                        break;
                    case 'update':
                        await this.firebaseUpdate(item.collection, item.data.id, item.data);
                        break;
                    case 'delete':
                        await this.firebaseDelete(item.collection, item.data.id);
                        break;
                }
            } catch (error) {
                console.error('Sync failed for item:', item, error);
            }
        }
        
        this.syncQueue = [];
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        console.log('Offline data synced successfully');
    }

    // Backup system
    async createBackup() {
        const collections = ['users', 'proxies', 'transactions', 'supportTickets', 'apiKeys'];
        const backup = {
            timestamp: new Date().toISOString(),
            data: {}
        };
        
        collections.forEach(collection => {
            backup.data[collection] = JSON.parse(localStorage.getItem(collection) || '[]');
        });
        
        const backupString = JSON.stringify(backup);
        const blob = new Blob([backupString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gateways-backup-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        return backup;
    }

    async restoreBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    Object.keys(backup.data).forEach(collection => {
                        localStorage.setItem(collection, JSON.stringify(backup.data[collection]));
                    });
                    
                    console.log('Backup restored successfully');
                    resolve(backup);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
}

// Initialize database service
const db = new DatabaseService();
window.DatabaseService = db;