import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Opportunity } from '../types';
import { calculateRaiseLevel } from '../lib/raiseLogic';
import { validateStorageData, validateOpportunity } from '../lib/validation';
import { showToast } from '../lib/toast';
import * as opportunityService from '../services/opportunityService';

interface OpportunitiesContextType {
    opportunities: Opportunity[];
    loading: boolean;
    selectedOpp: Opportunity | null;
    selectOpportunity: (opp: Opportunity | null) => void;
    updateOpportunity: (opp: Opportunity) => Promise<void>;
    addOpportunity: (opp: Opportunity) => Promise<void>;
    deleteOpportunity: (id: string) => Promise<void>;
    refreshOpportunities: () => Promise<void>;
}

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

// No initial demo data - users will create their own opportunities
const INITIAL_OPPORTUNITIES: Opportunity[] = [];

export const OpportunitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
    const [loading, setLoading] = useState(true);
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

    // Load opportunities from service on mount
    const loadOpportunities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await opportunityService.getOpportunities();

            // Validate and recalculate raiseLevel
            const validation = validateStorageData(data);
            if (!validation.success) {
                console.error('Invalid opportunity data from service:', validation.error);
                setOpportunities(INITIAL_OPPORTUNITIES);
                return;
            }

            const opps = validation.data.map((opp: Opportunity) => ({
                ...opp,
                raiseLevel: calculateRaiseLevel(opp)
            }));

            setOpportunities(opps);
        } catch (error) {
            console.error('Failed to load opportunities:', error);
            showToast.error('Errore nel caricamento opportunità');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOpportunities();
    }, [loadOpportunities]);

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
            await opportunityService.updateOpportunity(updatedOpp);
            setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
            if (selectedOpp && selectedOpp.id === updatedOpp.id) {
                setSelectedOpp(updatedOpp);
            }
            showToast.success(`Opportunità "${updatedOpp.title}" aggiornata!`);
        } catch (error) {
            console.error('Failed to update opportunity:', error);
            showToast.error('Errore nell\'aggiornamento dell\'opportunità');
            throw error;
        }
    };

    const addOpportunity = async (opp: Opportunity): Promise<void> => {
        const validation = validateOpportunity(opp);
        if (!validation.success) {
            console.error('Invalid opportunity:', validation.error);
            showToast.error('Dati non validi. Controlla i campi e riprova.');
            throw new Error('Invalid opportunity data: ' + validation.error.message);
        }

        try {
            await opportunityService.createOpportunity(opp);
            setOpportunities(prev => [...prev, opp]);
            showToast.success(`Opportunità "${opp.title}" creata con successo!`);
        } catch (error) {
            console.error('Failed to add opportunity:', error);
            showToast.error('Errore nella creazione dell\'opportunità');
            throw error;
        }
    };

    const deleteOpportunity = async (id: string): Promise<void> => {
        const opp = opportunities.find(o => o.id === id);
        try {
            await opportunityService.deleteOpportunity(id);
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
