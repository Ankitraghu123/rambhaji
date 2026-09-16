import Constants from 'expo-constants';
import appConfigJson from '../app.json';
import packageJson from '../package.json';

/**
 * Application Branding and Metadata
 * Dynamically resolves current version from Expo configuration or package manifest.
 */
export const APP_INFO = {
    name: 'Ayush14 Timer',
    releaseName: 'Genesis',
    developer: 'Ayush14',
    // Dynamically read from Expo config, app.json, or package.json
    version: (Constants && Constants.expoConfig && Constants.expoConfig.version)
        || (appConfigJson && appConfigJson.expo && appConfigJson.expo.version)
        || (packageJson && packageJson.version)
        || '1.0.0',
    get displayVersion() {
        return `v${this.version} — ${this.releaseName}`;
    },
    get fullDisplayName() {
        return `${this.name} ${this.displayVersion}`;
    },
};
