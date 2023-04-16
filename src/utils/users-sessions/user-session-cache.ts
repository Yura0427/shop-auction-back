import { Inject, CACHE_MANAGER, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { UserSession } from './user-session';
import * as ms from 'ms';

const ACTIVE_SESSION_EXPIRE_TIME =
  process.env.ACTIVE_SESSION_EXPIRE_TIME || '30d';

@Injectable()
export class UserSessionCache {
  sessions = null;
  key = 'userOnline';
  DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
  expired_time = ms(ACTIVE_SESSION_EXPIRE_TIME);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.sessions = [];
  }

  async addNewUserSession(userSessionId: string) {
    let allUsersSessions =
      ((await this.cacheManager.get(this.key)) as UserSession[]) || [];
    const allSessions = [
      ...(allUsersSessions ?? []),
      new UserSession(userSessionId),
    ];
    await this.cacheManager.set(this.key, allSessions, {
      ttl: this.expired_time,
    });
  }

  async getAllActive() {
    const results = (await this.cacheManager.get(this.key)) as UserSession[];
    return results?.filter((x) => x.IsConnected());
  }

  async remove(userSessionId: string) {
    const results = await this.cacheManager.get(this.key);
    if (results) {
      const updatedSessions = (results as UserSession[]).filter(
        (x) => x.userSessionId !== userSessionId,
      );
      await this.cacheManager.set(this.key, updatedSessions, {
        ttl: this.expired_time,
      });
    }
  }
}
