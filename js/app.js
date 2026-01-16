import { auth, db, appId } from './firebase-config.js';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    doc,
    setDoc,
    onSnapshot,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { languageData, currentLanguage, setCurrentLanguage, updateUIForLanguage } from './i18n.js';
import { callGemini, extractTextFromImage } from './api.js';
import {
    showLoading,
    showResult,
    showMessage,
    renderStructuredProfile,
    generateCvHtml,
    downloadCvAsWord,
    renderRecommendations,
    renderAnalysisDetails
} from './utils.js';
import * as prompts from './prompts.js';

// --- STATE ---
let userId = null;
let userProfile = null;
let profileUnsubscribe = null;
let currentOptimizedCvHtml = '';

// --- UI ELEMENTS ---
const landingPage = document.getElementById('landing-page');
const authPage = document.getElementById('auth-page');
const appContainer = document.getElementById('app-container');
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const sidebar = document.getElementById('sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.app-section');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            handleUserLoggedIn(user);
        } else {
            userId = null;
            handleUserLoggedOut();
        }
        updateUIForLanguage();
    });

    setupEventListeners();
    updateUIForLanguage();
});

function handleUserLoggedIn(user) {
    if (landingPage) {
        landingPage.style.display = 'flex';
        landingPage.classList.add('active-view');
    }
    if (authPage) authPage.style.display = 'none';
    if (appContainer) appContainer.style.display = 'none';

    // Update UI elements for logged in state
    const nameSpan = document.getElementById('logged-in-user-email');
    // Default to 'Usuario' or displayName, avoided email as requested
    if (nameSpan) nameSpan.textContent = user.displayName || "Usuario";

    // Start listening to profile immediately to get the structured name
    setupProfileListener();

    toggleLandingButtons(true);
}

