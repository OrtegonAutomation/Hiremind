export function getStructurePrompt(textContent, lang) {
    if (lang === 'es') {
        return `
            Transforma el siguiente texto de un currículum en un objeto JSON. El JSON debe tener esta estructura exacta:
            {
              "nombre": "string",
              "contacto": { "correo": "string", "telefono": "string", "linkedin": "string" },
              "resumen": "string",
              "experiencia": [{ "titulo": "string", "empresa": "string", "fechas": "string", "descripcion": "string" }],
              "educacion": [{ "titulo": "string", "institucion": "string", "fechas": "string" }],
              "habilidades": { 
                "tecnicas": ["string"], 
                "certificaciones": ["string"], 
                "logros": ["string"],
                "idiomas": { "idioma": "nivel" }
              }
            }
            Asegúrate de que **todas las claves** en el JSON estén entre comillas dobles, por ejemplo: \`"nombre": "valor"\`.
            Extrae la información del texto y ajústala a esta estructura. La descripción de la experiencia debe ser un solo string, puedes escapar '\\n' para saltos de línea.
            La salida JSON DEBE estar en español.
            Texto del CV:
            ---
            ${textContent}
        `;
    } else {
        return `
            Transform the following resume text into a JSON object. The JSON must have this exact structure:
            {
              "name": "string",
              "contact": { "email": "string", "phone": "string", "linkedin": "string" },
              "summary": "string",
              "experience": [{ "title": "string", "company": "string", "dates": "string", "description": "string" }],
              "education": [{ "title": "string", "institution": "string", "dates": "string" }],
              "skills": { 
                "technical": ["string"], 
                "certifications": ["string"], 
                "achievements": ["string"],
                "languages": { "language": "level" }
              }
            }
            Ensure that **all keys** in the JSON are double-quoted, for example: \`"name": "value"\`.
            Extract the information from the text and adapt it to this structure. The experience description should be a single string, you can escape '\\n' for line breaks.
            The JSON output MUST be in English.
            CV Text:
            ---
            ${textContent}
        `;
    }
}

export function getSummaryPrompt(structuredCv, lang) {
    if (lang === 'es') {
        return `
            Resume brevemente el siguiente perfil profesional en un párrafo. Limítate a indicar profesión, años de experiencia, áreas clave, herramientas que domina y fortalezas generales. No repitas frases textuales del CV.
            Perfil JSON:
            ---
            ${JSON.stringify(structuredCv)}
        `;
    } else {
        return `
            Briefly summarize the following professional profile in one paragraph. Limit yourself to indicating profession, years of experience, key areas, mastered tools, and general strengths. Do not repeat verbatim phrases from the CV.
            Profile JSON:
            ---
            ${JSON.stringify(structuredCv)}
        `;
    }
}

