// electron-builder afterPack hook — deep ad-hoc signs the macOS bundle.
//
// Why: electron-builder 25 reads `mac.identity: '-'` as a keychain identity
// NAME, fails the lookup, and skips signing entirely — leaving the bundle
// either unsigned (x64) or carrying an invalidated linker signature (arm64).
// A quarantined unsigned bundle triggers the unrecoverable "X is damaged"
// error on macOS 13+. A proper deep ad-hoc signature (`codesign --sign -`)
// downgrades that to the recoverable "unidentified developer" dialog without
// needing a paid Apple Developer ID. See CLAUDE.md → macOS signing notes.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  execFileSync('codesign', ['--deep', '--force', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
};
