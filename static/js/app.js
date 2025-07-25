// Glicelivre - Main Application Logic
const GlicelivreApp = {
    // Storage key
    STORAGE_KEY: 'glicelivre-data',
    SETTINGS_KEY: 'glicelivre-settings',
    
    // Glucose level thresholds
    THRESHOLDS: {
        CRITICAL_LOW: 50,
        LOW: 70,
        NORMAL_MIN: 70,
        NORMAL_MAX: 140,
        HIGH: 180,
        CRITICAL_HIGH: 300
    },
    
    // Application state
    data: [],
    settings: {
        notifications: true,
        soundAlerts: true,
        reminderInterval: 120, // minutes
        theme: 'dark'
    },
    
    // PWA related
    deferredPrompt: null,
    
    init() {
        this.loadData();
        this.loadSettings();
        this.setupEventListeners();
        this.setupPWA();
        this.updateDateTime();
        this.renderHistory();
        this.updateStatistics();
        this.setupNotifications();
        
        // Update chart if data exists
        if (this.data.length > 0) {
            GlicelivreCharts.updateChart(this.data);
        }
    },
    
    loadData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.data = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = [];
        }
    },
    
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showAlert('Erro ao salvar dados. Verifique o espaço de armazenamento.', 'danger');
        }
    },
    
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.SETTINGS_KEY);
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },
    
    saveSettings() {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },
    
    setupEventListeners() {
        // Form submission
        document.getElementById('glucose-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });
        
        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // Clear history
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
        
        // Set reminder
        document.getElementById('set-reminder').addEventListener('click', () => {
            this.setReminder();
        });
        
        // Chart period buttons
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = parseInt(e.target.dataset.period);
                this.updateChartPeriod(period);
            });
        });
        
        // Install button
        document.getElementById('install-btn')?.addEventListener('click', () => {
            this.installPWA();
        });
    },
    
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
        
        // Handle PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('install-btn').classList.remove('d-none');
        });
        
        // Handle PWA installed
        window.addEventListener('appinstalled', () => {
            document.getElementById('install-btn').classList.add('d-none');
            this.showAlert('App instalado com sucesso!', 'success');
        });
    },
    
    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((result) => {
                if (result.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredPrompt = null;
            });
        }
    },
    
    setupNotifications() {
        if ('Notification' in window && this.settings.notifications) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    },
    
    updateDateTime() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        
        document.getElementById('date-input').value = date;
        document.getElementById('time-input').value = time;
    },
    
    handleFormSubmission() {
        const formData = this.collectFormData();
        
        if (this.validateFormData(formData)) {
            this.saveRecord(formData);
            this.clearForm();
            this.renderHistory();
            this.updateStatistics();
            GlicelivreCharts.updateChart(this.data);
            this.showGlucoseStatus(formData.glucose);
        }
    },
    
    collectFormData() {
        const getSymptoms = () => {
            const symptoms = [];
            const symptomInputs = ['symptom-thirst', 'symptom-hunger', 'symptom-tired', 
                                 'symptom-dizzy', 'symptom-nausea', 'symptom-headache'];
            
            symptomInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input.checked) {
                    symptoms.push(input.nextElementSibling.textContent);
                }
            });
            
            return symptoms;
        };
        
        return {
            date: document.getElementById('date-input').value,
            time: document.getElementById('time-input').value,
            glucose: parseInt(document.getElementById('glucose-input').value),
            insulinFast: parseFloat(document.getElementById('insulin-fast').value) || 0,
            insulinSlow: parseFloat(document.getElementById('insulin-slow').value) || 0,
            mealContext: document.getElementById('meal-context').value,
            foodNotes: document.getElementById('food-notes').value.trim(),
            symptoms: getSymptoms(),
            notes: document.getElementById('notes').value.trim(),
            timestamp: new Date().toISOString()
        };
    },
    
    validateFormData(data) {
        const errors = [];
        
        if (!data.date) errors.push('Data é obrigatória');
        if (!data.time) errors.push('Hora é obrigatória');
        if (!data.glucose || data.glucose < 30 || data.glucose > 500) {
            errors.push('Glicemia deve estar entre 30 e 500 mg/dL');
        }
        
        if (errors.length > 0) {
            this.showAlert(errors.join('<br>'), 'danger');
            return false;
        }
        
        return true;
    },
    
    saveRecord(data) {
        const record = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString()
        };
        
        this.data.unshift(record);
        this.saveData();
        
        this.showAlert('Registro salvo com sucesso!', 'success');
    },
    
    clearForm() {
        document.getElementById('glucose-form').reset();
        this.updateDateTime();
        
        // Clear checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    },
    
    showGlucoseStatus(glucose) {
        const statusDiv = document.getElementById('status-display');
        let statusClass = '';
        let statusText = '';
        let playSound = false;
        
        if (glucose < this.THRESHOLDS.CRITICAL_LOW) {
            statusClass = 'status-critical';
            statusText = '🚨 HIPOGLICEMIA SEVERA - Procure ajuda imediatamente!';
            playSound = true;
        } else if (glucose < this.THRESHOLDS.LOW) {
            statusClass = 'status-low';
            statusText = '⚠️ Glicose Baixa - Consuma carboidratos simples';
            playSound = true;
        } else if (glucose <= this.THRESHOLDS.NORMAL_MAX) {
            statusClass = 'status-normal';
            statusText = '✅ Glicose Normal';
        } else if (glucose < this.THRESHOLDS.HIGH) {
            statusClass = 'status-high';
            statusText = '⚠️ Glicose Alta - Monitore e considere insulina';
            playSound = true;
        } else if (glucose < this.THRESHOLDS.CRITICAL_HIGH) {
            statusClass = 'status-high';
            statusText = '🔴 Glicose Muito Alta - Consulte seu médico';
            playSound = true;
        } else {
            statusClass = 'status-critical';
            statusText = '🚨 HIPERGLICEMIA SEVERA - Procure ajuda médica imediatamente!';
            playSound = true;
        }
        
        statusDiv.className = `status-display ${statusClass}`;
        statusDiv.innerHTML = statusText;
        
        if (playSound && this.settings.soundAlerts) {
            this.playAlertSound();
        }
        
        // Show browser notification for critical values
        if ((glucose < this.THRESHOLDS.CRITICAL_LOW || glucose > this.THRESHOLDS.CRITICAL_HIGH) && 
            this.settings.notifications && Notification.permission === 'granted') {
            new Notification('Glicelivre - Alerta Crítico', {
                body: statusText.replace(/[🚨🔴⚠️]/g, ''),
                icon: '/static/icons/icon-192.svg',
                requireInteraction: true
            });
        }
    },
    
    playAlertSound() {
        const audio = document.getElementById('alert-sound');
        if (audio) {
            audio.play().catch(e => console.log('Could not play sound:', e));
        }
    },
    
    renderHistory() {
        const historyContainer = document.getElementById('history-list');
        
        if (this.data.length === 0) {
            historyContainer.innerHTML = `
                <div class="list-group-item text-center py-4">
                    <i data-feather="inbox" class="mb-2"></i>
                    <p class="mb-0 text-muted">Nenhum registro ainda</p>
                    <small class="text-muted">Adicione sua primeira medição!</small>
                </div>
            `;
            feather.replace();
            return;
        }
        
        const historyHTML = this.data.slice(0, 50).map(record => {
            const glucoseClass = this.getGlucoseClass(record.glucose);
            const dateTime = new Date(`${record.date}T${record.time}`);
            const formattedDate = dateTime.toLocaleDateString('pt-BR');
            const formattedTime = dateTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const insulinInfo = [];
            if (record.insulinFast > 0) insulinInfo.push(`Rápida: ${record.insulinFast}UI`);
            if (record.insulinSlow > 0) insulinInfo.push(`Lenta: ${record.insulinSlow}UI`);
            
            const symptomsHTML = record.symptoms && record.symptoms.length > 0 
                ? `<div class="history-symptoms">
                     ${record.symptoms.map(s => `<span class="symptom-badge">${s}</span>`).join('')}
                   </div>`
                : '';
            
            return `
                <div class="list-group-item history-item ${glucoseClass}">
                    <div class="history-meta">
                        ${formattedDate} às ${formattedTime}
                        ${record.mealContext ? `• ${this.getMealContextLabel(record.mealContext)}` : ''}
                    </div>
                    <div class="history-glucose">${record.glucose} mg/dL</div>
                    <div class="history-details">
                        ${insulinInfo.length > 0 ? `<div>Insulina: ${insulinInfo.join(', ')}</div>` : ''}
                        ${record.foodNotes ? `<div>Alimentação: ${record.foodNotes}</div>` : ''}
                        ${record.notes ? `<div>Obs: ${record.notes}</div>` : ''}
                    </div>
                    ${symptomsHTML}
                    <button class="btn btn-outline-danger btn-sm mt-2 delete-record" 
                            data-id="${record.id}" title="Excluir registro">
                        <i data-feather="trash-2" width="14" height="14"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        historyContainer.innerHTML = historyHTML;
        feather.replace();
        
        // Add delete event listeners
        document.querySelectorAll('.delete-record').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteRecord(id);
            });
        });
    },
    
    deleteRecord(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            this.data = this.data.filter(record => record.id !== id);
            this.saveData();
            this.renderHistory();
            this.updateStatistics();
            GlicelivreCharts.updateChart(this.data);
            this.showAlert('Registro excluído com sucesso!', 'info');
        }
    },
    
    getGlucoseClass(glucose) {
        if (glucose < this.THRESHOLDS.CRITICAL_LOW || glucose > this.THRESHOLDS.CRITICAL_HIGH) {
            return 'glucose-critical';
        } else if (glucose < this.THRESHOLDS.LOW || glucose > this.THRESHOLDS.HIGH) {
            return glucose < this.THRESHOLDS.LOW ? 'glucose-low' : 'glucose-high';
        } else {
            return 'glucose-normal';
        }
    },
    
    getMealContextLabel(context) {
        const labels = {
            'jejum': 'Em jejum',
            'pre-cafe': 'Antes do café',
            'pos-cafe': 'Após o café',
            'pre-almoco': 'Antes do almoço',
            'pos-almoco': 'Após o almoço',
            'pre-jantar': 'Antes do jantar',
            'pos-jantar': 'Após o jantar',
            'madrugada': 'Madrugada'
        };
        return labels[context] || context;
    },
    
    updateStatistics() {
        if (this.data.length === 0) {
            document.getElementById('stat-avg').textContent = '--';
            document.getElementById('stat-min').textContent = '--';
            document.getElementById('stat-max').textContent = '--';
            document.getElementById('stat-count').textContent = '0';
            return;
        }
        
        // Get data from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentData = this.data.filter(record => {
            const recordDate = new Date(`${record.date}T${record.time}`);
            return recordDate >= thirtyDaysAgo;
        });
        
        if (recentData.length === 0) {
            document.getElementById('stat-avg').textContent = '--';
            document.getElementById('stat-min').textContent = '--';
            document.getElementById('stat-max').textContent = '--';
            document.getElementById('stat-count').textContent = '0';
            return;
        }
        
        const glucoseValues = recentData.map(r => r.glucose);
        const avg = Math.round(glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length);
        const min = Math.min(...glucoseValues);
        const max = Math.max(...glucoseValues);
        
        document.getElementById('stat-avg').textContent = avg;
        document.getElementById('stat-min').textContent = min;
        document.getElementById('stat-max').textContent = max;
        document.getElementById('stat-count').textContent = recentData.length;
    },
    
    updateChartPeriod(days) {
        // Update button states
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${days}"]`).classList.add('active');
        
        // Filter data and update chart
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const filteredData = this.data.filter(record => {
            const recordDate = new Date(`${record.date}T${record.time}`);
            return recordDate >= cutoffDate;
        });
        
        GlicelivreCharts.updateChart(filteredData);
    },
    
    exportData() {
        if (this.data.length === 0) {
            this.showAlert('Não há dados para exportar!', 'warning');
            return;
        }
        
        const csvHeader = 'Data,Hora,Glicemia (mg/dL),Insulina Rápida (UI),Insulina Lenta (UI),Contexto,Alimentação,Sintomas,Observações\n';
        
        const csvContent = this.data.map(record => {
            const symptoms = record.symptoms ? record.symptoms.join('; ') : '';
            return [
                record.date,
                record.time,
                record.glucose,
                record.insulinFast || '',
                record.insulinSlow || '',
                this.getMealContextLabel(record.mealContext) || '',
                `"${(record.foodNotes || '').replace(/"/g, '""')}"`,
                `"${symptoms.replace(/"/g, '""')}"`,
                `"${(record.notes || '').replace(/"/g, '""')}"`
            ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvContent;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `glicelivre-historico-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showAlert('Dados exportados com sucesso!', 'success');
        }
    },
    
    clearHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
            this.data = [];
            this.saveData();
            this.renderHistory();
            this.updateStatistics();
            GlicelivreCharts.updateChart([]);
            this.showAlert('Histórico limpo com sucesso!', 'info');
        }
    },
    
    setReminder() {
        const minutes = prompt('Em quantos minutos deseja ser lembrado?', '120');
        
        if (minutes && !isNaN(minutes) && parseInt(minutes) > 0) {
            const reminderTime = parseInt(minutes);
            
            if ('Notification' in window && Notification.permission === 'granted') {
                setTimeout(() => {
                    new Notification('Glicelivre - Lembrete', {
                        body: 'Hora de medir sua glicemia!',
                        icon: '/static/icons/icon-192.svg',
                        requireInteraction: true
                    });
                }, reminderTime * 60 * 1000);
                
                this.showAlert(`Lembrete configurado para ${reminderTime} minutos!`, 'success');
            } else {
                this.showAlert('Notificações não estão disponíveis ou não foram permitidas.', 'warning');
            }
        }
    },
    
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
};
