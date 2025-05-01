import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './routing.module';
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideHttpClient} from "@angular/common/http";
import {NgcCookieConsentModule} from "ngx-cookieconsent";
import {cookieConfig} from "./app.component";


export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes), provideAnimations(), provideHttpClient(),
        importProvidersFrom(NgcCookieConsentModule.forRoot(cookieConfig))]
};
