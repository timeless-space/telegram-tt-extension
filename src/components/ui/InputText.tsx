import type {
  ChangeEvent, FormEvent, RefObject,
} from 'react';
import type { FC } from '../../lib/teact/teact';
import React, { memo } from '../../lib/teact/teact';

import buildClassName from '../../util/buildClassName';
import useLang from '../../hooks/useLang';
import Loading from './Loading';
import './CustomStyle.scss';

type OwnProps = {
  ref?: RefObject<HTMLInputElement>;
  id?: string;
  className?: string;
  value?: string;
  label?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  tabIndex?: number;
  teactExperimentControlled?: boolean;
  onLoading?: boolean;
  inputMode?: 'text' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  loadingSize?: 'small' | 'medium' | 'large' | 'x-large';
  caretColor?: string;
  isAuth?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onInput?: (e: FormEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
};

/**
 * TL - Followed E.164 international rules for phone number length limit
 */
const MAX_NUMBER_LENGTH = 15;

/**
 * TL - Custom InputText
 * Description: Input text was changed, add some properties to trigger
 *   - onLoading: Handle loading state. The Loading is on the right side of the input element.
 *   - loadingSize: The size of the loading element.
 *   - caretColor: The color of the caret.
 */

const InputText: FC<OwnProps> = ({
  ref,
  id,
  className,
  value,
  label,
  error,
  success,
  disabled,
  readOnly,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  tabIndex,
  teactExperimentControlled,
  loadingSize,
  isAuth,
  onLoading,
  onChange,
  onInput,
  onKeyPress,
  onKeyDown,
  onBlur,
  onClick,
  onPaste,
}) => {
  const lang = useLang();
  const labelText = error || success || label;
  const fullClassName = buildClassName(
    'input-group',
    value && 'touched',
    error ? 'error' : success && 'success',
    disabled && 'disabled',
    readOnly && 'disabled',
    labelText && 'with-label',
    className,
  );

  const numberOfSpace = [...value?.split('') ?? ''].filter((item) => item === ' ').length;

  return (
    <div className={fullClassName} dir={lang.isRtl ? 'rtl' : undefined}>
      {
        onLoading && <Loading className={`custom-absolute custom-right custom-${loadingSize}`} />
      }
      <input
        ref={ref}
        className="form-control"
        type="text"
        id={id}
        dir="auto"
        value={value || ''}
        tabIndex={tabIndex}
        placeholder={placeholder}
        maxLength={isAuth ? MAX_NUMBER_LENGTH + numberOfSpace : maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        readOnly={readOnly}
        onChange={onChange}
        onInput={onInput}
        onKeyPress={onKeyPress}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onPaste={onPaste}
        onClick={(event) => onClick?.(event)}
        aria-label={labelText}
        teactExperimentControlled={teactExperimentControlled}
      />
      {labelText && (
        <label htmlFor={id}>{labelText}</label>
      )}
    </div>
  );
};

export default memo(InputText);
