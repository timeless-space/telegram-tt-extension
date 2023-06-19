import type { FormEvent } from 'react';
import type { FC } from '../../lib/teact/teact';
import React, {
  useState, useEffect, useCallback, memo, useRef,
} from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import type { GlobalState } from '../../global/types';

import { IS_TOUCH_ENV } from '../../util/windowEnvironment';
import { pick } from '../../util/iteratees';
import useHistoryBack from '../../hooks/useHistoryBack';
import useLang from '../../hooks/useLang';

import InputText from '../ui/InputText';
import { fallbackLangPackInitial as langPack } from '../../util/fallbackLangPackInitial';

type StateProps = Pick<GlobalState, 'authPhoneNumber' | 'authIsCodeViaApp' | 'authIsLoading' | 'authError'>;

const CODE_LENGTH = 5;

const AuthCode: FC<StateProps> = ({
  authPhoneNumber,
  authIsLoading,
  authError,
}) => {
  const {
    setAuthCode,
    returnToAuthPhoneNumber,
    clearAuthError,
  } = getActions();

  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);

  const [code, setCode] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const currentViewportHeight = useRef<number>(Number(window.visualViewport!.height));
  const isFocused = useRef<boolean>(false);

  useEffect(() => {
    if (!IS_TOUCH_ENV) {
      inputRef.current!.focus();
    }

    inputRef.current!.addEventListener('touchstart', (event) => {
      if (!isFocused.current) {
        event.stopPropagation();
        inputRef.current!.style.transform = 'TranslateY(-10000px)';
        inputRef.current!.style.caretColor = 'transparent';
        inputRef.current!.focus();
        setTimeout(() => {
          inputRef.current!.style.transform = 'none';
          const scrollPixel = containerRef.current!.clientHeight
            - currentViewportHeight.current + (window.numberKeyboardHeight ?? 0);

          if (scrollPixel > 0) {
            containerRef.current!.style.transform = `translateY(${-scrollPixel}px)`;
            containerRef.current!.style.transition = 'transform 0.2s linear';  
          }
          setTimeout(() => {
            inputRef.current!.style.caretColor = '#8774E1';
          }, 150);
        }, 100);
        isFocused.current = true;
      }
    });

    inputRef.current!.addEventListener('blur', (_) => {
      isFocused.current = false;
      containerRef.current!.style.transform = 'translateY(0)';
      containerRef.current!.style.transition = 'transform 0.2s linear';
    });
  }, []);

  useHistoryBack({
    isActive: true,
    onBack: returnToAuthPhoneNumber,
  });

  const onCodeChange = useCallback((e: FormEvent<HTMLInputElement>) => {
    if (authError) {
      clearAuthError();
    }

    const { currentTarget: target } = e;
    target.value = target.value.replace(/[^\d]+/, '').substr(0, CODE_LENGTH);

    if (target.value === code) {
      return;
    }

    setCode(target.value);

    if (!isTracking) {
      setIsTracking(true);
    } else if (!target.value.length) {
      setIsTracking(false);
    }

    if (target.value.length === CODE_LENGTH) {
      setAuthCode({ code: target.value });
    }
  }, [authError, clearAuthError, code, isTracking, setAuthCode]);

  function handleReturnToAuthPhoneNumber() {
    returnToAuthPhoneNumber();
  }

  return (
    <div className="custom-wrapper">
      <div ref={containerRef} className="auth-form">
        <div id="logo" />
        <h1 className="flex center">
          {authPhoneNumber}
          <div
            className="auth-number-edit div-button"
            onClick={handleReturnToAuthPhoneNumber}
            role="button"
            tabIndex={0}
            title={lang('WrongNumber')}
          >
            <i className="icon icon-edit" />
          </div>
        </h1>
        <p className="note">
          {langPack.SentAppCode1.value} <br /> {langPack.SentAppCode2.value}
        </p>
        <div className="label">
          {langPack.EnterCode.value}
        </div>
        <InputText
          ref={inputRef}
          className="custom-input noMarginBottom"
          id="sign-in-code"
          placeholder={lang('5 digit verification code')}
          onInput={onCodeChange}
          value={code}
          error={authError && lang(authError)}
          autoComplete="off"
          inputMode="numeric"
          onLoading={authIsLoading}
          loadingSize="medium"
        />
      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): StateProps => pick(global, ['authPhoneNumber', 'authIsCodeViaApp', 'authIsLoading', 'authError']),
)(AuthCode));
