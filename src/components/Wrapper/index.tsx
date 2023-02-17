import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { useEffect } from 'react';

export const Context = React.createContext(null);
const local = localStorage.getItem('local') || navigator.language;
let lang: any;

const switchLanguage = (local: string) => {
  switch (local) {
    case 'en':
      lang = 'en';
      break;
    case 'zh-CN':
      break;
    case 'vi':
      break;
    case 'uk':
      break;
    case 'ru':
      break;
    case 'ja':
      break;
    case 'ko':
      break;
    case 'es':
      break;
    default:
      lang = 'en';
      break;
  }
};

const changeLocale = (local: string) => {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, newValue) {
    const setItemEvent = new Event('setItemEvent');
    setItemEvent[key] = newValue;
    window.dispatchEvent(setItemEvent);
    originalSetItem.apply(this, [key, newValue]);
  };

  switchLanguage(local);
  localStorage.setItem('local', local);
};

changeLocale(local);

const Wrapper = (props: any) => {
  const [locale, setLocale] = useState(local);
  const [messages, setMessages] = useState(lang);

  function selectLanguage(e: string) {
    const newLocale = e;
    changeLocale(newLocale);
    setLocale(newLocale);
    setMessages(lang);
  }

  useEffect(() => {
    setMessages(lang);
  }, [lang]);

  return (
    <Context.Provider value={{ locale, selectLanguage, setLocale, setMessages } as any}>
      <IntlProvider messages={messages} locale={locale}>
        {props.children}
      </IntlProvider>
    </Context.Provider>
  );
};

export default Wrapper;
