import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Opportunity } from '../types';
import { calculateRaiseLevel } from '../lib/raiseLogic';
import { validateOpportunity } from '../lib/validation';
import { showToast } from '../lib/toast';
import {
    fetchOpportunities,
    createOpportunity,
    updateOpportunity as apiUpdateOpportunity,
    deleteOpportunity as apiDeleteOpportunity,
} from '@/api/opportunities';

interface OpportunitiesContextType {
    opportunities: Opportunity[];
    loading: boolean;
    selectedOpp: Opportunity | null;
    selectOpportunity: (opp: Opportunity | null) => void;
    updateOpportunity: (opp: Opportunity) => Promise<void>;
    addOpportunity: (opp: Opportunity, userEmail: string) => Promise<Opportunity>;
    deleteOpportunity: (id: string) => Promise<void>;
    refreshOpportunities: () => Promise<void>;
}

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

// No initial demo data - users will create their own opportunities
const INITIAL_OPPORTUNITIES: Opportunity[] = [];

// Helper to read opportunities from localStorage synchronously (for test mode)
function getInitialOpportunities(): Opportunity[] {
    if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
        const stored = localStorage.getItem('raise_opportunities');
        if (stored) {
            try {
                return JSON.parse(stored) as Opportunity[];
            } catch (e) {
                console.error('[OpportunitiesStore] Failed to parse opportunities from localStorage', e);
            }
        }
    }
    return INITIAL_OPPORTUNITIES;
}

export const OpportunitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>(getInitialOpportunities);
    const [loading, setLoading] = useState(true);
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

    // Load opportunities from Supabase API on mount
    const loadOpportunities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchOpportunities();

            // Recalculate raiseLevel for each opportunity
            const opps = data.map((opp: Opportunity) => ({
                ...opp,
                raiseLevel: calculateRaiseLevel(opp)
            }));

            setOpportunities(opps);
        } catch (error) {
            console.error('Failed to load opportunities:', error);
            showToast.error('Errore nel caricamento opportunità');
            setOpportunities(INITIAL_OPPORTUNITIES);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshOpportunities = useCallback(async () => {
        await loadOpportunities();
    }, [loadOpportunities]);

    const selectOpportunity = (opp: Opportunity | null) => {
        setSelectedOpp(opp);
    };

    const updateOpportunity = async (updatedOpp: Opportunity): Promise<void> => {
        const validation = validateOpportunity(updatedOpp);
        if (!validation.success) {
            console.error('Invalid opportunity:', validation.error);
            showToast.error('Dati non validi. Controlla i campi e riprova.');
            throw new Error('Invalid opportunity data: ' + validation.error.message);
        }

        try {
            const updated = await apiUpdateOpportunity(updatedOpp.id, updatedOpp);
            setOpportunities(prev => prev.map(o => o.id === updated.id ? updated : o));
            if (selectedOpp && selectedOpp.id === updated.id) {
                setSelectedOpp(updated);
            }
            showToast.success(`Opportunità "${updated.title}" aggiornata!`);
        } catch (error) {
            console.error('Failed to update opportunity:', error);
            showToast.error('Errore nell\'aggiornamento dell\'opportunità');
            throw error;
        }
    };

    const addOpportunity = async (opp: Opportunity, userEmail: string): Promise<Opportunity> => {
        const validation = validateOpportunity(opp);
        if (!validation.success) {
            console.error('Invalid opportunity:', validation.error);
            showToast.error('Dati non validi. Controlla i campi e riprova.');
            throw new Error('Invalid opportunity data: ' + validation.error.message);
        }

        try {
            const created = await createOpportunity(opp, userEmail);
            setOpportunities(prev => [...prev, created]);
            showToast.success(`Opportunità "${created.title}" creata con successo!`);
            return created;
        } catch (error) {
            console.error('Failed to add opportunity:', error);
            showToast.error('Errore nella creazione dell\'opportunità');
            throw error;
        }
    };

    const deleteOpportunity = async (id: string): Promise<void> => {
        const opp = opportunities.find(o => o.id === id);
        try {
            await apiDeleteOpportunity(id);
            setOpportunities(prev => prev.filter(o => o.id !== id));
            if (selectedOpp && selectedOpp.id === id) {
                setSelectedOpp(null);
            }
            showToast.success(`Opportunità "${opp?.title}" eliminata.`);
        } catch (error) {
            console.error('Failed to delete opportunity:', error);
            showToast.error('Errore nell\'eliminazione dell\'opportunità');
            throw error;
        }
    };

    return (
        <OpportunitiesContext.Provider value={{
            opportunities,
            loading,
            selectedOpp,
            selectOpportunity,
            updateOpportunity,
            addOpportunity,
            deleteOpportunity,
            refreshOpportunities,
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
