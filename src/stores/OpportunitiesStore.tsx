import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Opportunity } from '../types';
import { calculateRaiseLevel } from '../lib/raiseLogic';
import { validateStorageData, validateOpportunity } from '../lib/validation';
import { showToast } from '../lib/toast';

interface OpportunitiesContextType {
    opportunities: Opportunity[];
    selectedOpp: Opportunity | null;
    selectOpportunity: (opp: Opportunity | null) => void;
    updateOpportunity: (opp: Opportunity) => void;
    addOpportunity: (opp: Opportunity) => void;
    deleteOpportunity: (id: string) => void;
}

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

// No initial demo data - users will create their own opportunities
const INITIAL_OPPORTUNITIES: Opportunity[] = [];

export const OpportunitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
        const saved = localStorage.getItem('raise_opportunities');
        if (!saved) return INITIAL_OPPORTUNITIES;

        try {
            const parsed = JSON.parse(saved);
            const validation = validateStorageData(parsed);

            if (!validation.success) {
                console.error('Invalid data in localStorage:', validation.error);
                // Optionally show error to user
                return INITIAL_OPPORTUNITIES;
            }

            const opps = validation.data;

            // Recalculate raiseLevel for all opportunities
            return opps.map((opp: Opportunity) => ({
                ...opp,
                raiseLevel: calculateRaiseLevel(opp)
            }));
        } catch (e) {
            console.error('Failed to parse localStorage data:', e);
            return INITIAL_OPPORTUNITIES;
        }
    });

    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

    useEffect(() => {
        localStorage.setItem('raise_opportunities', JSON.stringify(opportunities));
    }, [opportunities]);

    const selectOpportunity = (opp: Opportunity | null) => {
        setSelectedOpp(opp);
    };

    const updateOpportunity = (updatedOpp: Opportunity) => {
        const validation = validateOpportunity(updatedOpp);
        if (!validation.success) {
            console.error('Invalid opportunity:', validation.error);
            showToast.error('Dati non validi. Controlla i campi e riprova.');
            throw new Error('Invalid opportunity data: ' + validation.error.message);
        }
        setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        if (selectedOpp && selectedOpp.id === updatedOpp.id) {
            setSelectedOpp(updatedOpp);
        }
        showToast.success(`Opportunità "${updatedOpp.title}" aggiornata!`);
    };

    const addOpportunity = (opp: Opportunity) => {
        const validation = validateOpportunity(opp);
        if (!validation.success) {
            console.error('Invalid opportunity:', validation.error);
            showToast.error('Dati non validi. Controlla i campi e riprova.');
            throw new Error('Invalid opportunity data: ' + validation.error.message);
        }
        setOpportunities(prev => [...prev, opp]);
        showToast.success(`Opportunità "${opp.title}" creata con successo!`);
    };

    const deleteOpportunity = (id: string) => {
        const opp = opportunities.find(o => o.id === id);
        setOpportunities(prev => prev.filter(o => o.id !== id));
        if (selectedOpp && selectedOpp.id === id) {
            setSelectedOpp(null);
        }
        showToast.success(`Opportunità "${opp?.title}" eliminata.`);
    };

    return (
        <OpportunitiesContext.Provider value={{
            opportunities,
            selectedOpp,
            selectOpportunity,
            updateOpportunity,
            addOpportunity,
            deleteOpportunity
        }}>
            {children}
        </OpportunitiesContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOpportunities = () => {
    const context = useContext(OpportunitiesContext);
    if (!context) {
        throw new Error('useOpportunities must be used within an OpportunitiesProvider');
    }
    return context;
};