function setupProfileListener() {
    if (!userId) return;
    if (profileUnsubscribe) profileUnsubscribe();

    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile_${currentLanguage}`, "workHistory");
    profileUnsubscribe = onSnapshot(profileRef, (doc) => {
        userProfile = doc.exists() ? doc.data() : null;

        // Update name on landing page from structured profile if available
        const nameSpan = document.getElementById('logged-in-user-email');
        if (nameSpan && userProfile) {
            // Prioritize structured name from profile
            nameSpan.textContent = userProfile.nombre || userProfile.name || auth.currentUser.displayName || "Usuario";
        }

        renderProfile();
    });
}

function handleUserLoggedOut() {
    if (profileUnsubscribe) profileUnsubscribe();
    userProfile = null;

    if (landingPage) {
        landingPage.style.display = 'flex';
        landingPage.classList.add('active-view');
    }
    if (authPage) authPage.style.display = 'none';
    if (appContainer) appContainer.style.display = 'none';

    toggleLandingButtons(false);
}

function toggleLandingButtons(isLoggedIn) {
    const loggedInMsg = document.getElementById('landing-logged-in-message');
    const optimizeBtn = document.getElementById('landing-optimize-cv-btn');
    const loginBtn = document.getElementById('landing-login-register-btn');
    const startFreeBtn = document.getElementById('landing-start-free-btn');

    if (loggedInMsg) loggedInMsg.classList.toggle('hidden', !isLoggedIn);
    if (optimizeBtn) optimizeBtn.classList.toggle('hidden', isLoggedIn);
    if (loginBtn) loginBtn.classList.toggle('hidden', isLoggedIn);
    if (startFreeBtn) startFreeBtn.classList.toggle('hidden', isLoggedIn);
}

function setupEventListeners() {
    // Navigation & Layout
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        sidebar?.classList.toggle('-translate-x-full');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;

            // Clear previous analysis if navigating directly to Verify Offer
            if (sectionId === 'section-verify-offer') {
                document.getElementById('form-verify-offer')?.reset();
                const resultDiv = document.getElementById('result-verify-offer');
                if (resultDiv) {
                    resultDiv.innerHTML = '';
                    resultDiv.classList.add('hidden');
                }
                const preview = document.getElementById('offer-image-preview');
                if (preview) preview.remove();
                const imageLabel = document.querySelector('#offer-image')?.closest('div').querySelector('span');
                if (imageLabel) imageLabel.textContent = languageData[currentLanguage].offerImageLabel;
            }

            showSection(sectionId);
            if (window.innerWidth < 1024) sidebar?.classList.add('-translate-x-full');
        });
    });

    // Language Toggle
    document.getElementById('language-toggle-btn')?.addEventListener('click', () => {
        const nextLang = (currentLanguage === 'es') ? 'en' : 'es';
        setCurrentLanguage(nextLang);
        updateUIForLanguage();
        if (appContainer?.style.display === 'flex' && userId) initializeMainApp();
    });

    // Auth Actions
    setupAuthEventListeners();

    // App Actions
    setupAppEventListeners();

    // File Input UI Feedback
    document.getElementById('cv-file')?.addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name;
        const label = e.target.closest('div').querySelector('p.text-lg');
        if (fileName && label) label.textContent = fileName;
    });

    document.getElementById('offer-image')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const label = e.target.closest('div').querySelector('span');
        if (file && label) label.textContent = file.name;

        // Optional: Image preview
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                let preview = document.getElementById('offer-image-preview');
                if (!preview) {
                    preview = document.createElement('img');
                    preview.id = 'offer-image-preview';
                    preview.className = 'mt-4 max-h-40 rounded-lg shadow-md mx-auto';
                    e.target.closest('div').parentElement.appendChild(preview);
                }
                preview.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Modal Events
    const cvModal = document.getElementById('cv-modal');
    cvModal?.addEventListener('click', (e) => {
        if (e.target === cvModal || e.target.closest('.close-modal-btn')) {
            cvModal.classList.add('hidden');
        }
    });

    document.getElementById('message-modal-close-btn')?.addEventListener('click', () => {
        document.getElementById('message-modal')?.classList.add('hidden');
    });
}

function setupAuthEventListeners() {
    // Switch between login/register
    document.getElementById('switch-to-register-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer?.classList.add('hidden');
        registerFormContainer?.classList.remove('hidden');
    });

    document.getElementById('switch-to-login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer?.classList.remove('hidden');
        registerFormContainer?.classList.add('hidden');
    });

    // Landing triggers
    const triggerAuth = () => {
        landingPage.style.display = 'none';
        authPage.style.display = 'flex';
        authPage.classList.add('active-view');
    };

    document.getElementById('landing-login-register-btn')?.addEventListener('click', triggerAuth);
    document.getElementById('landing-optimize-cv-btn')?.addEventListener('click', triggerAuth);
    document.getElementById('landing-start-free-btn')?.addEventListener('click', triggerAuth);
    document.getElementById('landing-go-to-dashboard-btn')?.addEventListener('click', () => {
        landingPage.style.display = 'none';
        appContainer.style.display = 'flex';
        appContainer.classList.add('active-view');
        initializeMainApp();
    });

    // Form Submissions
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('sign-out-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth);
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (!userCred.user.emailVerified) {
            await signOut(auth);
            showMessage('genericErrorTitle', 'verifyEmailPrompt', true);
        }
    } catch (error) {
        showMessage('genericErrorTitle', error.message, true);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCred.user);
        registerFormContainer?.classList.add('hidden');
        document.getElementById('register-success-verification')?.classList.remove('hidden');
    } catch (error) {
        showMessage('genericErrorTitle', error.message, true);
    }
}

function setupAppEventListeners() {
    document.getElementById('form-load-cv')?.addEventListener('submit', handleLoadCv);
    document.getElementById('form-verify-offer')?.addEventListener('submit', handleVerifyOffer);
    document.getElementById('form-update-profile')?.addEventListener('submit', handleUpdateProfile);
    document.getElementById('form-settings')?.addEventListener('submit', handleSaveSettings);
    document.getElementById('generate-recommendations-btn')?.addEventListener('click', generateJobRecommendations);
}

// --- APP CORE FUNCTIONS ---

function showSection(sectionId) {
    sections.forEach(s => s.style.display = s.id === sectionId ? 'block' : 'none');
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === sectionId));
    if (sectionId === 'section-home') loadSearchHistory();
}

async function initializeMainApp() {
    if (!userId) return;
    setupProfileListener();
    showSection('section-home');
}

function renderProfile() {
    const content = document.getElementById('profile-content');
    const settingsJson = document.getElementById('settings-json');
    if (userProfile) {
        if (content) content.innerHTML = renderStructuredProfile(userProfile);
        if (settingsJson) settingsJson.value = JSON.stringify(userProfile, null, 2);
    } else {
        if (content) content.innerHTML = `<p class="text-gray-500">${languageData[currentLanguage].profileNotFound}</p>`;
    }
}

async function handleLoadCv(e) {
    e.preventDefault();
    const file = document.getElementById('cv-file').files[0];
    if (!file) return showMessage('genericErrorTitle', 'selectPdfFile', true);

    const resultDiv = document.getElementById('result-load-cv');
    showLoading(resultDiv, 'loadingAndProcessingPdf');

    try {
        const pdfData = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(s => s.str).join(' ');
        }

        const structuredCv = await callGemini(prompts.getStructurePrompt(textContent, currentLanguage));
        const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile_${currentLanguage}`, "workHistory");
        await setDoc(profileRef, structuredCv);

        const summary = await callGemini(prompts.getSummaryPrompt(structuredCv, currentLanguage), false);
        showResult(resultDiv, 'cvLoadedSuccess', false, summary);
    } catch (error) {
        showMessage('genericErrorTitle', error.message, true);
    }
}

