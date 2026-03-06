import { supabase } from '@/lib/supabase';

export interface GeneralSettings {
  timezone: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  timezone: 'America/Buenos_Aires',
};

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const { data } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'general')
    .eq('name', 'General Settings')
    .maybeSingle();

  if (!data?.config) return DEFAULT_SETTINGS;

  const config = data.config as Record<string, unknown>;
  return {
    timezone: (config.timezone as string) || DEFAULT_SETTINGS.timezone,
  };
}
