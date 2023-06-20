import type { ChangeEvent } from 'react';
import { requestMeasure } from '../../lib/fasterdom/fasterdom';

import type { FC } from '../../lib/teact/teact';
import React, {
  memo, useCallback, useEffect, useLayoutEffect, useRef, useState,
} from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import type { GlobalState } from '../../global/types';
import type { LangCode } from '../../types';
import type { ApiCountryCode } from '../../api/types';

import { IS_SAFARI, IS_TOUCH_ENV } from '../../util/windowEnvironment';
import preloadFonts from '../../util/fonts';
import { pick } from '../../util/iteratees';
import { formatPhoneNumber, getCountryCodesByIso, getCountryFromPhoneNumber } from '../../util/phoneNumber';
import { setLanguage } from '../../util/langProvider';
import useLang from '../../hooks/useLang';
import useFlag from '../../hooks/useFlag';
import useLangString from '../../hooks/useLangString';
import { getSuggestedLanguage } from './helpers/getSuggestedLanguage';

import Button from '../ui/Button';
import InputText from '../ui/InputText';

type StateProps = Pick<GlobalState, (
  'connectionState' | 'authState' |
  'authPhoneNumber' | 'authIsLoading' |
  'authIsLoadingQrCode' | 'authError' |
  'authRememberMe' | 'authNearestCountry'
)> & {
  language?: LangCode;
  phoneCodeList: ApiCountryCode[];
};

const MIN_NUMBER_LENGTH = 7;

let isPreloadInitiated = false;

