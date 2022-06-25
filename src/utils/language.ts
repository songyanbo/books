import { ipcRenderer } from 'electron';
import { DEFAULT_LANGUAGE } from 'fyo/utils/consts';
import { setLanguageMapOnTranslationString } from 'fyo/utils/translation';
import { fyo } from 'src/initFyo';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { showToast } from './ui';

// Language: Language Code in books/translations
export const languageCodeMap: Record<string, string> = {
  English: 'en',
  Chinese: 'zh',
  French: 'fr',
  German: 'de',
  Portuguese: 'pt',
  Arabic: 'ar',
  Catalan: 'ca-ES',
  Spanish: 'es',
  Dutch: 'nl',
};

export async function setLanguageMap(
  initLanguage?: string,
  dontReload: boolean = false
) {
  const oldLanguage = fyo.config.get('language') as string;
  initLanguage ??= oldLanguage;
  const { code, language, usingDefault } = getLanguageCode(
    initLanguage,
    oldLanguage
  );

  let success = true;
  if (code === 'en') {
    setLanguageMapOnTranslationString(undefined);
  } else {
    success = await fetchAndSetLanguageMap(code);
  }

  if (success && !usingDefault) {
    fyo.config.set('language', language);
  }

  if (!dontReload && success && initLanguage !== oldLanguage) {
    await ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
  }
  return success;
}

function getLanguageCode(initLanguage: string, oldLanguage: string) {
  let language = initLanguage ?? oldLanguage;
  let usingDefault = false;

  if (!language) {
    language = DEFAULT_LANGUAGE;
    usingDefault = true;
  }
  const code = languageCodeMap[language] ?? 'en';
  return { code, language, usingDefault };
}

async function fetchAndSetLanguageMap(code: string) {
  const { success, message, languageMap } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_LANGUAGE_MAP,
    code
  );

  if (!success) {
    showToast({ type: 'error', message });
  } else {
    setLanguageMapOnTranslationString(languageMap);
    fyo.db.translateSchemaMap(languageMap);
  }

  return success;
}
