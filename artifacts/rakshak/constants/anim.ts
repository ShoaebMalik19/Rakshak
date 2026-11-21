import { Platform } from 'react-native';

/** The native animation driver does not exist on web; using it there only logs warnings. */
export const NATIVE_DRIVER = Platform.OS !== 'web';
