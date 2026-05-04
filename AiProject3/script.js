/**
 * UP Police Citizen Service & Incident Reporting Portal - Script
 * Pure Vanilla JavaScript logic
 */

const app = {
    // Current state
    complaints: [],
    
    /**
     * Initialization function
     */
    init: function() {
        this.loadData();
        this.attachEventListeners();
        this.updateStats();
        console.log("UP Police Portal Initialized");
    },

    /**
     * Load data from localStorage
     */
    loadData: function() {
        const stored = localStorage.getItem('upp_complaints');
        this.complaints = stored ? JSON.parse(stored) : [];
        this.renderAdminTable();
    },

    /**
     * Save data to localStorage
     */
    saveData: function() {
        localStorage.setItem('upp_complaints', JSON.stringify(this.complaints));
        this.updateStats();
    },

    /**
     * Navigation Logic
     * @param {string} pageId - ID of the section to show
     */
    navigateTo: function(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0);
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Specific logic for admin page
        if (pageId === 'admin') {
            this.renderAdminTable();
        }
    },

    /**
     * Attach all DOM event listeners
     */
    attachEventListeners: function() {
        const self = this;

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                self.navigateTo(link.dataset.page);
            });
        });

        // Form Submission
        const form = document.getElementById('incident-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                self.handleFormSubmission();
            });
        }

        // Admin Search
        const adminSearch = document.getElementById('adminSearch');
        if (adminSearch) {
            adminSearch.addEventListener('input', (e) => {
                self.renderAdminTable(e.target.value);
            });
        }

        // Tracking Button
        const btnTrack = document.getElementById('btn-track');
        if (btnTrack) {
            btnTrack.addEventListener('click', () => {
                self.handleTracking();
            });
        }

        // Mobile Menu Toggle
        const mobileMenu = document.getElementById('mobile-menu');
        const navLinks = document.getElementById('nav-links');
        
        if (mobileMenu && navLinks) {
            mobileMenu.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close menu when a link is clicked
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }
    },

    /**
     * Handle Form Submission
     */
    handleFormSubmission: async function() {
        // Generate Unique ID
        const id = 'UPP-' + Math.floor(100000 + Math.random() * 900000);
        const date = new Date().toLocaleDateString();

        const description = document.getElementById('description').value;
        const type = document.getElementById('incidentType').value;

        // Gather Data
        const complaint = {
            id: id,
            date: date,
            name: document.getElementById('fullName').value,
            mobile: document.getElementById('mobile').value,
            email: document.getElementById('email').value,
            type: type,
            location: document.getElementById('location').value,
            description: description,
            status: 'Pending',
            aiUrgency: 'Medium', // Default
            aiTranslation: ''
        };

        // Save immediately to state
        this.complaints.push(complaint);
        this.saveData();

        // Show Success Modal immediately
        document.getElementById('new-id').textContent = id;
        document.getElementById('success-modal').classList.add('active');
        
        // --- AI ENHANCEMENTS IN BACKGROUND ---
        
        // 1. Show AI Advice in Success Modal
        const adviceBox = document.getElementById('ai-next-steps');
        const adviceContent = document.getElementById('next-steps-content');
        if (adviceBox && adviceContent) {
            adviceBox.style.display = 'block';
            adviceContent.innerHTML = '🤖 Cyber Mitra is preparing safety advice for you...';
            
            const nextSteps = await aiAssistant.generateNextSteps(type, description);
            adviceContent.innerHTML = nextSteps.replace(/\n/g, '<br>');
        }

        // 2. Assess Urgency & Translation for Admin (Background)
        const urgency = await aiAssistant.assessUrgency(description);
        const translation = await aiAssistant.translateToEnglish(description);
        
        // Update the stored complaint with AI data
        const index = this.complaints.findIndex(c => c.id === id);
        if (index !== -1) {
            this.complaints[index].aiUrgency = urgency;
            this.complaints[index].aiTranslation = translation;
            this.saveData();
        }

        // Reset Form
        document.getElementById('incident-form').reset();
    },

    /**
     * Close Modal
     */
    closeModal: function() {
        document.getElementById('success-modal').classList.remove('active');
        // Reset the advice box for next time
        const adviceBox = document.getElementById('ai-next-steps');
        if (adviceBox) adviceBox.style.display = 'none';
        this.navigateTo('home');
    },

    /**
     * Handle Tracking
     */
    handleTracking: function() {
        const trackId = document.getElementById('trackId').value.trim().toUpperCase();
        const resultArea = document.getElementById('track-result');
        
        if (!trackId) {
            resultArea.innerHTML = '<p style="color: red;">Please enter a Complaint ID.</p>';
            return;
        }

        const found = this.complaints.find(c => c.id === trackId);

        if (found) {
            resultArea.innerHTML = `
                <div class="track-details">
                    <p><strong>Complaint ID:</strong> ${found.id}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${found.status.toLowerCase()}">${found.status}</span></p>
                    <p><strong>Filed On:</strong> ${found.date}</p>
                    <p><strong>Type:</strong> ${found.type}</p>
                    <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
                    <p><em>Latest Update: Your report has been received and is currently under review by the Technical Services team.</em></p>
                </div>
            `;
        } else {
            resultArea.innerHTML = '<p style="color: red;">No record found with ID: ' + trackId + '</p>';
        }
    },

    /**
     * Render Admin Dashboard Table
     * @param {string} filter - Optional search term
     */
    renderAdminTable: function(filter = '') {
        const tbody = document.getElementById('admin-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const filtered = this.complaints.filter(c => 
            c.id.toLowerCase().includes(filter.toLowerCase()) || 
            c.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No reports found.</td></tr>';
            return;
        }

        filtered.reverse().forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.id}</strong></td>
                <td>${c.date}</td>
                <td>${c.name}</td>
                <td>${c.type}</td>
                <td>${c.location}</td>
                <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
                <td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.8rem;" onclick="app.viewDetails('${c.id}')">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    /**
     * View Detailed Report
     * @param {string} id - Complaint ID
     */
    viewDetails: async function(id) {
        const found = this.complaints.find(c => c.id === id);
        if (!found) return;

        // 1. Set Initial UI for AI Features
        const priorityBadge = document.getElementById('ai-priority-badge');
        const summaryText = document.getElementById('ai-summary');
        const translationText = document.getElementById('ai-translation');
        
        if (priorityBadge) {
            const urgency = found.aiUrgency || 'Medium';
            const color = urgency === 'High' ? '#e74c3c' : (urgency === 'Medium' ? '#f39c12' : '#27ae60');
            priorityBadge.innerHTML = `<span class="badge" style="background: ${color}; color: white; padding: 5px 10px; border-radius: 4px;">Priority: ${urgency}</span>`;
        }
        
        if (summaryText) summaryText.innerHTML = "Generating AI Summary...";
        if (translationText) translationText.innerHTML = found.aiTranslation || "No translation needed (Already in English).";

        const content = document.getElementById('detail-content');
        content.innerHTML = `
            <strong>Complaint ID:</strong> <p>${found.id}</p>
            <strong>Status:</strong> <p><span class="badge badge-${found.status.toLowerCase()}">${found.status}</span></p>
            <strong>Filed Date:</strong> <p>${found.date}</p>
            <strong>Reporter Name:</strong> <p>${found.name}</p>
            <strong>Mobile:</strong> <p>${found.mobile}</p>
            <strong>Email:</strong> <p>${found.email || 'N/A'}</p>
            <strong>Incident Type:</strong> <p>${found.type}</p>
            <strong>Location:</strong> <p>${found.location}</p>
            <strong style="grid-column: 1 / -1; margin-top: 10px;">Description:</strong>
            <p style="grid-column: 1 / -1; background: #f9f9f9; padding: 10px; border-radius: 4px; border: 1px solid #eee; margin-bottom: 0;">${found.description}</p>
            
            <div style="grid-column: 1 / -1; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <div class="form-group">
                    <label>Update Status:</label>
                    <select id="updateStatusSelect" onchange="app.updateStatus('${found.id}', this.value)" style="padding: 5px; border-radius: 4px;">
                        <option value="Pending" ${found.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${found.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${found.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="Rejected" ${found.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </div>
                <button class="btn" style="background: #e74c3c; color: white; padding: 8px 15px;" onclick="app.deleteReport('${found.id}')">Delete Report</button>
            </div>
        `;

        document.getElementById('detail-modal').classList.add('active');

        // 2. Fetch AI Summary in Real-time (if session is active)
        if (window.aiAssistant && aiAssistant.chat) {
            const summary = await aiAssistant.generateAdminSummary(found.description);
            if (summaryText) summaryText.innerHTML = summary;
        } else {
            if (summaryText) summaryText.innerHTML = "AI Summary unavailable (Offline).";
        }
    },

    /**
     * Update Report Status
     * @param {string} id - Complaint ID
     * @param {string} newStatus - New status value
     */
    updateStatus: function(id, newStatus) {
        const index = this.complaints.findIndex(c => c.id === id);
        if (index !== -1) {
            this.complaints[index].status = newStatus;
            this.saveData();
            this.renderAdminTable(document.getElementById('adminSearch').value);
            // Refresh modal content if still open
            this.viewDetails(id);
        }
    },

    /**
     * Delete a Report
     * @param {string} id - Complaint ID
     */
    deleteReport: function(id) {
        if (confirm(`Are you sure you want to delete report ${id}?`)) {
            this.complaints = this.complaints.filter(c => c.id !== id);
            this.saveData();
            this.closeDetailModal();
            this.renderAdminTable(document.getElementById('adminSearch').value);
        }
    },

    /**
     * Close Detail Modal
     */
    closeDetailModal: function() {
        document.getElementById('detail-modal').classList.remove('active');
    },

    /**
     * Update Dashboard Statistics
     */
    updateStats: function() {
        const total = this.complaints.length;
        const pending = this.complaints.filter(c => c.status === 'Pending').length;
        const resolved = this.complaints.filter(c => c.status === 'Resolved').length;

        const elTotal = document.getElementById('stat-total');
        const elPending = document.getElementById('stat-pending');
        const elResolved = document.getElementById('stat-resolved');

        if (elTotal) elTotal.textContent = total;
        if (elPending) elPending.textContent = pending;
        if (elResolved) elResolved.textContent = resolved;
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
