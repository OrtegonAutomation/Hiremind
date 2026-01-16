import { languageData, currentLanguage } from './i18n.js';

export function showLoading(element, messageKey) {
    const message = languageData[currentLanguage][messageKey] || messageKey;
    if (element) {
        element.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl animate-pulse">
                <div class="loader mb-4"></div>
                <p class="text-gray-600 font-medium">${message}</p>
            </div>`;
        element.classList.remove('hidden');
    }
}

export function showResult(element, messageKey, isError = false, extraContent = '') {
    const message = languageData[currentLanguage][messageKey] || messageKey;
    const bgColor = isError ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100';
    const textColor = isError ? 'text-red-700' : 'text-green-700';
    const icon = isError ? 'fa-times-circle' : 'fa-check-circle';
    if (element) {
        element.innerHTML = `
            <div class="p-6 rounded-2xl border ${bgColor} shadow-sm animate-fade-in">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="fas ${icon} ${textColor} text-2xl"></i>
                    </div>
                    <div class="ml-4 flex-1">
                        <div class="text-base font-semibold ${textColor}">${message}</div>
                        <div class="mt-2 text-gray-600">${extraContent}</div>
                    </div>
                </div>
            </div>`;
        element.classList.remove('hidden');
    }
}

export function showMessage(titleKey, contentKey, isError = false) {
    const title = languageData[currentLanguage][titleKey] || titleKey;
    const content = languageData[currentLanguage][contentKey] || contentKey;

    const messageModal = document.getElementById('message-modal');
    const messageModalTitle = document.getElementById('message-modal-title');
    const messageModalContent = document.getElementById('message-modal-content');

    if (messageModalTitle) {
        messageModalTitle.textContent = title;
        messageModalTitle.classList.toggle('text-red-700', isError);
        messageModalTitle.classList.toggle('text-gray-800', !isError);
    }
    if (messageModalContent) messageModalContent.textContent = content;
    if (messageModal) messageModal.classList.remove('hidden');
}

export function renderStructuredProfile(profileData) {
    const get = (val, def = '') => val || def;
    const getArr = (arr) => arr || [];

    profileData = profileData || {};
    const contact = profileData.contacto || profileData.contact || {};
    const skills = profileData.habilidades || profileData.skills || {};
    const profileSections = languageData[currentLanguage].profileSections || {};

    return `
        <div class="space-y-8 animate-fade-in">
            <div class="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100">
                <h4 class="text-2xl font-bold text-gray-900 mb-4">${get(profileData.nombre || profileData.name)}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-600">
                    <div class="flex items-center"><i class="fas fa-envelope mr-3 text-green-600"></i> ${get(contact.correo || contact.email)}</div>
                    ${get(contact.telefono || contact.phone) ? `<div class="flex items-center"><i class="fas fa-phone mr-3 text-green-600"></i> ${get(contact.telefono || contact.phone)}</div>` : ''}
                    ${get(contact.linkedin) ? `<div class="flex items-center"><i class="fab fa-linkedin mr-3 text-green-600"></i> <a href="${get(contact.linkedin)}" target="_blank" class="text-blue-600 hover:underline">LinkedIn</a></div>` : ''}
                </div>
            </div>

            <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h4 class="text-xl font-bold text-gray-900 mb-4 flex items-center border-b pb-4">
                    <i class="fas fa-user-tie mr-3 text-green-600"></i>${get(profileSections.summary)}
                </h4>
                <p class="text-gray-600 leading-relaxed">${get(profileData.resumen || profileData.summary)}</p>
            </div>

            ${getArr(profileData.experiencia || profileData.experience).length > 0 ? `
            <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h4 class="text-xl font-bold text-gray-900 mb-6 flex items-center border-b pb-4">
                    <i class="fas fa-briefcase mr-3 text-green-600"></i>${get(profileSections.experience)}
                </h4>
                <div class="space-y-8">
                    ${getArr(profileData.experiencia || profileData.experience).map(exp => `
                        <div class="relative pl-8 border-l-2 border-green-100">
                            <div class="absolute -left-2 top-0 w-4 h-4 rounded-full bg-green-200 border-4 border-white"></div>
                            <h5 class="text-lg font-bold text-gray-900">${get(exp.titulo || exp.title)}</h5>
                            <p class="text-green-700 font-medium">${get(exp.empresa || exp.company)}</p>
                            <p class="text-sm text-gray-500 mb-3">${get(exp.fechas || exp.dates)} ${get(exp.lugar || exp.location) ? `| ${get(exp.lugar || exp.location)}` : ''}</p>
                            <ul class="list-disc list-inside space-y-2 text-gray-600">
                                ${(() => {
            const desc = get(exp.descripcion || exp.description);
            const lines = desc.split(/\\n|\n|(?<=.)\s*\*\s+/).filter(l => l.trim() !== '');
            return lines.map(l => `<li>${l.replace(/^\* ?/, '').trim()}</li>`).join('');
        })()}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-bold text-gray-900 mb-4 border-b pb-4">${get(profileSections.technicalSkills)}</h4>
                    <div class="flex flex-wrap gap-2">
                        ${getArr(skills.tecnicas || skills.technical).map(skill => `<span class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">${get(skill)}</span>`).join('')}
                    </div>
                </div>

                ${getArr(profileData.educacion || profileData.education).length > 0 ? `
                <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-bold text-gray-900 mb-4 border-b pb-4">${get(profileSections.education)}</h4>
                    <div class="space-y-4">
                        ${getArr(profileData.educacion || profileData.education).map(edu => `
                            <div>
                                <p class="font-bold text-gray-900">${get(edu.titulo || edu.title)}</p>
                                <p class="text-gray-600 text-sm">${get(edu.institucion || edu.institution)} | ${get(edu.fechas || edu.dates)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
            </div>
        </div>
    `;
}

export function generateCvHtml(cvData) {
    cvData = cvData || {};
    const get = (val, def = '') => val || def;
    const getArr = (arr) => arr || [];
    const contact = cvData.contacto || cvData.contact || {};
    const skills = cvData.habilidades || cvData.skills || {};
    const profileSections = languageData[currentLanguage].profileSections || {};

    return `
        <div style="font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; font-size: 10.5pt; margin: 0; padding: 0; width: 100%; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 12px; padding-bottom: 2px; border-bottom: 1px solid #333;">
                <div style="font-size: 14pt; font-weight: bold; margin-bottom: 2px; text-transform: uppercase;">${get(cvData.nombre || cvData.name)}</div>
                <div style="font-size: 9.8pt; margin: 4px 0;">
                    ${get(contact.correo || contact.email)} ${get(contact.telefono || contact.phone) ? `| ${get(contact.telefono || contact.phone)}` : ''} ${get(contact.linkedin) ? `| ${get(contact.linkedin)}` : ''}
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <div style="font-size: 11.5pt; font-weight: bold; margin: 10px 0 2px 0; padding: 0 0 3px 5px; border-bottom: 1.5px solid #ddd;">${get(profileSections.summary)}</div>
                <div style="padding: 0 5px; text-align: justify;">${get(cvData.resumen || cvData.summary)}</div>
            </div>

            ${getArr(cvData.experiencia || cvData.experience).length > 0 ? `
            <div style="margin-bottom: 10px;">
                <div style="font-size: 11.5pt; font-weight: bold; margin: 10px 0 2px 0; padding: 0 0 3px 5px; border-bottom: 1.5px solid #ddd;">${get(profileSections.experience)}</div>
                ${getArr(cvData.experiencia || cvData.experience).map(exp => {
        const desc = get(exp.descripcion || exp.description);
        // Split by \n or by the asterisk separator (e.g. "Item 1 * Item 2")
        const lines = desc.split(/\\n|\n|(?<=.)\s*\*\s+/).filter(l => l.trim() !== '');
        return `
                    <div style="margin-bottom: 5px;">
                        <div><strong style="display: inline;">${get(exp.empresa || exp.company)} - ${get(exp.titulo || exp.title)}</strong> <span style="font-style: italic; font-size: 9.8pt; margin-left: 10px;">${get(exp.fechas || exp.dates)}</span></div>
                        <ul style="margin: 4px 0 4px 25px; padding: 0;">
                            ${lines.map(l => `<li style="margin: 2px 0; font-size: 10.2pt;">${l.replace(/^\* ?/, '').trim()}</li>`).join('')}
                        </ul>
                    </div>`;
    }).join('')}
            </div>` : ''}

            <div style="margin-bottom: 10px;">
                <div style="font-size: 11.5pt; font-weight: bold; margin: 10px 0 2px 0; padding: 0 0 3px 5px; border-bottom: 1.5px solid #ddd;">${get(profileSections.technicalSkills)} & ${get(profileSections.certifications)}</div>
                <table style="width:100%; border-collapse: collapse;">
                    <tr>
                        <td style="width:50%; vertical-align:top; padding-right:10px;">
                            <ul style="margin: 4px 0 0 20px; padding: 0;">
                                ${getArr(skills.tecnicas || skills.technical).map(s => `<li style="font-size: 10.2pt;">${get(s)}</li>`).join('')}
                            </ul>
                        </td>
                        <td style="width:50%; vertical-align:top; padding-left:10px;">
                            <ul style="margin: 4px 0 0 20px; padding: 0;">
                                ${getArr(skills.certificaciones || skills.certifications).slice(0, 8).map(c => `<li style="font-size: 10.2pt;">${get(c)}</li>`).join('')}
                            </ul>
                        </td>
                    </tr>
                </table>
            </div>

            ${getArr(cvData.educacion || cvData.education).length > 0 ? `
            <div style="margin-bottom: 10px;">
                <div style="font-size: 11.5pt; font-weight: bold; margin: 10px 0 2px 0; padding: 0 0 3px 5px; border-bottom: 1.5px solid #ddd;">${get(profileSections.education)}</div>
                ${getArr(cvData.educacion || cvData.education).map(edu => `
                    <div style="margin-bottom: 5px;">
                        <strong style="display: inline;">${get(edu.titulo || edu.title)}</strong> <span style="margin-left: 8px;">${get(edu.institucion || edu.institution)} | ${get(edu.fechas || edu.dates)}</span>
                    </div>`).join('')}
            </div>` : ''}
        </div>`;
}

export function downloadCvAsWord(htmlContent, filename) {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>CV</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = filename;
    fileDownload.click();
    document.body.removeChild(fileDownload);
}

export function renderRecommendations(recs) {
    if (!recs) return '';
    const getArr = (arr) => arr || [];
    const lang = languageData[currentLanguage];

    return `
        <div class="mt-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h5 class="font-bold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-lightbulb text-amber-500 mr-2"></i>${lang.keySkill}
                    </h5>
                    <div class="flex flex-wrap gap-2">
                        ${getArr(recs.habilidades_clave).map(s => `<span class="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100">${s}</span>`).join('')}
                    </div>
                </div>
                <div class="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h5 class="font-bold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-certificate text-blue-500 mr-2"></i>${lang.recommendedCertification}
                    </h5>
                    <div class="flex flex-wrap gap-2">
                        ${getArr(recs.certificaciones).map(c => `<span class="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">${c}</span>`).join('')}
                    </div>
                </div>
            </div>

            <div class="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h5 class="font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-graduation-cap text-green-600 mr-2"></i>${lang.recommendedCourses}
                </h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${getArr(recs.cursos_recomendados).map(course => `
                        <a href="${course.url}" target="_blank" class="p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
                            <div class="font-bold text-gray-900 group-hover:text-green-700">${course.nombre}</div>
                            <div class="text-xs text-gray-500">${course.entidad}</div>
                        </a>
                    `).join('')}
                </div>
            </div>

            <div class="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                <span class="text-sm font-bold text-green-800">${lang.estimatedImprovementTime}</span>
                <span class="px-4 py-1 bg-white text-green-700 rounded-full font-black text-sm shadow-sm">${recs.tiempo_estimado}</span>
            </div>
            
            ${getArr(recs.vacantes_sugeridas_perfil_actual).length > 0 ? `
            <div class="p-6 bg-gray-900 rounded-2xl text-white shadow-xl">
                 <h5 class="font-bold mb-4 flex items-center text-green-400">
                    <i class="fas fa-search-dollar mr-2"></i>${lang.suggestedVacanciesBasedOnProfile}
                </h5>
                <div class="space-y-4">
                    ${getArr(recs.vacantes_sugeridas_perfil_actual).map(v => `
                        <div class="border-l-2 border-green-500/30 pl-4 py-1">
                            <div class="font-bold">${v.rol}</div>
                            <div class="text-xs text-gray-400 mb-2">${v.descripcion_breve}</div>
                            <div class="flex gap-2">
                                ${getArr(v.portales).map(p => `<span class="text-[10px] px-2 py-0.5 bg-white/10 rounded uppercase font-bold">${p}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    `;
}

export function renderAnalysisDetails(analisis) {
    if (!analisis) return '';
    const getArr = (arr) => arr || [];
    const lang = languageData[currentLanguage];

    return `
        <div class="mt-8 space-y-6">
            <div class="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h5 class="font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-star text-yellow-500 mr-2"></i>${lang.strongPoints}
                </h5>
                <ul class="space-y-3">
                    ${getArr(analisis.puntos_fuertes).map(point => `
                        <li class="flex items-start text-gray-700 text-sm">
                            <i class="fas fa-check-circle text-green-500 mt-0.5 mr-3"></i>
                            ${point}
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="p-6 bg-blue-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
                <div class="relative z-10">
                    <h5 class="font-bold mb-4 flex items-center text-blue-300">
                        <i class="fas fa-comments mr-2"></i>${lang.interviewTips}
                    </h5>
                    <p class="text-sm leading-relaxed text-blue-50">${analisis.consejos}</p>
                </div>
                <div class="absolute top-0 right-0 p-8 opacity-10"><i class="fas fa-microphone-alt text-7xl"></i></div>
            </div>
        </div>
    `;
}
