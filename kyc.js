// KYC Verification System
class KYCManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.kycData = JSON.parse(localStorage.getItem('kycData') || '{}');
        this.currentStep = 1;
        this.maxStep = 1;
        this.uploadedFiles = {};
        
        this.checkAuth();
        this.initializeEventListeners();
        this.loadExistingData();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    initializeEventListeners() {
        // File upload listeners
        document.getElementById('id-upload').addEventListener('click', () => document.getElementById('id-file').click());
        document.getElementById('address-upload').addEventListener('click', () => document.getElementById('address-file').click());
        document.getElementById('selfie-upload').addEventListener('click', () => this.handleSelfieClick());
        
        document.getElementById('id-file').addEventListener('change', (e) => this.handleFileUpload(e, 'id'));
        document.getElementById('address-file').addEventListener('change', (e) => this.handleFileUpload(e, 'address'));
        document.getElementById('selfie-file').addEventListener('change', (e) => this.handleFileUpload(e, 'selfie'));
        
        // Form validation
        document.getElementById('personal-info-form').addEventListener('input', () => this.validateCurrentStep());
    }

    loadExistingData() {
        const userKYC = this.kycData[this.currentUser.email];
        if (userKYC) {
            this.populateForm(userKYC);
            this.maxStep = userKYC.maxStep || 1;
            this.updateProgress();
        }
    }

    populateForm(data) {
        if (data.personalInfo) {
            const info = data.personalInfo;
            document.getElementById('first-name').value = info.firstName || '';
            document.getElementById('last-name').value = info.lastName || '';
            document.getElementById('date-of-birth').value = info.dateOfBirth || '';
            document.getElementById('nationality').value = info.nationality || '';
            document.getElementById('address').value = info.address || '';
            document.getElementById('city').value = info.city || '';
            document.getElementById('postal-code').value = info.postalCode || '';
        }
    }

    validateCurrentStep() {
        const step = this.currentStep;
        let isValid = false;
        
        switch(step) {
            case 1:
                isValid = this.validatePersonalInfo();
                break;
            case 2:
                isValid = this.uploadedFiles.id !== undefined;
                break;
            case 3:
                isValid = this.uploadedFiles.address !== undefined;
                break;
            case 4:
                isValid = this.uploadedFiles.selfie !== undefined;
                break;
            case 5:
                isValid = document.getElementById('terms-agree').checked;
                break;
        }
        
        return isValid;
    }

    validatePersonalInfo() {
        const required = ['first-name', 'last-name', 'date-of-birth', 'nationality', 'address', 'city', 'postal-code'];
        return required.every(id => document.getElementById(id).value.trim() !== '');
    }

    nextStep() {
        if (!this.validateCurrentStep()) {
            this.showError('Please complete all required fields');
            return;
        }
        
        this.saveCurrentStep();
        
        if (this.currentStep < 5) {
            this.currentStep++;
            this.maxStep = Math.max(this.maxStep, this.currentStep);
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.kyc-step').forEach(el => el.classList.remove('active'));
        
        // Show current step
        document.getElementById(`step-${step}`).classList.add('active');
        
        // Update review if on step 5
        if (step === 5) {
            this.updateReview();
        }
    }

    updateProgress() {
        document.querySelectorAll('.step').forEach((el, index) => {
            const stepNum = index + 1;
            el.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                el.classList.add('active');
            } else if (stepNum < this.currentStep) {
                el.classList.add('completed');
            }
        });
    }

    saveCurrentStep() {
        const userEmail = this.currentUser.email;
        if (!this.kycData[userEmail]) {
            this.kycData[userEmail] = {};
        }
        
        switch(this.currentStep) {
            case 1:
                this.kycData[userEmail].personalInfo = {
                    firstName: document.getElementById('first-name').value,
                    lastName: document.getElementById('last-name').value,
                    dateOfBirth: document.getElementById('date-of-birth').value,
                    nationality: document.getElementById('nationality').value,
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    postalCode: document.getElementById('postal-code').value
                };
                break;
            case 2:
                this.kycData[userEmail].idDocument = {
                    type: document.querySelector('input[name="id-type"]:checked').value,
                    file: this.uploadedFiles.id
                };
                break;
            case 3:
                this.kycData[userEmail].addressProof = {
                    type: document.querySelector('input[name="address-type"]:checked').value,
                    file: this.uploadedFiles.address
                };
                break;
            case 4:
                this.kycData[userEmail].selfie = {
                    file: this.uploadedFiles.selfie
                };
                break;
        }
        
        this.kycData[userEmail].maxStep = this.maxStep;
        this.kycData[userEmail].lastUpdated = new Date().toISOString();
        
        localStorage.setItem('kycData', JSON.stringify(this.kycData));
    }

    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file size (10MB for documents, 5MB for selfie)
        const maxSize = type === 'selfie' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError(`File too large. Maximum size is ${type === 'selfie' ? '5MB' : '10MB'}`);
            return;
        }
        
        // Create file preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedFiles[type] = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result
            };
            
            this.updateUploadDisplay(type, file);
            this.validateCurrentStep();
        };
        reader.readAsDataURL(file);
    }

    updateUploadDisplay(type, file) {
        const uploadArea = document.getElementById(`${type}-upload`);
        uploadArea.innerHTML = `
            <div class="upload-success">
                <div class="success-icon">✅</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button onclick="kycManager.removeFile('${type}')" class="remove-file">×</button>
            </div>
        `;
    }

    removeFile(type) {
        delete this.uploadedFiles[type];
        const uploadArea = document.getElementById(`${type}-upload`);
        
        const icons = { id: '📷', address: '📄', selfie: '🤳' };
        const texts = { id: 'Click to upload or drag and drop', address: 'Click to upload or drag and drop', selfie: 'Click to take selfie or upload photo' };
        
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">${icons[type]}</div>
                <p>${texts[type]}</p>
                <small>JPG, PNG${type === 'address' ? ', PDF' : ''} up to ${type === 'selfie' ? '5MB' : '10MB'}</small>
            </div>
        `;
    }

    handleSelfieClick() {
        const options = [
            { text: '📷 Take Photo', action: () => this.startCamera() },
            { text: '📁 Upload Photo', action: () => document.getElementById('selfie-file').click() }
        ];
        
        // For simplicity, just trigger file upload
        document.getElementById('selfie-file').click();
    }

    updateReview() {
        const userKYC = this.kycData[this.currentUser.email];
        if (!userKYC) return;
        
        // Personal info review
        const personalInfo = userKYC.personalInfo;
        document.getElementById('review-personal').innerHTML = `
            <div class="review-item">
                <span class="label">Name:</span>
                <span class="value">${personalInfo.firstName} ${personalInfo.lastName}</span>
            </div>
            <div class="review-item">
                <span class="label">Date of Birth:</span>
                <span class="value">${personalInfo.dateOfBirth}</span>
            </div>
            <div class="review-item">
                <span class="label">Nationality:</span>
                <span class="value">${personalInfo.nationality}</span>
            </div>
            <div class="review-item">
                <span class="label">Address:</span>
                <span class="value">${personalInfo.address}, ${personalInfo.city} ${personalInfo.postalCode}</span>
            </div>
        `;
        
        // Documents review
        const docs = [];
        if (userKYC.idDocument) docs.push(`ID Document: ${userKYC.idDocument.type}`);
        if (userKYC.addressProof) docs.push(`Address Proof: ${userKYC.addressProof.type}`);
        if (userKYC.selfie) docs.push('Selfie: Uploaded');
        
        document.getElementById('review-documents').innerHTML = docs.map(doc => 
            `<div class="review-item"><span class="value">✅ ${doc}</span></div>`
        ).join('');
    }

    submitKYC() {
        if (!document.getElementById('terms-agree').checked) {
            this.showError('Please agree to the terms and conditions');
            return;
        }
        
        const userEmail = this.currentUser.email;
        this.kycData[userEmail].status = 'pending';
        this.kycData[userEmail].submittedAt = new Date().toISOString();
        
        localStorage.setItem('kycData', JSON.stringify(this.kycData));
        
        // Update user profile KYC status
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[userEmail]) {
            users[userEmail].kycStatus = 'pending';
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        this.showSuccess('KYC verification submitted successfully! We will review your documents within 24-48 hours.');
        
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Global functions
function nextStep() {
    kycManager.nextStep();
}

function prevStep() {
    kycManager.prevStep();
}

function submitKYC() {
    kycManager.submitKYC();
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    navMenu.classList.toggle('mobile-active');
    toggle.classList.toggle('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown-menu');
    dropdown.classList.toggle('hidden');
}

// Initialize
const kycManager = new KYCManager();