import React, {
  memo, useMemo, useCallback, useEffect,
} from '../../../lib/teact/teact';

import type { FC } from '../../../lib/teact/teact';
import type { GlobalState } from '../../../global/types';
import type { ApiAttachMenuPeerType } from '../../../api/types';
import type { ISettings } from '../../../types';

import {
  CONTENT_TYPES_WITH_PREVIEW, SUPPORTED_AUDIO_CONTENT_TYPES,
  SUPPORTED_IMAGE_CONTENT_TYPES,
  SUPPORTED_VIDEO_CONTENT_TYPES,
} from '../../../config';
import { IS_TOUCH_ENV } from '../../../util/windowEnvironment';
import { openSystemFilesDialog } from '../../../util/systemFilesDialog';
import { validateFiles } from '../../../util/files';

import useMouseInside from '../../../hooks/useMouseInside';
import useLang from '../../../hooks/useLang';
import useFlag from '../../../hooks/useFlag';

import ResponsiveHoverButton from '../../ui/ResponsiveHoverButton';
import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import AttachBotItem from './AttachBotItem';

import './AttachMenu.scss';
import { getActions } from '../../../global';
import { useLastCallback } from '../../../hooks/useLastCallback';

export type OwnProps = {
  chatId: string;
  threadId?: number;
  isButtonVisible: boolean;
  canAttachMedia: boolean;
  canAttachPolls: boolean;
  canSendPhotos: boolean;
  canSendVideos: boolean;
  canSendDocuments: boolean;
  canSendAudios: boolean;
  isScheduled?: boolean;
  attachBots: GlobalState['attachMenu']['bots'];
  isChatWithBot: boolean;
  peerType?: ApiAttachMenuPeerType;
  onFileSelect: (files: File[], shouldSuggestCompression?: boolean) => void;
  onPollCreate: () => void;
  handleSendCrypto: () => void;
  theme: ISettings['theme'];
};

