/**
 * Control Service
 * Handles CRUD operations for controls (checkpoints configuration) with Supabase/localStorage fallback
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ControlConfig } from '../types';
import type { Database } from '../lib/database.types';

type ControlRow = Database['public']['Tables']['controls']['Row'];
type ControlInsert = Database['public']['Tables']['controls']['Insert'];
type TemplateLinkRow = Database['public']['Tables']['control_template_links']['Row'];

const STORAGE_KEY = 'raise_controls';

/**
 * Convert database row to ControlConfig type
 */
function rowToControl(row: ControlRow, templateLinks: TemplateLinkRow[] = []): ControlConfig {
    return {
        id: row.id,
        label: row.label,
        description: row.description || '',
        phase: row.phase as ControlConfig['phase'],
        order: row.sort_order || undefined,
        isMandatory: row.is_mandatory,
        actionType: row.action_type as ControlConfig['actionType'] || undefined,
        condition: row.condition || undefined,
        detailedDescription: row.detailed_description || undefined,
        folderPath: row.folder_path || undefined,
        mandatoryNotes: row.mandatory_notes || undefined,
        templateRef: row.template_ref || undefined,
        templateLinks: templateLinks.length > 0
            ? templateLinks.map(tl => ({ name: tl.name, url: tl.url }))
            : undefined,
    };
}

/**
 * Convert ControlConfig to database insert format
 */
function controlToInsert(control: ControlConfig): ControlInsert {
    return {
        id: control.id,
        label: control.label,
        description: control.description || null,
        phase: control.phase,
        sort_order: control.order || null,
        is_mandatory: control.isMandatory,
        action_type: control.actionType || null,
        condition: control.condition || null,
        detailed_description: control.detailedDescription || null,
        folder_path: control.folderPath || null,
        mandatory_notes: control.mandatoryNotes || null,
        template_ref: control.templateRef || null,
    };
}

/**
 * Get all controls
 */
export async function getControls(): Promise<ControlConfig[]> {
    // Detect test mode - skip Supabase and use localStorage directly
    const urlParams = new URLSearchParams(window.location.search);
    const testModeParam = urlParams.get('testMode') === 'true';
    const iasAuthority = import.meta.env.VITE_IAS_AUTHORITY || '';
    const iasClientId = import.meta.env.VITE_IAS_CLIENT_ID || '';
    const isTestMode =
        testModeParam ||  // Query parameter override for production E2E tests
        import.meta.env.VITE_TEST_MODE === 'true' ||
        iasAuthority.includes('mock') ||
        iasClientId.includes('mock') ||
        !iasAuthority ||
        !iasClientId;

    if (!isTestMode && isSupabaseConfigured() && supabase) {
        const { data: controls, error } = await supabase
            .from('controls')
            .select('*')
            .order('phase')
            .order('sort_order');

        if (error) {
            console.error('Supabase error fetching controls:', error);
            throw new Error(`Failed to fetch controls: ${error.message}`);
        }

        if (!controls || controls.length === 0) {
            return [];
        }

        // Fetch template links for all controls
        // @ts-expect-error - Missing table definition in Supabase types
        const controlIds = controls.map(c => c.id);
        const { data: templateLinks } = await supabase
            .from('control_template_links')
            .select('*')
            .in('control_id', controlIds)
            .order('sort_order');

        const linksByControl: Record<string, TemplateLinkRow[]> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (templateLinks || []).forEach((tl: any) => {
            if (!linksByControl[tl.control_id]) {
                linksByControl[tl.control_id] = [];
            }
            linksByControl[tl.control_id].push(tl);
        });

        // @ts-expect-error - Missing table definition in Supabase types
        return controls.map(c => rowToControl(c, linksByControl[c.id] || []));
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Get a single control by ID
 */
export async function getControl(id: string): Promise<ControlConfig | null> {
    if (isSupabaseConfigured() && supabase) {
        const [controlResult, linksResult] = await Promise.all([
            supabase.from('controls').select('*').eq('id', id).single(),
            supabase.from('control_template_links').select('*').eq('control_id', id).order('sort_order'),
        ]);

        if (controlResult.error) {
            if (controlResult.error.code === 'PGRST116') return null;
            console.error('Supabase error fetching control:', controlResult.error);
            throw new Error(`Failed to fetch control: ${controlResult.error.message}`);
        }

        return rowToControl(controlResult.data, linksResult.data || []);
    }

    // Fallback to localStorage
    const controls = await getControls();
    return controls.find(c => c.id === id) || null;
}

/**
 * Create a new control
 */
export async function createControl(control: ControlConfig): Promise<ControlConfig> {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('controls')
            // @ts-expect-error - Missing table definition in Supabase types
            .insert(controlToInsert(control))
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating control:', error);
            throw new Error(`Failed to create control: ${error.message}`);
        }

        // Insert template links if any
        if (control.templateLinks && control.templateLinks.length > 0) {
            const linkData = control.templateLinks.map((tl, index) => ({
                control_id: control.id,
                name: tl.name,
                url: tl.url,
                sort_order: index,
            }));
            // @ts-expect-error - Missing table definition in Supabase types
            await supabase.from('control_template_links').insert(linkData);
        }

        return rowToControl(data);
    }

    // Fallback to localStorage
    const controls = await getControls();
    controls.push(control);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
    return control;
}

