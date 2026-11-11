import { App } from './app/app';
import { appConfig } from './app/app.config';
import { bootstrapApplication } from '@angular/platform-browser';
import { reportErrorOnce } from './app/shared/error-reporter.service';

bootstrapApplication(App, appConfig).catch(error => reportErrorOnce(error, { source: 'bootstrap' }));
