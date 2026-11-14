import { createClient } from '@supabase/supabase-js';

// L'URL de base de ton projet (SANS le /rest/v1/)
const supabaseUrl = 'https://ydicfydxpzhhvekgujjj.supabase.co';
const supabaseKey = 'sb_publishable_khrGPOkQt2zwAqwQwN8kgA_MImZq-SZ';

export const supabase = createClient(supabaseUrl, supabaseKey);