import {Component, OnInit} from '@angular/core';
import {
    NgcCookieConsentService,
    NgcCookieConsentConfig
} from 'ngx-cookieconsent';
import {environment} from '../environments/environment';
import {HeaderComponent} from "./header/header.component";
import {Router, RouterOutlet} from "@angular/router";
import {FooterComponent} from "./footer/footer.component";

export const cookieConfig: NgcCookieConsentConfig = {
    cookie: {
        domain: environment.cookieDomain
    },
    position: 'bottom',
    theme: 'classic',
    palette: {
        popup: {
            background: '#333',
            text: '#ffffff',
            link: '#ffffff'
        },
        button: {
            background: '#f1d600',
            text: '#333',
            border: 'transparent'
        }
    },
    type: 'info',
    content: {
        message: 'This website requires cookies, and the limited processing of your personal data in order to function. By using the site you are agreeing to this as outlined in our',
        dismiss: 'Accept cookies',
        deny: 'Refuse cookies',
        link: 'Privacy Notice',
        href: '/assets/gdpr/erga_asg_gbdp_gdpr.pdf',
        policy: 'Cookie Policy'
    }
};

class RouterExtService {
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [
        HeaderComponent,
        RouterOutlet,
        FooterComponent
    ],
    providers: [],
    standalone: true
})
export class AppComponent implements OnInit {
    title = 'erga_front-end';
    isHomeRoute: boolean = false;

    constructor(private router: Router, private ccService: NgcCookieConsentService) {
    }

    ngOnInit() {
        this.router.events.subscribe(() => {
            this.isHomeRoute = this.router.url === '/home';
        });
    }
}
