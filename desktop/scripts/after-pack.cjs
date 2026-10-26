// electron-builder afterPack hook: stamps the LAMBA icon and version details into LAMBA.exe.
//
// electron-builder normally does this with rcedit, which needs Wine when building on
// Linux/macOS. This pure-Node version (using the `resedit` library) works on any OS,
// so the Windows installer can be built anywhere — including GitHub's Linux machines.
const fs = require('node:fs');
const path = require('node:path');
const ResEdit = require('resedit');

const LANG = 1033; // en-US
const CODEPAGE = 1200; // Unicode

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const { appInfo } = context.packager;
  const exePath = path.join(context.appOutDir, `${appInfo.productFilename}.exe`);
  const iconPath = path.join(context.packager.info.projectDir, 'build', 'icon.ico');

  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);

  // Icon: replace the app's main icon group (Electron ships it as group 1).
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const groupId = groups.length ? groups[0].id : 1;
  const groupLang = groups.length ? groups[0].lang : LANG;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    groupId,
    groupLang,
    iconFile.icons.map((item) => item.data)
  );

  // Version info shown in the file's Properties → Details tab and in Task Manager.
  const [major, minor, patch] = appInfo.version.split('.').map((n) => parseInt(n, 10) || 0);
  const versionInfo =
    ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
  versionInfo.setFileVersion(major, minor, patch, 0, LANG);
  versionInfo.setProductVersion(major, minor, patch, 0, LANG);
  versionInfo.setStringValues(
    { lang: LANG, codepage: CODEPAGE },
    {
      ProductName: appInfo.productName,
      FileDescription: appInfo.productName,
      CompanyName: appInfo.companyName || appInfo.productName,
      LegalCopyright: appInfo.copyright,
      InternalName: appInfo.productName,
      OriginalFilename: `${appInfo.productFilename}.exe`,
      FileVersion: appInfo.version,
      ProductVersion: appInfo.version
    }
  );
  versionInfo.outputToResourceEntries(res.entries);

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log(`  • stamped icon + version ${appInfo.version} into ${path.basename(exePath)}`);
};
