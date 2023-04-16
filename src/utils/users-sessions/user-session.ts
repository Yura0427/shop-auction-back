import * as moment from 'moment';
import * as ms from 'ms';

const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const TOKEN_EXPIRES = process.env.TOKEN_EXPIRES || '1d';

export class UserSession {
  userSessionId: string;
  lastConnectedTime: string;

  constructor(userSessionId: string) {
    this.userSessionId = userSessionId;
    this.lastConnectedTime = moment(new Date()).format(DATE_TIME_FORMAT);
  }

  IsConnected() {
    const duration = moment.duration(
      moment(new Date()).diff(moment(this.lastConnectedTime, DATE_TIME_FORMAT)),
    );
    return duration.asSeconds() < ms(TOKEN_EXPIRES);
  }
}