async function handleVerifyOffer(e) {
    e.preventDefault();
    if (!userProfile) return showMessage('genericErrorTitle', 'mustLoadProfile', true);

    const text = document.getElementById('offer-text').value;
    const img = document.getElementById('offer-image').files[0];
    const resultDiv = document.getElementById('result-verify-offer');

    if (img) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target.result.split(',')[1];
            try {
                showLoading(resultDiv, 'extractingTextFromImage');
                const extracted = await extractTextFromImage(base64, img.type);
                await runCompatibility(extracted);
            } catch (error) { showMessage('genericErrorTitle', error.message, true); }
        };
        reader.readAsDataURL(img);
    } else if (text.trim()) {
        await runCompatibility(text.trim());
    } else {
        showMessage('genericErrorTitle', 'pasteOfferOrUploadImage', true);
    }
}

async function runCompatibility(offerText, historyData = null) {
    const resultDiv = document.getElementById('result-verify-offer');
    showLoading(resultDiv, 'analyzingCompatibilityAi');

    try {
        let analysisResult;
        if (historyData) {
            analysisResult = historyData;
        } else {
            analysisResult = await callGemini(prompts.getCompatibilityPrompt(userProfile, offerText, currentLanguage));
            const historyRef = collection(db, `artifacts/${appId}/users/${userId}/searchHistory`);
            await addDoc(historyRef, {
                ...analysisResult,
                jobOfferText: offerText,
                timestamp: serverTimestamp(),
                language: currentLanguage
            });
        }

        const { analisis, output } = analysisResult;
        currentOptimizedCvHtml = generateCvHtml(output.cv_final);
        document.getElementById('cv-modal-content').innerHTML = currentOptimizedCvHtml;

        const isComp = analisis.es_compatible || analisis.is_compatible;
        const msg = `<b>${languageData[currentLanguage].compatibility}: ${analisis.porcentaje_compatibilidad}%</b>`;

        let extra = `
            <div class="mt-4 flex gap-4">
                <button id="show-cv-modal-btn" class="btn-primary-landing text-sm px-4 py-2">${languageData[currentLanguage].viewOptimizedCV}</button>
                <button id="download-cv-word-btn" class="btn-secondary-landing text-sm px-4 py-2">${languageData[currentLanguage].downloadCvWord}</button>
            </div>
        `;

        // If not compatible, append the plan of action (recommendations)
        if (!isComp && output.recomendaciones) {
            extra += renderRecommendations(output.recomendaciones);
        } else if (isComp && analisis) {
            // Success case details: points and tips
            extra += renderAnalysisDetails(analisis);
        }

        showResult(resultDiv, isComp ? 'congratulationsCandidate' : 'areasOfOpportunity', !isComp, msg + extra);

        document.getElementById('show-cv-modal-btn')?.addEventListener('click', () => document.getElementById('cv-modal').classList.remove('hidden'));
        document.getElementById('download-cv-word-btn')?.addEventListener('click', () => downloadCvAsWord(currentOptimizedCvHtml, `CV_${analisis.nombreVACANTE}.doc`));

    } catch (error) { showMessage('genericErrorTitle', error.message, true); }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    const text = document.getElementById('update-text').value;
    const resultDiv = document.getElementById('result-update-profile');
    showLoading(resultDiv, 'updatingProfileAi');

    try {
        const updated = await callGemini(prompts.getMergePrompt(userProfile, text, currentLanguage));
        const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile_${currentLanguage}`, "workHistory");
        await setDoc(profileRef, updated);
        showMessage('successTitle', 'profileUpdatedSuccess');
        document.getElementById('form-update-profile').reset();
    } catch (error) { showMessage('genericErrorTitle', error.message, true); }
}

async function handleSaveSettings(e) {
    e.preventDefault();
    const json = document.getElementById('settings-json').value;
    try {
        const parsed = JSON.parse(json);
        const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile_${currentLanguage}`, "workHistory");
        await setDoc(profileRef, parsed);
        showMessage('successTitle', 'settingsSavedSuccess');
    } catch (error) { showMessage('genericErrorTitle', error.message, true); }
}

