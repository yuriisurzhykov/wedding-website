/**
 * Writes bcrypt hash to admin_site_credential (singleton row). Requires service_role.
 * Usage: npm run admin:set-password -- <new-password>
 */
"use strict";

const bcrypt = require("bcryptjs");
const {createClient} = require("@supabase/supabase-js");

const pwd = process.argv[2];
if (!pwd) {
    console.error("Usage: npm run admin:set-password -- <new-password>");
    process.exit(1);
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error(
        "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in the environment.",
    );
    process.exit(1);
}

const hash = bcrypt.hashSync(pwd, 12);
const supabase = createClient(url, key);

void (async () => {
    const {error} = await supabase.from("admin_site_credential").upsert(
        {id: 1, password_hash: hash},
        {onConflict: "id"},
    );
    if (error) {
        console.error("Failed to upsert admin_site_credential:", error.message);
        process.exit(1);
    }
    console.log("Stored admin password hash in admin_site_credential (id = 1).");
})();