const AttachMenu: FC<OwnProps> = ({
  chatId,
  threadId,
  isButtonVisible,
  canAttachMedia,
  canAttachPolls,
  canSendPhotos,
  canSendVideos,
  canSendDocuments,
  canSendAudios,
  attachBots,
  peerType,
  isScheduled,
  isChatWithBot,
  onFileSelect,
  onPollCreate,
  handleSendCrypto,
  theme,
}) => {
  const { acceptInviteConfirmation } = getActions();

  const [isAttachMenuOpen, openAttachMenu, closeAttachMenu] = useFlag();
  const [handleMouseEnter, handleMouseLeave, markMouseInside] = useMouseInside(isAttachMenuOpen, closeAttachMenu);

  const canSendVideoAndPhoto = canSendPhotos && canSendVideos;
  const canSendVideoOrPhoto = canSendPhotos || canSendVideos;

  const [isAttachmentBotMenuOpen, markAttachmentBotMenuOpen, unmarkAttachmentBotMenuOpen] = useFlag();
  useEffect(() => {
    if (isAttachMenuOpen) {
      markMouseInside();
    }
  }, [isAttachMenuOpen, markMouseInside]);

  const handleToggleAttachMenu = useCallback(() => {
    if (isAttachMenuOpen) {
      closeAttachMenu();
    } else {
      openAttachMenu();
    }
  }, [isAttachMenuOpen, openAttachMenu, closeAttachMenu]);

  const handleFileSelect = useCallback((e: Event, shouldSuggestCompression?: boolean) => {
    const { files } = e.target as HTMLInputElement;
    const validatedFiles = validateFiles(files);

    if (validatedFiles?.length) {
      onFileSelect(validatedFiles, shouldSuggestCompression);
    }
  }, [onFileSelect]);

  const handleQuickSelect = useCallback(() => {
    openSystemFilesDialog(
      Array.from(canSendVideoAndPhoto ? CONTENT_TYPES_WITH_PREVIEW : (
        canSendPhotos ? SUPPORTED_IMAGE_CONTENT_TYPES : SUPPORTED_VIDEO_CONTENT_TYPES
      )).join(','),
      (e) => handleFileSelect(e, true),
    );
  }, [canSendPhotos, canSendVideoAndPhoto, handleFileSelect]);

  const handleDocumentSelect = useCallback(() => {
    openSystemFilesDialog(!canSendDocuments && canSendAudios
      ? Array.from(SUPPORTED_AUDIO_CONTENT_TYPES).join(',') : (
        '*'
      ), (e) => handleFileSelect(e, false));
  }, [canSendAudios, canSendDocuments, handleFileSelect]);

  /**
   * TL - This function is used to test invite user by hash code. It will remove soon
   */
  const handleInviteUser = useLastCallback(() => {
    acceptInviteConfirmation({ hash: 'LUcU2hRUVXQ3NDJl' });
  });

  const bots = useMemo(() => {
    return Object.values(attachBots).filter((bot) => {
      if (!peerType) return false;
      if (peerType === 'bots' && bot.id === chatId && bot.peerTypes.includes('self')) {
        return true;
      }
      return bot.peerTypes.includes(peerType);
    });
  }, [attachBots, chatId, peerType]);

  const lang = useLang();

  if (!isButtonVisible) {
    return undefined;
  }

  return (
    <div className="AttachMenu">
      <ResponsiveHoverButton
        id="attach-menu-button"
        className={isAttachMenuOpen ? 'AttachMenu--button activated' : 'AttachMenu--button'}
        round
        color="translucent"
        onActivate={handleToggleAttachMenu}
        ariaLabel="Add an attachment"
        ariaControls="attach-menu-controls"
        hasPopup
      >
        <i className="icon icon-attach" />
      </ResponsiveHoverButton>
      <Menu
        id="attach-menu-controls"
        isOpen={isAttachMenuOpen || isAttachmentBotMenuOpen}
        autoClose
        positionX="right"
        positionY="bottom"
        onClose={closeAttachMenu}
        className="AttachMenu--menu fluid"
        onCloseAnimationEnd={closeAttachMenu}
        onMouseEnter={!IS_TOUCH_ENV ? handleMouseEnter : undefined}
        onMouseLeave={!IS_TOUCH_ENV ? handleMouseLeave : undefined}
        noCloseOnBackdrop={!IS_TOUCH_ENV}
        ariaLabelledBy="attach-menu-button"
      >
        {/*
       ** Using ternary operator here causes some attributes from first clause
       ** transferring to the fragment content in the second clause
       */}
        {!canAttachMedia && (
          <MenuItem className="media-disabled" disabled>Posting media content is not allowed in this group.</MenuItem>
        )}
        {canAttachMedia && (
          <>
            {canSendVideoOrPhoto && (
              <MenuItem icon="photo" onClick={handleQuickSelect}>
                {lang(canSendVideoAndPhoto ? 'AttachmentMenu.PhotoOrVideo'
                  : (canSendPhotos ? 'InputAttach.Popover.Photo' : 'InputAttach.Popover.Video'))}
              </MenuItem>
            )}
            {(canSendDocuments || canSendAudios)
              && (
                <MenuItem icon="document" onClick={handleDocumentSelect}>
                  {lang(!canSendDocuments && canSendAudios ? 'InputAttach.Popover.Music' : 'AttachDocument')}
                </MenuItem>
              )}
          </>
        )}
        {canAttachPolls && (
          <MenuItem icon="poll" onClick={onPollCreate}>{lang('Poll')}</MenuItem>
        )}
        {
          /**
           * TL - Add send crypto button to attachments
           * Description: Only chat 1-1 (except with bot and self) or group has this button
           */
        }
        {!isChatWithBot && (
          <MenuItem
            icon="lock"
            className="margin-left-1px"
            customIcon={(
              <img className="icon" src="/wallet_20px.svg" alt="" />
            )}
            onClick={handleSendCrypto}
          >
            {lang('Send Crypto')}
          </MenuItem>
        )}
        <MenuItem
          icon="lock"
          onClick={handleInviteUser}
        >
          {lang('Test Open Invite')}
        </MenuItem>

        {canAttachMedia && !isScheduled && bots.map((bot) => (
          <AttachBotItem
            bot={bot}
            chatId={chatId}
            threadId={threadId}
            theme={theme}
            onMenuOpened={markAttachmentBotMenuOpen}
            onMenuClosed={unmarkAttachmentBotMenuOpen}
          />
        ))}
      </Menu>
    </div>
  );
};

export default memo(AttachMenu);