/**
 * Update an existing control
 */
export async function updateControl(control: ControlConfig): Promise<ControlConfig> {
    if (isSupabaseConfigured() && supabase) {
        const insertData = controlToInsert(control);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...updateData } = insertData;

        const { data, error } = await supabase
            .from('controls')
            // @ts-expect-error - Missing table definition in Supabase types
            .update(updateData)
            .eq('id', control.id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating control:', error);
            throw new Error(`Failed to update control: ${error.message}`);
        }

        // Update template links - delete all and re-insert
        await supabase.from('control_template_links').delete().eq('control_id', control.id);
        if (control.templateLinks && control.templateLinks.length > 0) {
            const linkData = control.templateLinks.map((tl, index) => ({
                control_id: control.id,
                name: tl.name,
                url: tl.url,
                sort_order: index,
            }));
            // @ts-expect-error - Missing table definition in Supabase types
            await supabase.from('control_template_links').insert(linkData);
        }

        return rowToControl(data);
    }

    // Fallback to localStorage
    const controls = await getControls();
    const index = controls.findIndex(c => c.id === control.id);
    if (index === -1) {
        throw new Error('Control not found');
    }
    controls[index] = control;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
    return control;
}

/**
 * Delete a control
 */
export async function deleteControl(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
        // Delete template links first
        await supabase.from('control_template_links').delete().eq('control_id', id);

        const { error } = await supabase
            .from('controls')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting control:', error);
            throw new Error(`Failed to delete control: ${error.message}`);
        }

        return;
    }

    // Fallback to localStorage
    const controls = await getControls();
    const filtered = controls.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Reset controls to defaults (bulk insert)
 */
export async function resetControls(defaultControls: ControlConfig[]): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
        // Delete all existing controls (cascade will handle template links)
        await supabase.from('control_template_links').delete().neq('id', '');
        await supabase.from('controls').delete().neq('id', '');

        // Insert all default controls
        const controlData = defaultControls.map(controlToInsert);
        const { error } = await supabase
            .from('controls')
            // @ts-expect-error - Missing table definition in Supabase types
            .insert(controlData);

        if (error) {
            console.error('Supabase error resetting controls:', error);
            throw new Error(`Failed to reset controls: ${error.message}`);
        }

        // Insert all template links
        const allLinks: Array<{
            control_id: string;
            name: string;
            url: string;
            sort_order: number;
        }> = [];

        defaultControls.forEach(control => {
            if (control.templateLinks) {
                control.templateLinks.forEach((tl, index) => {
                    allLinks.push({
                        control_id: control.id,
                        name: tl.name,
                        url: tl.url,
                        sort_order: index,
                    });
                });
            }
        });

        if (allLinks.length > 0) {
            // @ts-expect-error - Missing table definition in Supabase types
            await supabase.from('control_template_links').insert(allLinks);
        }

        return;
    }

    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultControls));
}

/**
 * Check if the service is using Supabase or localStorage
 */
export function isUsingSupabase(): boolean {
    return isSupabaseConfigured();
}
