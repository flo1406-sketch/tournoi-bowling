import { createClient } from '@supabase/supabase-js';

// Remplace ces valeurs par tes clés Supabase
const supabaseUrl = 'https://ydicfydxpzhhvekgujjj.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_khrGPOkQt2zwAqwQwN8kgA_MImZq-SZ';

export const supabase = createClient(supabaseUrl, supabaseKey);