const AuthPhoneNumber: FC<StateProps> = ({
  connectionState,
  authState,
  authPhoneNumber,
  authIsLoading,
  authError,
  authNearestCountry,
  phoneCodeList,
  language,
}) => {
  const {
    setAuthPhoneNumber,
    setAuthRememberMe,
    loadNearestCountry,
    loadCountryList,
    clearAuthError,
    setSettingOption,
  } = getActions();

  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestedLanguage = getSuggestedLanguage();
  const currentViewportHeight = useRef<number>(Number(window.visualViewport!.height));
  const isFocused = useRef<boolean>(false);

  const continueText = useLangString(suggestedLanguage, 'ContinueOnThisLanguage', true);
  const [country, setCountry] = useState<ApiCountryCode | undefined>();
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [isTouched, setIsTouched] = useState(false);
  const [lastSelection, setLastSelection] = useState<[number, number] | undefined>();
  const [isLoading, markIsLoading, unmarkIsLoading] = useFlag();

  const fullNumber = country ? `+${country.countryCode} ${phoneNumber || ''}` : phoneNumber;
  const canSubmit = fullNumber && fullNumber.replace(/[^\d]+/g, '').length >= MIN_NUMBER_LENGTH;

  useEffect(() => {
    if (!IS_TOUCH_ENV) {
      inputRef.current!.focus();
    }
  }, [country]);

  useEffect(() => {
    setAuthRememberMe(true);

    inputRef.current!.addEventListener('click', (_) => {
      if (!isFocused.current) {
        inputRef.current!.style.transform = 'TranslateY(-10000px)';
        inputRef.current!.style.caretColor = 'transparent';
        setTimeout(() => {
          inputRef.current!.style.transform = 'none';
          const scrollPixel = containerRef.current!.clientHeight
            - currentViewportHeight.current + (window?.numberKeyboardHeight ?? 0) / 1.15 + 10;

          if (scrollPixel > 0) {
            containerRef.current!.style.transform = `translateY(${-scrollPixel}px)`;
            containerRef.current!.style.transition = 'transform 0.2s linear';
          }
          setTimeout(() => {
            inputRef.current!.style.caretColor = '#8774E1';
          }, 180);
        }, 80);
        isFocused.current = true;
      }
    });

    inputRef.current!.addEventListener('blur', (event) => {
      isFocused.current = false;
      containerRef.current!.style.transform = 'translateY(0)';
      containerRef.current!.style.transition = 'transform 0.2s linear';
    });
  }, []);

  useEffect(() => {
    if (connectionState === 'connectionStateReady' && !authNearestCountry) {
      loadNearestCountry();
    }
  }, [connectionState, authNearestCountry, loadNearestCountry]);

  useEffect(() => {
    if (connectionState === 'connectionStateReady') {
      loadCountryList({ langCode: language });
    }
  }, [connectionState, language, loadCountryList]);

  useEffect(() => {
    if (authNearestCountry && phoneCodeList && !country && !isTouched) {
      setCountry(getCountryCodesByIso(phoneCodeList, authNearestCountry)[0]);
    }
  }, [country, authNearestCountry, isTouched, phoneCodeList]);

  const parseFullNumber = useCallback((newFullNumber: string) => {
    if (!newFullNumber.length) {
      setPhoneNumber('');
    }

    const suggestedCountry = phoneCodeList && getCountryFromPhoneNumber(phoneCodeList, newFullNumber);

    // Any phone numbers should be allowed, in some cases ignoring formatting
    const selectedCountry = !country
    || (suggestedCountry && suggestedCountry.iso2 !== country.iso2)
    || (!suggestedCountry && newFullNumber.length)
      ? suggestedCountry
      : country;

    if (!country || !selectedCountry || (selectedCountry && selectedCountry.iso2 !== country.iso2)) {
      setCountry(selectedCountry);
    }
    setPhoneNumber(formatPhoneNumber(newFullNumber, selectedCountry));
  }, [phoneCodeList, country]);

  const handleLangChange = useCallback(() => {
    markIsLoading();

    void setLanguage(suggestedLanguage, () => {
      unmarkIsLoading();

      setSettingOption({ language: suggestedLanguage });
    });
  }, [markIsLoading, setSettingOption, suggestedLanguage, unmarkIsLoading]);

  useEffect(() => {
    if (phoneNumber === undefined && authPhoneNumber) {
      parseFullNumber(authPhoneNumber);
    }
  }, [authPhoneNumber, phoneNumber, parseFullNumber]);

  useLayoutEffect(() => {
    if (inputRef.current && lastSelection) {
      inputRef.current.setSelectionRange(...lastSelection);
    }
  }, [lastSelection]);

  const isJustPastedRef = useRef(false);
  const handlePaste = useCallback(() => {
    isJustPastedRef.current = true;
    requestMeasure(() => {
      isJustPastedRef.current = false;
    });
  }, []);

  const handlePhoneNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (authError) {
      clearAuthError();
    }

    // This is for further screens. We delay it until user input to speed up the initial loading.
    if (!isPreloadInitiated) {
      isPreloadInitiated = true;
      preloadFonts();
    }

    const { value, selectionStart, selectionEnd } = e.target;
    setLastSelection(
      selectionStart && selectionEnd && selectionEnd < value.length
        ? [selectionStart, selectionEnd]
        : undefined,
    );

    setIsTouched(true);

    const shouldFixSafariAutoComplete = (
      IS_SAFARI && country && fullNumber !== undefined
      && value.length - fullNumber.length > 1 && !isJustPastedRef.current
    );
    parseFullNumber(shouldFixSafariAutoComplete ? `${country!.countryCode} ${value}` : value);
  }, [authError, clearAuthError, country, fullNumber, parseFullNumber]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inputRef.current!.blur();

    if (authIsLoading) {
      return;
    }

    if (canSubmit) {
      setAuthPhoneNumber({ phoneNumber: fullNumber });
    }
  }

  const isAuthReady = authState === 'authorizationStateWaitPhoneNumber';

  return (
    <div className="custom-wrapper">
      <div
        ref={containerRef}
        className="auth-form"
      >
        <div id="logo" />
        <h1>Sign in to Telegram</h1>
        <p className="note">{lang('StartText1')}<br />{lang('StartText2')}</p>
        <form className="form" action="" onSubmit={handleSubmit}>
          <InputText
            ref={inputRef}
            className="relative"
            id="sign-in-phone-number"
            label={lang('Login.PhonePlaceholder')}
            value={fullNumber}
            error={authError && lang(authError)}
            loadingSize="medium"
            inputMode="tel"
            onChange={handlePhoneNumberChange}
            onPaste={IS_SAFARI ? handlePaste : undefined}
            onLoading={!authNearestCountry && !country}
            disabled={!authNearestCountry && !country}
          />

          <Button
            className={`capitalize-text ${canSubmit && isAuthReady ? 'btn-enable' : 'btn-disable'}`}
            type="submit"
            disabled={!canSubmit || !isAuthReady}
            ripple={(canSubmit && isAuthReady) || '' || undefined}
            isLoading={authIsLoading}
          >{lang('Login.Next')}
          </Button>
          {suggestedLanguage && suggestedLanguage !== language && continueText && (
            <Button isText isLoading={isLoading} onClick={handleLangChange}>{continueText}</Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): StateProps => {
    const {
      settings: { byKey: { language } },
      countryList: { phoneCodes: phoneCodeList },
    } = global;

    return {
      ...pick(global, [
        'connectionState',
        'authState',
        'authPhoneNumber',
        'authIsLoading',
        'authIsLoadingQrCode',
        'authError',
        'authRememberMe',
        'authNearestCountry',
      ]),
      language,
      phoneCodeList,
    };
  },
)(AuthPhoneNumber));
