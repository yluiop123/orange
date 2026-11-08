import { Component } from '@angular/core';

/**
 * Frontend-owned Swagger page. `public/openapi.json` is committed with the app,
 * so the documentation never follows a running backend.
 */
@Component({
  selector: 'app-swagger-page',
  standalone: true,
  template: `
    <iframe
      class="swagger-frame"
      title="Orange API documentation"
      src="swagger.html"
    ></iframe>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .swagger-frame {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
      }
    `,
  ],
})
export class SwaggerPageComponent {}
