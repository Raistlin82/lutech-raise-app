import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ControlConfig } from '../types';

interface SettingsContextType {
    controls: ControlConfig[];
    addControl: (control: ControlConfig) => void;
    updateControl: (control: ControlConfig) => void;
    deleteControl: (id: string) => void;
    resetDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * DEFAULT_CONTROLS - Complete mapping from "Checklist_Supporto RAISE.xlsx"
 * Sheet: "Linea Guida alla gestione RAISE"
 *
 * Structure: Organized by RAISE Review Phase (ATP, ATS, ATC)
 * Each checkpoint includes:
 * - Exact document name from Excel
 * - Authorization levels (L1-L6)
 * - Mandatory conditions
 * - References to PSQ-003 procedure
 */
const DEFAULT_CONTROLS: ControlConfig[] = [
    // ============================================================================
    // PLANNING PHASE - Setup before ATP
    // ============================================================================
    {
        id: 'opp-site',
        label: 'Opportunity Site Created',
        description: 'Create SharePoint Opportunity Site from Salesforce',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'task'
    },
    {
        id: 'crm-case',
        label: 'Opportunità in Salesforce',
        description: 'Create opportunity in Salesforce CRM with required fields',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'task'
    },
    {
        id: 'offer-code',
        label: 'Codice Offerta',
        description: 'Generate offer code via Salesforce',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'task'
    },
    {
        id: 'grants',
        label: 'Grant Opportunity Site',
        description: 'Set permissions for BID team, Authorizers, Experts',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'task'
    },
    {
        id: 'small-ticket-check',
        label: 'Small Ticket Pre-Approval (< 5k€)',
        description: 'Industry Head pre-approval required for TCV < 5000€',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'task',
        condition: 'opp.isSmallTicket === true'
    },

    // ============================================================================
    // ATP PHASE - Authorization To Proceed (PSQ-003 §5.9.1)
    // ============================================================================
    {
        id: 'doc-request-atp',
        label: 'Richiesta d\'Offerta',
        description: 'Tender documentation, RFP, customer invitation to bid. Mandatory L1-L5, Optional L6',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'None (customer provided)',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4" || opp.raiseLevel === "L5")',
        detailedDescription: 'Caricare  Richiesta d\'offerta\nSono da condierarsi "Richiesta di offerta" (documento/i mandatorio):\n* Documentazione gara (pubblica e privata)\n* Inviti del Cliente a presentare Offerta\n* altri documenti assimilabili',
        folderPath: '01. BID\\01-Docs di gara'
    },
    {
        id: 'doc-request-atp-l6',
        label: 'Richiesta d\'Offerta (L6 Optional)',
        description: 'Tender documentation - Optional for L6',
        phase: 'ATP',
        isMandatory: false,
        actionType: 'document',
        condition: 'opp.raiseLevel === "L6"'
    },
    {
        id: 'mod-091-atp',
        label: 'MOD-091 Slide-deck ATP',
        description: 'ATP Slide-deck presentation (alternative to MOD-105 ATP section). Mandatory L1-L4',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        detailedDescription: 'Review via call\n* su salesforce attivare review via call\n* Predisporre e caricare le Slide-deck nell\'opportunity site\n* Predisporre e caricare il Verbale riunione nell\'opportunity site\nOppure, ove previsto,\nReview via email\n* su salesforce attivare review via email\n* Presenza email',
        folderPath: '01. BID\\03-ATP',
        templateRef: 'MOD-091',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'mod-105-atp',
        label: 'MOD-105 sezione ATP',
        description: 'MOD-105 ATP section (alternative to MOD-091). Mandatory L1-L4',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-105',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'atp-minutes',
        label: 'Verbale riunione ATP',
        description: 'ATP meeting minutes (if review via call). Mandatory L1-L4',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'mod-092-atp-l123',
        label: 'MOD-092 Deal Qualification (ATP L1-L3)',
        description: 'Deal Qualification form for ATP phase. Mandatory L1-L3',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-092',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")',
        detailedDescription: 'Popolare solo tabs 01, 02, 04',
        folderPath: '01. BID\\03-ATP'
    },
    {
        id: 'mod-092-atp-l4',
        label: 'MOD-092 Deal Qualification (ATP L4)',
        description: 'Deal Qualification form for ATP phase. Mandatory L4',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-092',
        condition: 'opp.raiseLevel === "L4"',
        detailedDescription: 'Popolare solo tabs 01, 02, 04',
        folderPath: '01. BID\\03-ATP'
    },

    // ============================================================================
    // ATS PHASE - Authorization To Submit (PSQ-003 §5.10.1)
    // ============================================================================
    {
        id: 'mod-001-rcp',
        label: 'MOD-001 P&L (RCP)',
        description: 'Revenue/Cost/Profit model. Economic values must match Salesforce. Mandatory L1-L6',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-001',
        detailedDescription: `Predisporre e caricare nell'opportunity site RCP. RPC deve rispettare le seguenti regole\n* i valori economici e margini su SF devono essere equivalenti a quelli dell'RCP (i margini devono essere comprensivi dei rischi) sia sui singoli prodtotti/servizi offerti, sia sul valore totale dell'opportunità che deve coincidere con quanto riportato nell'ultima riga dell'RCP (comprensiva di eventuale revenue aggiuntiva per costi amministrativi) (rif. frontespizio RCP)\n\nPotranno essere emesse più versioni dell'RCP fino ad ATC -> i controlli sopra dovranno essere soddisfatti per ogni RCP`,
        folderPath: '01. BID\\04-Economics'
    },
    {
        id: 'mod-093-risk-l123',
        label: 'MOD-093 Risk Register (L1-L3)',
        description: 'Risk assessment register. Mandatory L1-L3',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-093',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")'
    },
    {
        id: 'mod-093-risk-l45',
        label: 'MOD-093 Risk Register (L4-L5 conditional)',
        description: 'Risk assessment register. Mandatory only if KCP deviation OR Risk > 0%',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-093',
        condition: '((opp.raiseLevel === "L4" || opp.raiseLevel === "L5") && opp.hasKcpDeviations === true)',
        detailedDescription: 'Il Risk Register è Mandatorio in caso di\n* Deviazione KCP\n* Risk>0% on products e/o <3% services\n\n* dovrà essere inserito nell\'opportunity site \n* risk contingency deve avere gli stessi valori su Risk Register, RCP, SalesForce\n\nChiedere il parere al Risk Manager che dovrà essere inserito nell\'opportunity site \nPotranno essere emesse più versioni fino ad ATC -> i controlli sopra dovranno essere soddisfatti per ogni RR',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'offerta-tecnica-economica',
        label: 'Offerta Tecnica/Economica',
        description: 'Technical and/or Economic Offer to customer. Mandatory L1-L5',
        detailedDescription: 'Predisporre Offerta ->  si intende offerta tecnica-economica firmata dal procuratore autorizzato, ed i suoi allegati. Il documeto di offerta potrebbe essere: * Unico documento contenente sia offerta tecnica che economica\n* Un documento contenente la sola offerta tecnica ed un documento contenente la sola offerta economica.\nL\'offerta deve essere caricata nell\'opportunity site',
        folderPath: '01. BID\\05-ATS',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4" || opp.raiseLevel === "L5")'
    },
    {
        id: 'offerta-l6',
        label: 'Offerta (L6)',
        description: 'Offer to customer. Mandatory L6',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        condition: 'opp.raiseLevel === "L6"'
    },
    {
        id: 'date-offerta-ats',
        label: 'Congruenza Data Offerta - ATS',
        description: 'Verify offer date matches Salesforce ATS date. Mandatory L1-L5',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'task',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4" || opp.raiseLevel === "L5")'
    },
    {
        id: 'offerte-fornitori-ats',
        label: 'Offerte Fornitori',
        description: 'Supplier offers. Mandatory if suppliers involved',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        condition: 'opp.hasSuppliers === true',
        detailedDescription: 'Nel caso di applicabilità:\nATS\n*  dichiarare in SalesForce fornitori e supply-chain nell\'elenco prodotti/servizi associati all\'opportunità\n* le offerte fornitori devono essere presenti e caricate nell\'opportunity site\n* l\'offerta del fornitore deve avere periodo di validità congruente con quella ns offerta al Cliente e con la data di fornitura specificata nell\'ordine cliente\n* i prodotti in salesforce devono essere coerenti con quanto riportato nel RCP in termini di valore economico, margini e rischi\n\nNel caso di offerte fornitori prodotte o aggionate durante ATC:\n* dichiarare in SalesForce fornitori e supply-chain nell\'elenco prodotti/servizi associati all\'opportunità\n* le offerte fornitori devono essere presenti e caricate nell\'opportunity site\n* l\'offerta del fornitore deve avere periodo di validità congruente con quella ns offerta al Cliente e con la data di fornitura specificata nell\'ordine / contratto cliente\n* i prodotti in salesforce devono essere coerenti con quanto riportato nel RCP in termini di valore economico, margini e rischi\n\n\nI fornitori devono essere omologati. Nel caso non lo siano si dovrà chiedere a procurement affinchè vangano effettuate le opportune verifiche/omologazione.\n\nIn caso vi siano fornitori è responsabilità del Sales assicurarsi che la loro offerta sia full B2B rispetto alle condizioni imposte dal cliente, oppure che siano ribaltate al cliente le condizioni imposte dal vendor/distributore \n(sia in termini di condizioni d\'uso che in generale per il regime di responsabilità e penali).',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-procurement-fornitori-non-omologati',
        label: 'Expert Procurement - Fornitori non omologati',
        description: 'Procurement expert validation for non-approved suppliers. Mandatory if non-approved suppliers',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: 'opp.hasSuppliers === true'  // Simplified - would need "non-approved" flag
    },
    {
        id: 'expert-procurement-validazione',
        label: 'Expert Procurement - Validazione Offerte',
        description: 'Procurement validation of supplier offers. Mandatory for supplier validation',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: 'opp.hasSuppliers === true'
    },
    {
        id: 'mod-103-reselling',
        label: 'MOD-103 Tabella Reselling HW/SW',
        description: 'Reselling table for HW/SW products. Mandatory if SUBCO involved and reselling',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-103',
        condition: 'opp.hasSuppliers === true'  // Simplified - would need reselling flag
    },
    {
        id: 'expert-cmcio-reselling',
        label: 'Expert CMCIO',
        description: 'CMCIO expert validation. Mandatory for ALL opportunities with reselling',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: 'opp.hasSuppliers === true',  // Simplified - specific for reselling
        detailedDescription: 'Nel caso di rivendita prodotti è necessario coinvolgere Expert CMCIO anche per esprimere parere su eventuali "rebate" specifici.\n\n* richiedere coinvolgimento Expert  CMCIO.\n* Assicurarsi che le email siano inserite su opportunity Site.\n* tracciamanto del coinvogimento dell\'expert ed il suoi parere devono essere visibili in SalesForce\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto sopra.',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-legal-l123',
        label: 'Expert Legal (L1-L3)',
        description: 'Lutech Legal or delegates validation. Mandatory L1-L3',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")',
        detailedDescription: '* richiedere coinvolgimento Expert Lutech Legal o suoi delegati .\n* assicurarsi che le email siano inserite su opportunity site\n* tracciamanto del coinvogimento dell\'expert ed il suoi parere devono essere visibili in SalesForce.\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto sopra.',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-legal-l45',
        label: 'Expert Legal (L4-L5 conditional)',
        description: 'Lutech Legal validation. Mandatory L4-L5 only if KCP deviations',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: '((opp.raiseLevel === "L4" || opp.raiseLevel === "L5") && opp.hasKcpDeviations === true)'
    },
    {
        id: 'rti-patti-parasociali',
        label: 'Regolamento interno RTI (Patti Parasociali)',
        description: 'RTI internal regulation (consortium agreement). Mandatory if RTI',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        condition: 'opp.isRti === true',
        detailedDescription: 'Impostare per RTI in SalesForce il tipo di raggruppamanto\n     * NO se offerta non viene presentata in RTI (controllo NA)\n     * LUT Mandataria \n     * LUT Mandante\nNel caso di RTI deve essere inserito nell\'Oppotunity Site il regolamento interno dell\'RTI firmato (Patti Parasociali)',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'mod-512-anticorruzione-rti',
        label: 'MOD-512 Dichiarazione Anticorruzione ISO 37001',
        description: 'Anti-corruption declaration for RTI partners. Mandatory if RTI with Lutech as Mandataria',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-512',
        condition: 'opp.isRti === true && opp.isMandataria === true'
    },
    {
        id: 'mod-513-conflitti-rti',
        label: 'MOD-513 Dichiarazione Conflitti di Interesse',
        description: 'Conflict of interest declaration for RTI. Mandatory if RTI with Lutech as Mandataria',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-513',
        condition: 'opp.isRti === true && opp.isMandataria === true'
    },
    {
        id: 'mod-094-ats',
        label: 'MOD-094 Slide-deck ATS',
        description: 'ATS Slide-deck presentation (alternative to MOD-105 ATS section). Mandatory L1-L4',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-094',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")',
        detailedDescription: 'Review via call\n* su salesforce attivare review via call\n* Predisporre e caricare le Slide-deck nell\'opportunity site\n* Predisporre e caricare il Verbale riunione nell\'opportunity site\nOppure, ove previsto,\nReview via email\n* su salesforce attivare review via email\n* Presenza email',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'mod-105-ats',
        label: 'MOD-105 sezione ATS',
        description: 'MOD-105 ATS section (alternative to MOD-094). Mandatory L1-L4',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-105',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'ats-minutes',
        label: 'Verbale riunione ATS',
        description: 'ATS meeting minutes (if review via call). Mandatory L1-L4',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'mod-092-ats-l123',
        label: 'MOD-092 Deal Qualification (ATS L1-L3)',
        description: 'Deal Qualification form repeated in ATS phase. Mandatory L1-L3',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-092',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")',
        detailedDescription: 'Aggiornare tab 06 nel caso di Privacy ma non fare se è Var',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'mod-092-ats-l4',
        label: 'MOD-092 Deal Qualification (ATS L4)',
        description: 'Deal Qualification form repeated in ATS phase. Mandatory L4',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-092',
        condition: 'opp.raiseLevel === "L4"',
        detailedDescription: 'Aggiornare tab 06 nel caso di Privacy ma non fare se è Var',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-finance',
        label: 'Expert Finance',
        description: 'Finance expert validation. Mandatory if KCP deviations OR under-margin OR specific activities',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: 'opp.hasKcpDeviations === true || (opp.marginPercent !== undefined && opp.marginPercent < 16)',
        detailedDescription: '* richiedere coinvolgimento Expert  Finance\n* assicurarsi che le email siano inserite su opportunity site\n* tracciamanto del coinvogimento dell\'expert ed il suoi parere devono essere visibili in SalesForce.\n\nSI ricorda che nel caso in (ATC) il coinvolgimento FINANCE è anche per la validazione del TCV, margine, rischi, IFRS15 da registrare in SalesForce e successivamente in ERP.',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-ethical-risk',
        label: 'Expert Ethical Risk',
        description: 'Ethical Risk expert validation. Mandatory for foreign activities/deliveries/purchases',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: 'opp.isPublicSector === false',  // Simplified - would need "foreign" flag
        detailedDescription: '* richiedere coinvolgimento Expert Compliance Ethical Risk\n* assicurarsi che le email siano inserite su opportunity site\n* tracciamanto del coinvogimento dell\'expert ed il suoi parere devono essere visibili in SalesForce.\n\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto soprasi dovrà fare quanto sopra',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-compliance-esg',
        label: 'Expert Compliance/ESG',
        description: 'Compliance/ESG expert validation. Optional for sustainability and gas emissions topics',
        phase: 'ATS',
        isMandatory: false,
        actionType: 'email',
        detailedDescription: '* Nel caso si necessiti di chiarimenti/pareri per l\'ambito ESG richiedere coinvolgimento Expert Compliance/ESG\n* Nel caso sia richiesto il parare assicurarsi che le email siano inserite nell\'opportunity site\n\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto soprasi dovrà fare quanto sopra',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-compliance-sistemi',
        label: 'Expert Compliance - Sistemi Gestione',
        description: 'Compliance expert for management systems. Optional',
        phase: 'ATS',
        isMandatory: false,
        actionType: 'email',
        detailedDescription: '* Nel caso si necessiti di chiarimenti/pareri per ambito Sistemi di Gestione richiedere coinvolgimento Expert Compliance/sistemigestione\n* Nel caso sia richiesto il parare assicurarsi che le email siano inserite nell\'opportunity site\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto soprasi dovrà fare quanto sopra',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-compliance-general',
        label: 'Expert Compliance - Generale',
        description: 'Compliance expert for non-specific topics. Optional',
        phase: 'ATS',
        isMandatory: false,
        actionType: 'email',
        detailedDescription: '* Nel caso si necessiti di chiarimenti/pareri per ambito generico Compliance richiedere coinvolgimento richiedere coinvolgimento Expert Compliance\n* Nel caso sia richiesto il parare assicurarsi che le email siano inserite nell\'opportunity site\n\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto soprasi dovrà fare quanto sopra',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-dpm',
        label: 'Expert DPM (Data Privacy Manager)',
        description: 'Data Privacy Manager validation. Mandatory if "Privacy Risk" is High or Medium',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: 'false'  // Would need privacyRisk field
    },
    {
        id: 'expert-senior-risk-manager-l123',
        label: 'Expert Senior Risk Manager (L1-L3)',
        description: 'Senior Risk Manager validation. Mandatory L1-L3',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")',
        detailedDescription: '* richiedere coinvolgimento Expert\n* assicurarsi che le email di tracciamento siano inserite nell\'opportunity site\n* tracciamanto del coinvogimento dell\'expert ed il suoi parere devono essere visibili in SalesForce\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto soprasi dovrà fare quanto sopra',
        folderPath: '01. BID\\05-ATS'
    },
    {
        id: 'expert-senior-risk-manager-l45',
        label: 'Expert Senior Risk Manager (L4-L5 conditional)',
        description: 'Senior Risk Manager validation. Mandatory L4-L5 only if KCP deviation OR Risk > 0%',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'email',
        condition: '((opp.raiseLevel === "L4" || opp.raiseLevel === "L5") && opp.hasKcpDeviations === true)'
    },
    {
        id: 'expert-security-officer',
        label: 'Expert Chief Security Officer',
        description: 'Chief Security Officer validation. Optional - involve for security issues',
        phase: 'ATS',
        isMandatory: false,
        actionType: 'email'
    },
    {
        id: 'expert-hse',
        detailedDescription: '* Nel caso si necessiti di chiarimenti/pareri per l\'ambito HSE richiedere coinvolgimento Expert Lutech HSE Head\n* Nel caso sia richiesto il parare assicurarsi che le email siano inserite \n\n\nNel caso si verifichi la condizione in fase di "Negoziation, Pending" (ATC)" si deve tener conto di quanto soprasi dovrà fare quanto sopra',
        folderPath: '01. BID\\05-ATS',
        label: 'Expert HSE Head',
        description: 'HSE (Health, Safety, Environment) Head validation. Optional - involve for HSE issues',
        phase: 'ATS',
        isMandatory: false,
        actionType: 'email'
    },
    {
        id: 'expert-chro',
        label: 'Expert CHRO (Chief Human Resources Officer)',
        description: 'CHRO validation. Optional - involve for HR issues',
        phase: 'ATS',
        isMandatory: false,
        actionType: 'email'
    },

    // ============================================================================
    // ATC PHASE - Authorization To Commit (PSQ-003 §5.11.1)
    // ============================================================================
    {
        id: 'date-rcp-atc',
        label: 'Congruenza Date RCP - ATC',
        description: 'Verify RCP date matches Salesforce ATC date. Mandatory L1-L6',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'task',
        detailedDescription: 'La data dell\'RCP non deve essere superiore alla data di chiusura dell\'ATC (SalesForce)'
    },
    {
        id: 'mod-092-atc-l123',
        label: 'MOD-092 Deal Qualification (ATC L1-L3)',
        description: 'Deal Qualification form repeated in ATC phase. Mandatory L1-L3',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-092',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")',
        detailedDescription: 'Aggiornare tab 06 nel caso di Privacy ma non fare se è VAR',
        folderPath: '01. BID\\07-ATC'
    },
    {
        id: 'mod-092-atc-l4',
        label: 'MOD-092 Deal Qualification (ATC L4)',
        description: 'Deal Qualification form repeated in ATC phase. Mandatory L4',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-092',
        condition: 'opp.raiseLevel === "L4"',
        detailedDescription: 'Aggiornare tab 06 nel caso di Privacy ma non fare se è VAR',
        folderPath: '01. BID\\07-ATC'
    },
    {
        id: 'mod-095-atc',
        label: 'MOD-095 Slide-deck ATC',
        description: 'ATC Slide-deck presentation (alternative to MOD-105 ATC section). Mandatory L1-L4',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-095',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")',
        detailedDescription: 'Review via call\n* su salesforce attivare review via call\n* Predisporre e caricare le Slide-deck nell\'opportunity site\n* Predisporre e caricare il Verbale riunione nell\'opportunity site\nOppure, ove previsto,\nReview via email\n* su salesforce attivare review via email\n* Presenza email',
        folderPath: '01. BID\\07-ATC'
    },
    {
        id: 'mod-105-atc',
        label: 'MOD-105 sezione ATC',
        description: 'MOD-105 ATC section (alternative to MOD-095). Mandatory L1-L4',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-105',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'atc-minutes',
        label: 'Verbale riunione ATC',
        description: 'ATC meeting minutes (if review via call). Mandatory L1-L4',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
    },
    {
        id: 'scheda-referenza-l123',
        label: 'Scheda Referenza MOD-101/MOD-102',
        description: 'Reference sheet for customer case study. Mandatory L1-L3',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-101, MOD-102',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")'
    },
    {
        id: 'scheda-referenza-l45',
        label: 'Scheda Referenza MOD-101/MOD-102 (L4-L5 Optional)',
        description: 'Reference sheet - optional for L4-L5, produce only if significant',
        phase: 'ATC',
        isMandatory: false,
        actionType: 'document',
        templateRef: 'MOD-101, MOD-102',
        condition: '(opp.raiseLevel === "L4" || opp.raiseLevel === "L5")'
    },
    {
        id: 'contract-order',
        label: 'Contract/Order',
        description: 'Signed contract or order. Mandatory L1-L6',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        detailedDescription: 'Inserire il documento Contratto o Ordine nell\'oppurtunity site',
        folderPath: '01. BID'
    },
    {
        id: 'date-contract-atc',
        label: 'Congruenza Data Contratto - ATC',
        description: 'Verify contract date matches Salesforce ATC date. Mandatory if contract exists',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'task',
        condition: 'false',  // Would need contractExists flag
        detailedDescription: 'La data di firma del contratto deve essere posteriore o uguale a quella di chiusura ATC (SalesForce).\nQual\'ora ATC sia stato effettuato in "Anticipo d\'Ordine" la data della lettera si anticipo d\'ordine ricevuta dal Cliente deve essere precedente a quella dell\'ATC e la data di firma del Contratto  sarà successiva a qualla dell\'ATC.\nL\'"Anticipo d\'Ordine" deve essere inserito nell\'opportunity site ed opportunamente taggato',
        folderPath: '01. BID\\08-Contratto'
    },
    {
        id: 'date-order-ats',
        label: 'Congruenza Data Ordine - ATS',
        description: 'Verify order date matches Salesforce ATS date. Mandatory if orders exist',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'task',
        condition: 'false',  // Would need ordersExist flag
        detailedDescription: 'La data dell\'ordine deve essere successiva a quella dell\'ATS (SalesForce), ove previsto ATS, e deve essere compatibile con quella dell\'ATC (SalesForce); Qual\'ora ATC sia stato effettuato in "Anticipo d\'Ordine" la data della lettera si anticipo d\'ordine ricevuta dal Cliente deve essere precedente a quella dell\'ATC e la data dell\'Ordine sarà successiva a qualla dell\'ATC.\nL\'"Anticipo d\'Ordine" deve essere inserito nell\'opportunity site ed opportunamente taggato',
        folderPath: '01. BID\\08-Contratto'
    },
    {
        id: 'mod-096b-handover-l123',
        label: 'MOD-096B Handover Checklist (L1-L3)',
        description: 'Handover checklist for delivery transition. Mandatory L1-L3',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-096B',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")',
        detailedDescription: '* Predisporre (AM+Delivery) HandOver checklist che dovrà essere inserito nell\'opportunity site\n* HandOver deve essere coerente con l\'attuale situazione\n* Popolare la copertina (una riga per aggiornamanto emesso)\n\nPotranno essere emesse più versioni i controlli sopra dovranno essere soddisfatti per ogni HandOver',
        folderPath: '01. BID\\09-HND'
    },
    {
        id: 'mod-096b-handover-l4',
        label: 'MOD-096B Handover Checklist (L4 conditional)',
        description: 'Handover checklist. Mandatory L4 only for services',
        phase: 'ATC',
        isMandatory: true,
        actionType: 'document',
        templateRef: 'MOD-096B',
        condition: 'opp.raiseLevel === "L4" && (opp.servicesValue !== undefined && opp.servicesValue > 0)',
        detailedDescription: '* Predisporre (AM+Delivery) HandOver checklist che dovrà essere inserito nell\'opportunity site\n* HandOver deve essere coerente con l\'attuale situazione\n* Popolare la copertina (una riga per aggiornamanto emesso)\n\nPotranno essere emesse più versioni i controlli sopra dovranno essere soddisfatti per ogni HandOver',
        folderPath: '01. BID\\09-HND'
    },

    // ============================================================================
    // HANDOVER PHASE - Post-WON Transition
    // ============================================================================
    {
        id: 'handover-meeting-l123',
        label: 'Handover Meeting (L1-L3)',
        description: 'Formal handover meeting from Sales to Delivery. Mandatory L1-L3',
        phase: 'Handover',
        isMandatory: true,
        actionType: 'task',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")'
    },
    {
        id: 'handover-meeting-l4',
        label: 'Handover Meeting (L4 Optional)',
        description: 'Handover meeting - optional for L4',
        phase: 'Handover',
        isMandatory: false,
        actionType: 'task',
        condition: 'opp.raiseLevel === "L4"'
    },
    {
        id: 'winloss-review',
        label: 'Win-Loss Review',
        description: 'Post-sale analysis to capture lessons learned',
        phase: 'Handover',
        isMandatory: true,
        actionType: 'task',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3")'
    },
    {
        id: 'delivery-grant',
        label: 'Delivery Team Grant',
        description: 'Grant Opportunity Site access to delivery team',
        phase: 'Handover',
        isMandatory: true,
        actionType: 'task'
    },

    // ============================================================================
    // ATS PHASE - ADDITIONAL CONTROLS
    // ============================================================================
    {
        id: 'date-congruence-offer-ats',
        label: 'Congruenza Data Offerta - ATS',
        description: 'Verify offer submission date matches Salesforce ATS date',
        detailedDescription: 'L\'offerta  firmata deve avere data maggiore o uguale alla data della chiusura ATS (SaalesForce).',
        phase: 'ATS',
        isMandatory: true,
        actionType: 'task',
        condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4" || opp.raiseLevel === "L5")',
        mandatoryNotes: 'Mandatorio L1-L5 - Excel Index 10'
    },

    // ============================================================================
    // ALL PHASE - Under-margin Authorizations (Excel Index 51-59)
    // PSQ-003 §5.3.2 Key Financial Targets & §5.4 Matrice di Autorizzazione
    // ============================================================================

    // Under-margin VAR/Products (Index 51-56)
    {
        id: 'undermargin-var-below-6pct',
        label: 'Autorizzazione Under-margin VAR <6%',
        description: 'Additional authorization required for First Margin < 6% on VAR/Products, any TCV',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.firstMarginPercent !== undefined && opp.firstMarginPercent < 6)',
        mandatoryNotes: 'Mandatorio per First Margin % <6% per qualsiasi TCV - Excel Index 51'
    },
    {
        id: 'undermargin-var-6-10pct-0-1m',
        label: 'Autorizzazione Under-margin VAR 6-10% (TCV 0-1M€)',
        description: 'Additional authorization for First Margin 6-10% on VAR/Products, TCV 0-1M€',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.firstMarginPercent !== undefined && opp.firstMarginPercent >= 6 && opp.firstMarginPercent < 10 && opp.raiseTcv < 1000000)',
        mandatoryNotes: 'Mandatorio per First Margin compreso tra 6%-10% per TCV compreso 0-1 M€ - Excel Index 52'
    },
    {
        id: 'undermargin-var-6-10pct-over-1m',
        label: 'Autorizzazione Under-margin VAR 6-10% (TCV >1M€)',
        description: 'Additional authorization for First Margin 6-10% on VAR/Products, TCV > 1M€',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.firstMarginPercent !== undefined && opp.firstMarginPercent >= 6 && opp.firstMarginPercent < 10 && opp.raiseTcv >= 1000000)',
        mandatoryNotes: 'Mandatorio per First Margin compreso tra 6%-10% per TCV > 1 M€ - Excel Index 53'
    },
    {
        id: 'undermargin-var-10-16pct-0-1m',
        label: 'Autorizzazione Under-margin VAR 10-16% (TCV 0-1M€)',
        description: 'Additional authorization for First Margin 10-16% on VAR/Products, TCV 0-1M€',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.firstMarginPercent !== undefined && opp.firstMarginPercent >= 10 && opp.firstMarginPercent < 16 && opp.raiseTcv < 1000000)',
        mandatoryNotes: 'Mandatorio per First Margin compreso tra 10%-16% per TCV compreso 0-1 M€ - Excel Index 54'
    },
    {
        id: 'undermargin-var-10-16pct-over-1m',
        label: 'Autorizzazione Under-margin VAR 10-16% (TCV >1M€)',
        description: 'Additional authorization for First Margin 10-16% on VAR/Products, TCV > 1M€',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.firstMarginPercent !== undefined && opp.firstMarginPercent >= 10 && opp.firstMarginPercent < 16 && opp.raiseTcv >= 1000000)',
        mandatoryNotes: 'Mandatorio per First Margin compreso tra 10%-16% per TCV > 1 M€ - Excel Index 55'
    },
    {
        id: 'undermargin-var-over-16pct',
        label: 'Nessuna Autorizzazione Under-margin VAR ≥16%',
        description: 'No additional authorization required for First Margin ≥ 16% on VAR/Products',
        phase: 'ALL',
        isMandatory: false,
        actionType: 'task',
        condition: '(opp.firstMarginPercent !== undefined && opp.firstMarginPercent >= 16)',
        mandatoryNotes: 'Nessuna autorizzazione aggiuntiva per First Margin >=16% per qualsiasi TCV - Excel Index 56'
    },

    // Under-margin Services (Index 57-59)
    {
        id: 'undermargin-services-0-250k',
        label: 'Autorizzazione Under-margin Servizi (TCV 0-250k€)',
        description: 'Additional authorization for Service First Margin below target by Practice, TCV 0-250k€. Ref: Sheet "Under-margin - Slide with Services"',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.servicesValue !== undefined && opp.servicesValue > 0 && opp.raiseTcv < 250000 && opp.firstMarginPercent !== undefined)',
        mandatoryNotes: 'Mandatorio per First Margin % by Practice / Sotto target per 1 o più Practice TCV compreso tra 0-250 k€ - Excel Index 57'
    },
    {
        id: 'undermargin-services-250k-1m',
        label: 'Autorizzazione Under-margin Servizi (TCV 250k-1M€)',
        description: 'Additional authorization for Service First Margin below target by Practice, TCV 250k-1M€. Ref: Sheet "Under-margin - Slide with Services"',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.servicesValue !== undefined && opp.servicesValue > 0 && opp.raiseTcv >= 250000 && opp.raiseTcv < 1000000 && opp.firstMarginPercent !== undefined)',
        mandatoryNotes: 'Mandatorio per First Margin % by Practice / Sotto target per 1 o più Practice TCV compreso tra 250k€ - 1 M€ - Excel Index 58'
    },
    {
        id: 'undermargin-services-over-1m',
        label: 'Autorizzazione Under-margin Servizi (TCV >1M€)',
        description: 'Additional authorization for Service First Margin below target by Practice, TCV > 1M€. Ref: Sheet "Under-margin - Slide with Services"',
        phase: 'ALL',
        isMandatory: true,
        actionType: 'email',
        condition: '(opp.servicesValue !== undefined && opp.servicesValue > 0 && opp.raiseTcv >= 1000000 && opp.firstMarginPercent !== undefined)',
        mandatoryNotes: 'Mandatorio per First Margin % by Practice / Sotto target per 1 o più Practice TCV > 1 M€ - Excel Index 59'
    }
];

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [controls, setControls] = useState<ControlConfig[]>(() => {
        const saved = localStorage.getItem('raise_controls');
        return saved ? JSON.parse(saved) : DEFAULT_CONTROLS;
    });

    useEffect(() => {
        localStorage.setItem('raise_controls', JSON.stringify(controls));
    }, [controls]);

    const addControl = (control: ControlConfig) => {
        setControls([...controls, control]);
    };

    const updateControl = (updated: ControlConfig) => {
        setControls(controls.map(c => c.id === updated.id ? updated : c));
    };

    const deleteControl = (id: string) => {
        setControls(controls.filter(c => c.id !== id));
    };

    const resetDefaults = () => {
        setControls(DEFAULT_CONTROLS);
        localStorage.setItem('raise_controls', JSON.stringify(DEFAULT_CONTROLS));
    };

    return (
        <SettingsContext.Provider value={{ controls, addControl, updateControl, deleteControl, resetDefaults }}>
            {children}
        </SettingsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