async function generateJobRecommendations() {
    const resultDiv = document.getElementById('home-job-recommendations-result');
    showLoading(resultDiv, 'generatingRecommendations');
    try {
        const recs = await callGemini(prompts.getJobRecPrompt(userProfile, currentLanguage));
        const array = recs.recomendaciones_empleo || recs.job_recommendations;
        const html = `<ul class="space-y-2 mt-4">${array.map(r => `<li><i class="fas fa-check text-green-500 mr-2"></i><b>${r.rol || r.role}</b>: ${r.portales.join(', ')}</li>`).join('')}</ul>`;
        showResult(resultDiv, 'recommendationsGenerated', false, html);
    } catch (error) { showMessage('genericErrorTitle', error.message, true); }
}

async function loadSearchHistory() {
    const container = document.getElementById('home-search-history');
    if (!userId) return;
    try {
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/searchHistory`), orderBy("timestamp", "desc"), limit(5));
        const snap = await getDocs(q);
        if (snap.empty) return container.innerHTML = `<p class="text-gray-500">${languageData[currentLanguage].noRecentAnalysis}</p>`;

        container.innerHTML = `<div class="space-y-3">${snap.docs.map(d => {
            const data = d.data();
            const date = data.timestamp?.toDate().toLocaleDateString() || '';
            const title = data.analisis?.nombreVACANTE || 'Oferta';
            return `
                <div class="p-4 bg-white rounded-xl border border-gray-100 hover:border-green-300 transition-all cursor-pointer shadow-sm group" onclick="window.loadHistoryItem('${d.id}')">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-gray-800">${title}</span>
                        <span class="text-xs text-gray-400">${date}</span>
                    </div>
                    <div class="text-sm text-green-600 font-medium mt-1 group-hover:translate-x-1 transition-transform">Ver análisis <i class="fas fa-arrow-right ml-1"></i></div>
                </div>
            `;
        }).join('')}</div>`;

        window.loadHistoryItem = async (id) => {
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/searchHistory`, id);
            const s = await getDoc(docRef);
            if (s.exists()) {
                const data = s.data();
                showSection('section-verify-offer');
                // Fill the text field with the historical job offer text
                document.getElementById('offer-text').value = data.jobOfferText || '';
                runCompatibility(data.jobOfferText, data);
            }
        };
    } catch (error) { console.error(error); }
}
