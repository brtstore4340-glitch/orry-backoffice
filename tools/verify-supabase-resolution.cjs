const path = require("node:path");

const root = process.cwd();

function check(pkg) {
  try {
    const resolved = require.resolve(pkg, { paths: [root] });
    console.log(`[RESOLVED] ${pkg} => ${resolved}`);
    return 0;
  } catch (err) {
    console.error(`[MISSING] ${pkg} => ${err.message}`);
    return 1;
  }
}

let failed = 0;
failed += check("@supabase/ssr");
failed += check("@supabase/supabase-js");

process.exit(failed > 0 ? 1 : 0);