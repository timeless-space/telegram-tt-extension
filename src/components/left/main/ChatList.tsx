import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../global';

import type { FC } from '../../../lib/teact/teact';
import type { FolderEditDispatch } from '../../../hooks/reducers/useFoldersReducer';
import { LeftColumnContent } from '../../../types';
import type { SettingsScreens } from '../../../types';
import type { GlobalState } from '../../../global/types';

import {
  ALL_FOLDER_ID,
  ARCHIVED_FOLDER_ID,
  ARCHIVE_MINIMIZED_HEIGHT,
  CHAT_HEIGHT_PX,
  CHAT_LIST_SLICE,
} from '../../../config';
import { IS_MAC_OS, IS_APP } from '../../../util/windowEnvironment';
import { getPinnedChatsCount, getOrderKey } from '../../../util/folderManager';
import buildClassName from '../../../util/buildClassName';

import useLastCallback from '../../../hooks/useLastCallback';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import { useFolderManagerForOrderedIds } from '../../../hooks/useFolderManager';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { useHotkeys } from '../../../hooks/useHotkeys';
import useDebouncedCallback from '../../../hooks/useDebouncedCallback';
import useOrderDiff from './hooks/useOrderDiff';

import InfiniteScroll from '../../ui/InfiniteScroll';
import Loading from '../../ui/Loading';
import Chat from './Chat';
import EmptyFolder from './EmptyFolder';
import Archive from './Archive';
import { handleScrollUnactiveTab } from '../../../util/tlCustomFunction';

type OwnProps = {
  folderType: 'all' | 'archived' | 'folder';
  folderId?: number;
  isActive: boolean;
  canDisplayArchive?: boolean;
  archiveSettings: GlobalState['archiveSettings'];
  isForumPanelOpen?: boolean;
  foldersDispatch: FolderEditDispatch;
  onSettingsScreenSelect: (screen: SettingsScreens) => void;
  onLeftColumnContentChange: (content: LeftColumnContent) => void;
  activeChatFolder?: number;
  allowAbsoluteHeader?: boolean;
};

const INTERSECTION_THROTTLE = 200;
const DRAG_ENTER_DEBOUNCE = 500;
const RESERVED_HOTKEYS = new Set(['9', '0']);
const HEIGHT_HEADER_FIXED = 56;
let isScrolling: any;