export function getCompatibilityPrompt(userProfile, offerText, lang) {
    const isEs = lang === 'es';

    return `
        ${isEs ? 'Analiza la compatibilidad' : 'Analyze the compatibility'} between the candidate's profile and the job requirements. STRICTLY ADJUST these elements:
        1. Professional profile (${isEs ? 'elimina frases como "busco aplicar mi experiencia"' : 'eliminate phrases like "I seek to apply my experience"'} ✅ Mandatory:
        "[Relevant Title] with [X] years in [key area].
        Specialized in [skill 1], [skill 2], and [skill 3] certified by [entity].
        Achieved [Metric 1], [Metric 2].
        With a focus on [Concrete value for the role].")
        2. Responsibilities in each work experience (${isEs ? 'enfocado en palabras clave de la vacante' : 'focused on job keywords'} MANDATORY)
        3. Certifications (format: "Name - Year") - **IMPORTANT: Select a maximum of 8 most relevant certifications. Only include Name and Year. Prioritize relevance over quantity.**
        4. Technical skills (format: "Skill (level)")
        5. Achievements (quantifiable and aligned)

        ${isEs ? 'Sigue este proceso' : 'Follow this process'}:

        ### 1. IMPROVED Compatibility Analysis
        - ${isEs ? 'Extrae requisitos clave de la oferta' : 'Extract key requirements from the job offer'} (e.g., "Advanced Python", "SAP MM", "Agile project management").
        - ${isEs ? 'Compara punto por punto con el perfil del candidato' : 'Compare point by point with the candidate\'s profile'}.
        - ${isEs ? 'Calcula compatibilidad REAL' : 'Calculate REAL compatibility'}:
        [(Matching skills / Total required) * 40] +
        [(Relevant years of experience / Required years) * 35] +
        [(Matching certifications/education / Total required) * 25]

        Specific Adjustments (CRITICAL!) MANDATORY
        - PROFESSIONAL PROFILE (4-5 lines) Adjusted to the Job Offer:
        Forbidden: "I seek to apply", "provide solutions", "I wish to contribute".
        Mandatory:
        "[Relevant Title] with [X] years in [key area].
        Specialized in [skill 1], [skill 2], and [skill 3] certified by [entity].
        Achieved [Metric 1], [Metric 2].
        With a focus on [Concrete value for the role]."

        - WORK RESPONSIBILITIES (for each experience) Adjusted to the job offer:
        Forbidden: Generic descriptions.
        Mandatory:
        ${isEs ? 'Usa verbos en primera persona del singular en pasado (ej: "Diseñé", "Desarrollé", "Vendí")' : 'Use first-person singular past tense verbs (e.g., "I designed", "I developed", "I sold")'} for the responsibilities in the generated CV.
        [Action Verb] [job keyword] in [context] (e.g., "I optimized ETL flows with Python reducing times by 40%")
        Maximum 3 bullet points per position
        Use percentages/values in achievements

        - CERTIFICATIONS:
        Forbidden: Incomplete names or including entity.
        Mandatory:
        "Exact Name - Year" (e.g., 'Azure Data Engineer - 2023')
        **IMPORTANT: Select a maximum of 8 most relevant certifications. Only include Name and Year. Prioritize relevance over quantity. ALWAYS PRIORITIZE ATS COMPATIBILITY.**
        
        - KEY ACHIEVEMENTS:
        Forbidden: Do not adjust the achievement to the job offer.
        Mandatory:
        Adjust key achievements towards the job offer, enter percentages.

        Important: do not round default values. Calculate the percentage truly based on what you detect.
        VERY IMPORTANT: DO NOT ADD MORE YEARS OF EXPERIENCE THAN THE USER ALREADY HAS IN THEIR PROFILE. ONLY ADJUST EXISTING INFORMATION TO THE JOB OFFER.

        2. Decision making:
        - If compatibility >= 70%:
            Generate a CV in JSON format with this exact structure...
            {
                "cv_final": {
                    "name": "Full Name",
                    "contact": { "email": "email@example.com", "phone": "+123456789", "linkedin": "profile-url" },
                    "summary": "4-5 line professional summary focused on the job offer...",
                    "experience": [ { "title": "Job Title", "company": "Company Name", "location": "City, Country", "dates": "Month. YearStart – Month. YearEnd", "description": "* Responsibility 1 (using first-person singular past tense verb, e.g., 'Designed')\\n* Responsibility 2\\n* Quantifiable achievement. MANDATORY MAXIMUM 3 RESPONSIBILITIES" } ],
                    "education": [ { "title": "Academic Degree", "institution": "Educational Institution", "dates": "YearStart – YearEnd", "thesis": "Thesis title (if applicable)" } ],
                    "skills": { "technical": ["Skill 1 (level)", "Skill 2 (level)"], "certifications": ["Certification 1 - Year", "Certification 2 - Year"], "achievements": ["Professional achievement 1", "Professional achievement 2"], "languages": {"Spanish": "Native", "English": "Advanced"} }
                }
            }

        - If compatibility < 70%:
            Generate improvement recommendations and a modified CV.
            {
                "recomendaciones": {
                    "habilidades_clave": [ "skill" ],
                    "certificaciones": [ "cert" ],
                    "cursos_recomendados": [ { "nombre": "Name", "entidad": "entity", "url": "URL" } ],
                    "tiempo_estimado": "X-Y months",
                    "recursos_gratuitos": [ { "nombre": "name", "url": "link", "tipo": "type" } ],
                    "proyectos_recomendados": [ "type" ],
                    "vacantes_sugeridas_perfil_actual": [ { "rol": "role", "descripcion_breve": "desc", "portales": ["P1"] } ]
                },
                "cv_final": { ... }
            }

        3. FINAL Output Format (MANDATORY):
        {
            "analisis": {
                "nivelAjuste": "0-100",
                "experiencia_Dest": "text",
                "HabilidadesClave":"text",
                "Logros_rele": "text",
                "nombreVACANTE": "title",
                "porcentaje_compatibilidad": "percentage",
                "es_compatible": boolean,
                "habilidades_faltantes": ["skill"],
                "experiencia_faltante": "text",
                "consejos": "interview tips",
                "puntos_fuertes": ["point"]
            },
            "output": { "recomendaciones": {}, "cv_final": {} }
        }

        ${isEs ? 'Perfil del Candidato' : 'Candidate Profile'}:
        ${JSON.stringify(userProfile)}

        ${isEs ? 'Detalles de la Vacante' : 'Job Details'}:
        ${offerText}

        ${isEs ? 'POR FAVOR RESPONDE EN ESPAÑOL.' : 'PLEASE RESPOND IN ENGLISH.'}
    `;
}

export function getMergePrompt(userProfile, updateText, lang) {
    if (lang === 'es') {
        return `
            Actualiza el siguiente JSON de historia laboral con la nueva información proporcionada. Integra los nuevos datos de forma coherente en la estructura existente. No elimines información, solo añade o fusiona.
            Tu respuesta DEBE ser únicamente el objeto JSON completo y actualizado.
            ---
            HISTORIA LABORAL ACTUAL (JSON):
            ${JSON.stringify(userProfile)}
            ---
            NUEVA INFORMACIÓN (Texto):
            ${updateText}
        `;
    } else {
        return `
            Update the following work history JSON with the new information provided.
            Your response MUST be only the complete and updated JSON object.
            ---
            CURRENT WORK HISTORY (JSON):
            ${JSON.stringify(userProfile)}
            ---
            NEW INFORMATION (Text):
            ${updateText}
        `;
    }
}

export function getJobRecPrompt(userProfile, lang) {
    if (lang === 'es') {
        return `
            Basado en el siguiente perfil, sugiere 5 roles y para cada uno, 2 portales de empleo.
            Formato JSON: { "recomendaciones_empleo": [ { "rol": "Rol", "portales": ["Portal1", "Portal2"] } ] }
            Perfil: ${JSON.stringify(userProfile)}
        `;
    } else {
        return `
            Based on the following profile, suggest 5 roles and for each, 2 job portals.
            JSON Format: { "job_recommendations": [ { "role": "Role", "portals": ["Portal1", "Portal2"] } ] }
            Profile: ${JSON.stringify(userProfile)}
        `;
    }
}
