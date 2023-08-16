import type { ApiUser } from '../../api/types';
import { getActions, getGlobal, withGlobal } from '../../global';
import { selectUser } from '../../global/selectors';
import useMedia from '../../hooks/useMedia';
import type { FC } from '../../lib/teact/teact';
import React, { memo, useEffect } from '../../lib/teact/teact';
import { tlFetchProfilePhotos } from '../../util/tlCustomFunction';

type StateProps = {
  users: ApiUser[];
  lastSyncTime?: any;
};

const MediaLoader = ({ user, lastSyncTime }: { user: ApiUser; lastSyncTime: any }) => {
  const {
    loadFullUser,
    loadProfilePhotos,
  } = getActions();
  const { id: userId } = user;

  useEffect(() => {
    if (userId && lastSyncTime) {
      loadFullUser({ userId });
    }
  }, [userId, loadFullUser, loadProfilePhotos, lastSyncTime]);

  useEffect(() => {
    (async () => {
      const result = await tlFetchProfilePhotos({ profileId: userId });
      if (result) {
        if (result?.photos) {
          if (result?.photos.length > 0) {
            const userInfo = getGlobal().users.byId[userId];
            if (userInfo && userInfo?.photos) {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const photoBlobUrl = useMedia(
                `photo${result?.photos[0]?.id}?size=a`,
                undefined,
                undefined,
                getGlobal().lastSyncTime,
              );
              const contactList = JSON.parse(window.sessionStorage.getItem('contactList') ?? '[]');
              const isExist = contactList.some((item: ApiUser) => Number(item.id) === Number(userId));
              if (!isExist) {
                if (photoBlobUrl) {
                  window.sessionStorage.setItem('contactList', JSON.stringify([
                    ...contactList,
                    {
                      ...userInfo,
                      photoBlobUrl,
                    },
                  ]));
                } else {
                  window.sessionStorage.setItem('contactList', JSON.stringify([
                    ...contactList,
                  ]));
                }
              }
            }
          }
        }
      }
    })();
  }, [userId]);

  return (
    <div style="display: none;" />
  );
};

const TLContactListLoader: FC<StateProps> = ({ users, lastSyncTime }) => {
  return (
    users.map((user: ApiUser) => <MediaLoader user={user} lastSyncTime={lastSyncTime} />)
  );
};

export default memo(withGlobal<StateProps>(
  (global): StateProps => {
    const { contactList, lastSyncTime } = global;
    const users = contactList?.userIds.reduce((acc: ApiUser[], item) => {
      const user = selectUser(global, item);
      if (user) {
        acc.push(user);
      }
      return acc;
    }, []) ?? [];

    return {
      users,
      lastSyncTime,
    };
  },
)(TLContactListLoader));