const ChatList: FC<OwnProps> = ({
  folderType,
  folderId,
  isActive,
  isForumPanelOpen,
  canDisplayArchive,
  archiveSettings,
  foldersDispatch,
  onSettingsScreenSelect,
  onLeftColumnContentChange,
  allowAbsoluteHeader = false,
}) => {
  const { openChat, openNextChat, closeForumPanel } = getActions();
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldIgnoreDragRef = useRef(false);
  const firstScroll = useRef<any>(true);

  const resolvedFolderId = (
    folderType === 'all' ? ALL_FOLDER_ID : folderType === 'archived' ? ARCHIVED_FOLDER_ID : folderId!
  );

  const shouldDisplayArchive = folderType === 'all' && canDisplayArchive;

  const orderedIds = useFolderManagerForOrderedIds(resolvedFolderId);

  const chatsHeight = (orderedIds?.length || 0) * CHAT_HEIGHT_PX;
  const archiveHeight = shouldDisplayArchive
    ? archiveSettings.isMinimized ? ARCHIVE_MINIMIZED_HEIGHT : CHAT_HEIGHT_PX : 0;

  const { orderDiffById, getAnimationType } = useOrderDiff(orderedIds);
  const isExpandHeader = sessionStorage.getItem('isExpandHeader');

  const [viewportIds, getMore] = useInfiniteScroll(undefined, orderedIds, undefined, CHAT_LIST_SLICE);

  useEffect(() => {
    // eslint-disable-next-line no-null/no-null
    if (containerRef.current) {
      setTimeout(() => {
        if (folderType === 'archived') {
          containerRef.current?.scrollTo({ top: 0 });
        }
      }, 500);
    }
  }, [containerRef, isExpandHeader, folderType]);

  // Support <Alt>+<Up/Down> to navigate between chats
  useHotkeys(isActive && orderedIds?.length ? {
    'Alt+ArrowUp': (e: KeyboardEvent) => {
      e.preventDefault();
      openNextChat({ targetIndexDelta: -1, orderedIds });
    },
    'Alt+ArrowDown': (e: KeyboardEvent) => {
      e.preventDefault();
      openNextChat({ targetIndexDelta: 1, orderedIds });
    },
  } : undefined);

  // Support <Cmd>+<Digit> to navigate between chats
  useEffect(() => {
    if (!isActive || !orderedIds || !IS_APP) {
      return undefined;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (((IS_MAC_OS && e.metaKey) || (!IS_MAC_OS && e.ctrlKey)) && e.code.startsWith('Digit')) {
        const [, digit] = e.code.match(/Digit(\d)/) || [];
        if (!digit || RESERVED_HOTKEYS.has(digit)) return;

        const isArchiveInList = shouldDisplayArchive && !archiveSettings.isMinimized;

        const shift = isArchiveInList ? -1 : 0;
        const position = Number(digit) + shift - 1;

        if (isArchiveInList && position === -1) {
          onLeftColumnContentChange(LeftColumnContent.Archived);
          return;
        }

        if (position > orderedIds!.length - 1) return;

        openChat({ id: orderedIds![position], shouldReplaceHistory: true });
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [archiveSettings, isActive, onLeftColumnContentChange, openChat, openNextChat, orderedIds, shouldDisplayArchive]);

  const { observe } = useIntersectionObserver({
    rootRef: containerRef,
    throttleMs: INTERSECTION_THROTTLE,
  });

  const handleArchivedClick = useLastCallback(() => {
    getGlobal().isArchivePrevious = true;
    onLeftColumnContentChange(LeftColumnContent.Archived);
    closeForumPanel();
  });

  const handleArchivedDragEnter = useLastCallback(() => {
    if (shouldIgnoreDragRef.current) {
      shouldIgnoreDragRef.current = false;
      return;
    }
    handleArchivedClick();
  });

  const handleDragEnter = useDebouncedCallback((chatId: string) => {
    if (shouldIgnoreDragRef.current) {
      shouldIgnoreDragRef.current = false;
      return;
    }
    openChat({ id: chatId, shouldReplaceHistory: true });
  }, [openChat], DRAG_ENTER_DEBOUNCE, true);

  const handleDragLeave = useLastCallback((e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < rect.width || y < rect.y) return;
    shouldIgnoreDragRef.current = true;
  });

  function renderChats() {
    const viewportOffset = orderedIds!.indexOf(viewportIds![0]);

    const pinnedCount = getPinnedChatsCount(resolvedFolderId) || 0;
    /**
     * TL - This function scroll the header whenever the chatList render.
     */
    setTimeout(() => {
      if (containerRef.current && firstScroll.current && allowAbsoluteHeader) {
        const tlChatFolderEl = document.getElementById('tl-chat-folders');
        if (tlChatFolderEl) {
          tlChatFolderEl.style.paddingTop = `${(window as any).tlPaddingTop}px`;
        } else {
          // eslint-disable-next-line max-len
          const chatListActiveEl: any = document.querySelector('#custom-id-chat-list-inf-scroll.Transition_slide-active')
            ?? document.getElementById('custom-id-chat-list-inf-scroll');
          if (chatListActiveEl) {
            chatListActiveEl.style.paddingTop = `${(window as any).tlPaddingTop}px`;
          }
        }
        const leftMainHeaderEl = document.getElementById('left-main-header');
        if (leftMainHeaderEl) {
          leftMainHeaderEl.style.paddingTop = `${(window as any).tlPaddingTop}px`;
        }
        setTimeout(() => {
          containerRef.current?.scrollTo({ top: HEIGHT_HEADER_FIXED });
          setTimeout(() => {
            firstScroll.current = false;
          }, 200);
        }, 0);
      }
    }, 0);
    return viewportIds!.map((id, i) => {
      const isPinned = viewportOffset + i < pinnedCount;
      const offsetTop = archiveHeight + (viewportOffset + i) * CHAT_HEIGHT_PX
        + (allowAbsoluteHeader ? HEIGHT_HEADER_FIXED : 0);

      return (
        <Chat
          key={id}
          teactOrderKey={isPinned ? i : getOrderKey(id)}
          chatId={id}
          isPinned={isPinned}
          folderId={folderId}
          animationType={getAnimationType(id)}
          orderDiff={orderDiffById[id]}
          offsetTop={offsetTop}
          observeIntersection={observe}
          onDragEnter={handleDragEnter}
        />
      );
    });
  }

  /**
   * TL - Custom functions for chatList scroll
   * Description: This function is used to trigger the header show or hide with an animation
   */
  function handleScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    /**
     * This condition is used to expand the header of inactived tab folder. When we interact with first tab.
     */
    if (firstScroll.current) {
      handleScrollUnactiveTab();
      return;
    }
    clearTimeout(isScrolling);
    const doc = document.documentElement;
    const scrollTop = event.currentTarget.scrollTop;
    const scrollPercentRounded = Math.min(
      100,
      Math.round((scrollTop / HEIGHT_HEADER_FIXED) * 100),
    );
    const opacity = 1 - scrollPercentRounded * 0.01;
    const opacityOffset = scrollTop >= HEIGHT_HEADER_FIXED + 10 || scrollPercentRounded === 100
      ? 0
      : opacity;

    const translatePixel = scrollTop >= HEIGHT_HEADER_FIXED || scrollPercentRounded === 100 ? 0 : Math.min(
      HEIGHT_HEADER_FIXED,
      ((100 - scrollPercentRounded) * HEIGHT_HEADER_FIXED) / 100,
    );
    const tabFolderTranslatePixel = translatePixel;
    doc.style.setProperty('--disable-tab-click', 'none');
    isScrolling = setTimeout(() => {
      doc.style.setProperty('--disable-tab-click', 'auto');
    }, 150);
    sessionStorage.setItem('isExpandHeader', opacityOffset === 1 ? 'true' : 'false');
    doc.style.setProperty('--header-translate', `-${scrollPercentRounded}%`);
    doc.style.setProperty(
      '--tab-folder-translate',
      `${tabFolderTranslatePixel}px`,
    );
    doc.style.setProperty('--show-header-opacity', `${opacityOffset}`);
  }

  return (
    <InfiniteScroll
      id="custom-id-chat-list-inf-scroll"
      className={buildClassName('chat-list custom-scroll', isForumPanelOpen && 'forum-panel-open')}
      ref={containerRef}
      items={viewportIds}
      itemSelector=".ListItem:not(.chat-item-archive)"
      preloadBackwards={CHAT_LIST_SLICE}
      withAbsolutePositioning
      maxHeight={chatsHeight + archiveHeight + HEIGHT_HEADER_FIXED}
      onLoadMore={getMore}
      onDragLeave={handleDragLeave}
      // eslint-disable-next-line react/jsx-no-bind
      onScroll={handleScroll}
    >
      {shouldDisplayArchive && (
        <Archive
          key="archive"
          archiveSettings={archiveSettings}
          onClick={handleArchivedClick}
          onDragEnter={handleArchivedDragEnter}
        />
      )}
      {viewportIds?.length ? (
        renderChats()
      ) : viewportIds && !viewportIds.length ? (
        (
          <EmptyFolder
            folderId={folderId}
            folderType={folderType}
            foldersDispatch={foldersDispatch}
            onSettingsScreenSelect={onSettingsScreenSelect}
          />
        )
      ) : (
        <Loading key="loading" />
      )}
    </InfiniteScroll>
  );
};

export default memo(ChatList);
