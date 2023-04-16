import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleService {
  async accessProfile(accessToken: string): Promise<any> {
    const { OAuth2 } = google.auth;
    const oauth2Client = new OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const peopleAPI = google.people({
      version: 'v1',
      auth: oauth2Client,
    });
    const { data } = await peopleAPI.people.get({
      resourceName: 'people/me',
      personFields: 'birthdays,phoneNumbers,emailAddresses,names',
    });

    const { birthdays, phoneNumbers, emailAddresses, names } = data;

    return { birthdays, phoneNumbers, emailAddresses, names };
  }
}
