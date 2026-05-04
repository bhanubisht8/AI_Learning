/**
 * Cyber Mitra - AI Assistant Integration
 * Powered by Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_CONFIG = {
    // DO NOT COMMIT YOUR REAL API KEY
    apiKey: "AIzaSyADkfMeYlJdBwFMenZ0UTyB1wga-pKWoOM",
    modelName: "gemini-1.5-flash", 
    systemInstruction: `You are 'Cyber Mitra', an AI Assistant for the Uttar Pradesh Police Technical Services Portal. 
    Your goal is to help citizens of Uttar Pradesh report incidents and understand the portal.
    Be professional, helpful, and empathetic. Speak in a mix of Hindi and English (Hinglish) as is common in UP.
    If asked about reporting, guide them to the 'Report Incident' tab.
    If asked about tracking, guide them to the 'Track Status' tab.
    If someone describes an incident, help them categorize it (Theft, Cyber Crime, Harassment, Missing Person, etc.) and encourage them to file a formal report.
    IMPORTANT: You are an AI assistant, not a police officer. For emergencies, tell them to call 112.`
};

const aiAssistant = {
    genAI: null,
    model: null,
    chat: null,

    init: async function() {
        console.log("Cyber Mitra: Starting Final Diagnostic...");
        
        if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey.includes("YOUR_GEMINI_API_KEY")) {
            this.addMessage("ai", "Namaste! Please add your API Key to ai-assistant.js.");
            return;
        }

        try {
            // 1. Get the list of models directly from Google
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${AI_CONFIG.apiKey}`;
            const listRes = await fetch(listUrl);
            const listData = await listRes.json();

            if (!listRes.ok) {
                this.addMessage("ai", `API Error: ${listData.error?.message || 'Check your key'}`);
                return;
            }

            // 2. Display the models found for debugging in the chat
            const modelNames = listData.models.map(m => m.name.replace('models/', ''));
            console.log("Discovered Models:", modelNames);
            
            // 3. Try to find a working model by doing a raw fetch test
            let workingModel = null;
            // Updated with models found in your specific account logs
            const testModels = [
                'gemini-2.0-flash', 
                'gemini-flash-latest', 
                'gemini-2.5-flash', 
                'gemini-1.5-flash', 
                'gemini-pro-latest'
            ];
            
            // Filter to only those actually in the list from Google
            const validTests = testModels.filter(m => modelNames.includes(m));
            
            // If none of our preferred ones are there, just try the first one that supports generateContent
            if (validTests.length === 0 && listData.models.length > 0) {
                const fallback = listData.models.find(m => m.supportedGenerationMethods?.includes('generateContent'));
                if (fallback) validTests.push(fallback.name.replace('models/', ''));
            }

            for (const mId of validTests) {
                try {
                    console.log(`Raw testing: ${mId}`);
                    // Trying both v1 and v1beta to be safe
                    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${mId}:generateContent?key=${AI_CONFIG.apiKey}`;
                    const res = await fetch(testUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
                    });
                    
                    if (res.ok) {
                        workingModel = mId;
                        console.log(`✅ Raw Success with ${mId}`);
                        break;
                    } else {
                        const err = await res.json();
                        console.warn(`Model ${mId} failed test:`, err.error?.message);
                    }
                } catch (e) { }
            }

            if (!workingModel) {
                this.addMessage("ai", `No working models found. Available to you: ${modelNames.slice(0, 3).join(', ')}...`);
                return;
            }

            // 4. Initialize SDK with the confirmed working model
            this.genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: workingModel });
            this.chat = this.model.startChat({ history: [] });

            console.log("✅ Cyber Mitra: Connected via " + workingModel);
            const statusDot = document.querySelector('.status-dot');
            if (statusDot) statusDot.style.backgroundColor = '#2ecc71';
            this.addMessage("ai", "Namaste! I am Cyber Mitra. Connectivity is now active.");
            
        } catch (error) {
            console.error("Final Init Error:", error);
            this.addMessage("ai", "Connection failed. Please check your internet.");
        }
    },

    /**
     * Send a message to Gemini
     */
    sendMessage: async function(userText) {
        if (!this.chat) {
            this.addMessage("ai", "I am currently disconnected. Please refresh the page.");
            return;
        }

        this.addMessage("user", userText);
        const typingId = this.showTyping();

        try {
            // Use the established chat session
            const result = await this.chat.sendMessage(userText);
            const response = await result.response;
            const text = response.text();
            
            this.removeTyping(typingId);
            this.addMessage("ai", text);
        } catch (error) {
            this.removeTyping(typingId);
            console.error("Cyber Mitra Send Error:", error);
            
            if (error.message.includes("429") || error.message.includes("quota")) {
                this.addMessage("ai", "System: My daily limit has been reached. Please try again after 30 seconds or use a new API Key from Google AI Studio.");
                return;
            }

            // Fallback: If chat session fails, try a direct generation
            try {
                const result = await this.model.generateContent(userText);
                const response = await result.response;
                this.addMessage("ai", response.text());
            } catch (fallbackError) {
                if (fallbackError.message.includes("429")) {
                    this.addMessage("ai", "I'm currently resting (Rate Limit). Please wait a few seconds and try again!");
                } else {
                    this.addMessage("ai", "Sorry, I am having trouble connecting right now. Please try again in a moment.");
                }
            }
        }
    },

    /**
     * UI Helpers
     */
    addMessage: function(sender, text) {
        const container = document.getElementById('ai-chat-messages');
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    showTyping: function() {
        const container = document.getElementById('ai-chat-messages');
        const div = document.createElement('div');
        const id = 'typing-' + Date.now();
        div.id = id;
        div.className = 'typing';
        div.textContent = 'Cyber Mitra is thinking...';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    removeTyping: function(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    /**
     * Auto-Categorize Incident based on description
     */
    categorizeIncident: async function(description) {
        if (!this.model || !description || description.length < 10) return;

        try {
            const prompt = `Based on this incident description: "${description}", 
            which of these categories fits best: "Theft", "Cyber Crime", "Harassment", "Missing Person", or "Other"? 
            Return ONLY the category name.`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const category = response.text().trim();
            
            // Validate and update the dropdown
            const select = document.getElementById('incidentType');
            if (select) {
                for (let option of select.options) {
                    if (category.toLowerCase().includes(option.value.toLowerCase()) && option.value !== "") {
                        select.value = option.value;
                        console.log(`AI suggested category: ${option.value}`);
                        
                        // Optional: Visual feedback
                        select.style.borderColor = "#2ecc71";
                        setTimeout(() => select.style.borderColor = "", 2000);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error("Auto-categorization error:", error);
        }
    },

    /**
     * AI Features for Admin & Citizen
     */
    
    // 1. Generate a 2-sentence summary for Admin
    generateAdminSummary: async function(description) {
        if (!this.model || !description) return "Summary unavailable.";
        try {
            const prompt = `Summarize this police incident report in exactly 2 concise sentences for an investigating officer: "${description}"`;
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (e) { return "Summary generation failed."; }
    },

    // 2. Translate non-English text to English
    translateToEnglish: async function(text) {
        if (!this.model || !text) return null;
        try {
            const prompt = `Translate the following text to English. If it is already in English, return it exactly as is: "${text}"`;
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (e) { return null; }
    },

    // 3. Assess Urgency and Sentiment
    assessUrgency: async function(description) {
        if (!this.model || !description) return "Medium";
        try {
            const prompt = `Analyze this incident: "${description}". 
            Is it "High", "Medium", or "Low" priority? High priority means immediate physical danger, violence, or ongoing crime. 
            Return ONLY one word: High, Medium, or Low.`;
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (e) { return "Medium"; }
    },

    // 4. Generate Next Steps for Citizen
    generateNextSteps: async function(type, description) {
        if (!this.model) return "Please wait for police contact.";
        try {
            const prompt = `A citizen just reported a ${type} incident: "${description}". 
            Provide 3 bullet points of immediate "Next Steps" or safety advice for the citizen. 
            Keep it helpful and specific to the incident.`;
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (e) { return "Please stay safe and wait for official contact."; }
    }
};

// Event Listeners for Chat UI
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('ai-chat-toggle');
    const closeBtn = document.getElementById('ai-chat-close');
    const chatWindow = document.getElementById('ai-chat-window');
    const sendBtn = document.getElementById('ai-send-btn');
    const userInput = document.getElementById('ai-user-input');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('active');
            if (chatWindow.classList.contains('active')) {
                userInput.focus();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('active');
        });
    }

    const handleSend = () => {
        const text = userInput.value.trim();
        if (text) {
            aiAssistant.sendMessage(text);
            userInput.value = '';
        }
    };

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // Add listener for auto-categorization
    const descriptionArea = document.getElementById('description');
    if (descriptionArea) {
        descriptionArea.addEventListener('blur', () => {
            aiAssistant.categorizeIncident(descriptionArea.value);
        });
    }

    // Initialize AI
    aiAssistant.init();
});

// Export to window for access from other scripts if needed
window.aiAssistant = aiAssistant;
