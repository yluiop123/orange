import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth.service';
import { I18nService, Locale } from '../../core/i18n.service';
import { NotificationService } from '../../core/notification.service';
import { isSafeInternalPath } from '../../core/path';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['super', [Validators.required, Validators.minLength(4)]],
    password: ['super', [Validators.required, Validators.minLength(4)]],
  });

  changeLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { username, password } = this.form.getRawValue();
      await this.auth.login(username, password);
      const redirect = this.route.snapshot.queryParamMap.get('redirect');
      const target = isSafeInternalPath(redirect)
        ? (redirect as string)
        : (this.auth.firstVisibleLeaf() ?? '/');
      await this.router.navigateByUrl(target, { replaceUrl: true });
    } catch (error) {
      const message = (error as { message?: string } | null)?.message;
      this.error.set(message || this.i18n.t('login.failed'));
    } finally {
      this.loading.set(false);
    }
  }
}
