import { Component, OnDestroy, TemplateRef, WritableSignal, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../../shared/page-header.component';

type ToastKind = 'default' | 'success' | 'error' | 'info';
type ToastVertical = 'top' | 'bottom';
type ToastHorizontal = 'start' | 'center' | 'end';

@Component({
  selector: 'app-component-feedback',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.feedback.title" descKey="page.component.feedback.desc" />

      <mat-tab-group class="demo-tabs" animationDuration="0ms">
        <!-- ============================== Alert ============================== -->
        <mat-tab label="Alert">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Usage</h2>
              <div class="alert info">
                <mat-icon>info</mat-icon>
                <div class="alert-body">
                  <strong>Heads up!</strong>
                  <p>You can add components to your app using the CLI.</p>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Types</h2>
              <div class="stack">
                <div class="alert info">
                  <mat-icon>info</mat-icon>
                  <div class="alert-body">
                    <strong>Information</strong>
                    <p>This is an informational message.</p>
                  </div>
                </div>
                <div class="alert error">
                  <mat-icon>cancel</mat-icon>
                  <div class="alert-body">
                    <strong>Error</strong>
                    <p>Your session has expired. Please log in again.</p>
                  </div>
                </div>
                <div class="alert success">
                  <mat-icon>check_circle</mat-icon>
                  <div class="alert-body">
                    <strong>Success</strong>
                    <p>Your changes have been saved successfully.</p>
                  </div>
                </div>
                <div class="alert warning">
                  <mat-icon>error</mat-icon>
                  <div class="alert-body">
                    <strong>Warning</strong>
                    <p>This action cannot be undone. Please proceed with caution.</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Closable Alerts</h2>
              <div class="stack">
                @if (!closedAlerts().includes('notice')) {
                  <div class="alert info closable">
                    <mat-icon>info</mat-icon>
                    <div class="alert-body">
                      <strong>Notice</strong>
                      <p>This alert can be closed with the button on the right.</p>
                    </div>
                    <button mat-icon-button type="button" aria-label="Dismiss notice" (click)="dismissAlert('notice')">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
                @if (!closedAlerts().includes('critical')) {
                  <div class="alert error closable">
                    <mat-icon>cancel</mat-icon>
                    <div class="alert-body">
                      <strong>Critical warning</strong>
                      <p>Immediate action is required to avoid data loss.</p>
                    </div>
                    <button mat-icon-button type="button" aria-label="Dismiss warning" (click)="dismissAlert('critical')">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
                @if (closedAlerts().length) {
                  <button mat-stroked-button type="button" (click)="resetAlerts()">Restore alerts</button>
                } @else {
                  <p class="muted small">Dismiss an alert to see the restore action.</p>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Long Text</h2>
              <div class="alert info">
                <mat-icon>info</mat-icon>
                <div class="alert-body">
                  <strong>Detailed information</strong>
                  <p>
                    This is a longer description that demonstrates how alerts handle extended content. Alerts can
                    contain multiple lines of text and they adapt to the content height, keeping the message clear and
                    organised for the reader.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Drawer ============================== -->
        <mat-tab label="Drawer">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Usage</h2>
              <mat-drawer-container class="drawer-demo" autosize>
                <mat-drawer-content class="drawer-content">
                  <p class="muted">A panel that slides in from the edge of the screen. Put forms or details inside.</p>
                  <button mat-flat-button type="button" (click)="drawerError.set(false); drawerOpen.set(true)">
                    Open Drawer
                  </button>
                </mat-drawer-content>
                <mat-drawer
                  mode="over"
                  position="end"
                  [opened]="drawerOpen()"
                  (openedChange)="drawerOpen.set($event)"
                >
                  <div class="drawer-panel">
                    <div class="drawer-head">
                      <div>
                        <h3>{{ drawerError() ? 'Error / 错误' : 'Details / 详情' }}</h3>
                        <p class="muted">
                          {{
                            drawerError()
                              ? 'An error occurred while loading the data.'
                              : 'A simple drawer with header, description and footer.'
                          }}
                        </p>
                      </div>
                      <button mat-icon-button type="button" aria-label="Close drawer" (click)="drawerOpen.set(false)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                    @if (drawerError()) {
                      <div class="inline-error">Failed to load details.</div>
                    } @else {
                      <p class="muted">This is the drawer content area. Add forms, navigation or record details here.</p>
                    }
                    <mat-divider />
                    <div class="drawer-actions">
                      <button mat-stroked-button type="button" [disabled]="drawerLoading()" (click)="drawerOpen.set(false)">
                        Cancel
                      </button>
                      <button
                        mat-flat-button
                        type="button"
                        [disabled]="drawerLoading() || drawerError()"
                        (click)="runDrawerTask()"
                      >
                        @if (drawerLoading()) {
                          <mat-spinner diameter="16" />
                        }
                        {{ drawerLoading() ? 'Processing...' : 'Confirm' }}
                      </button>
                    </div>
                  </div>
                </mat-drawer>
              </mat-drawer-container>
            </section>

            <section class="panel">
              <h2>Loading &amp; Error State</h2>
              <mat-drawer-container class="drawer-demo" autosize>
                <mat-drawer-content class="drawer-content">
                  <div class="row">
                    <button mat-stroked-button type="button" (click)="openDrawer(false)">Open (with loading)</button>
                    <button mat-stroked-button type="button" color="warn" (click)="openDrawer(true)">
                      Open with Error
                    </button>
                  </div>
                  <p class="muted small">
                    The loading drawer disables its actions while processing; the error drawer shows an inline message
                    and blocks the primary action.
                  </p>
                </mat-drawer-content>
                <mat-drawer
                  mode="over"
                  position="end"
                  [opened]="stateDrawerOpen()"
                  (openedChange)="stateDrawerOpen.set($event)"
                >
                  <div class="drawer-panel">
                    <div class="drawer-head">
                      <div>
                        <h3>{{ drawerError() ? 'Error / 错误' : 'Processing / 处理中' }}</h3>
                        <p class="muted">
                          {{
                            drawerError()
                              ? 'An error occurred while loading the data.'
                              : 'Shows a disabled action while loading.'
                          }}
                        </p>
                      </div>
                      <button mat-icon-button type="button" aria-label="Close drawer" (click)="stateDrawerOpen.set(false)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                    @if (drawerError()) {
                      <div class="inline-error">Failed to load details.</div>
                    } @else {
                      <p class="muted">Simulate a short task, then confirm to finish.</p>
                    }
                    <div class="drawer-actions">
                      <button mat-stroked-button type="button" [disabled]="drawerLoading()" (click)="stateDrawerOpen.set(false)">
                        Cancel
                      </button>
                      <button
                        mat-flat-button
                        type="button"
                        [disabled]="drawerLoading() || drawerError()"
                        (click)="runDrawerTask()"
                      >
                        @if (drawerLoading()) {
                          <mat-spinner diameter="16" />
                        }
                        {{ drawerLoading() ? 'Processing...' : 'Confirm' }}
                      </button>
                    </div>
                  </div>
                </mat-drawer>
              </mat-drawer-container>
            </section>

            <section class="panel">
              <h2>Directions</h2>
              <mat-drawer-container class="drawer-demo" autosize>
                <mat-drawer-content class="drawer-content">
                  <div class="row">
                    <button mat-stroked-button type="button" (click)="startDrawer.open()">Open from start</button>
                    <button mat-stroked-button type="button" (click)="endDrawer.open()">Open from end</button>
                  </div>
                </mat-drawer-content>
                <mat-drawer #startDrawer mode="over" position="start">
                  <div class="drawer-panel">
                    <h3>Start / 左侧</h3>
                    <p class="muted">Content from the start edge.</p>
                    <button mat-stroked-button type="button" (click)="startDrawer.close()">Close</button>
                  </div>
                </mat-drawer>
                <mat-drawer #endDrawer mode="over" position="end">
                  <div class="drawer-panel">
                    <h3>End / 右侧</h3>
                    <p class="muted">Content from the end edge.</p>
                    <button mat-stroked-button type="button" (click)="endDrawer.close()">Close</button>
                  </div>
                </mat-drawer>
              </mat-drawer-container>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Sonner ============================== -->
        <mat-tab label="Sonner">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic</h2>
              <div class="row">
                <button mat-flat-button type="button" (click)="showToast('Hello from Sonner')">Basic</button>
                <button mat-stroked-button type="button" (click)="showToast('Saved successfully', 'success')">
                  Success
                </button>
                <button mat-stroked-button type="button" color="warn" (click)="showToast('Something went wrong', 'error')">
                  Error
                </button>
                <button mat-stroked-button type="button" (click)="showToast('Sync started', 'info')">Info</button>
              </div>
              <p class="muted small">Transient feedback for actions and failures, rendered with MatSnackBar.</p>
            </section>

            <section class="panel">
              <h2>Promise / Async</h2>
              <div class="row">
                <button mat-flat-button type="button" [disabled]="promiseRunning()" (click)="runPromise()">
                  @if (promiseRunning()) {
                    <mat-spinner diameter="16" />
                  }
                  {{ promiseRunning() ? 'Working...' : 'Run Promise' }}
                </button>
                <span class="muted small">
                  @if (promiseRunning()) {
                    Saving in the background…
                  } @else {
                    Shows a loading toast, then a success toast.
                  }
                </span>
              </div>
            </section>

            <section class="panel">
              <h2>Placement</h2>
              <p class="muted small">Show a toast at a specific corner or edge.</p>
              <div class="row">
                <button mat-stroked-button type="button" (click)="placeToast('top', 'end', 'Top Right')">Top Right</button>
                <button mat-stroked-button type="button" (click)="placeToast('top', 'center', 'Top Center')">
                  Top Center
                </button>
                <button mat-stroked-button type="button" (click)="placeToast('top', 'start', 'Top Left')">Top Left</button>
                <button mat-stroked-button type="button" (click)="placeToast('bottom', 'end', 'Bottom Right')">
                  Bottom Right
                </button>
                <button mat-stroked-button type="button" (click)="placeToast('bottom', 'center', 'Bottom Center')">
                  Bottom Center
                </button>
                <button mat-stroked-button type="button" (click)="placeToast('bottom', 'start', 'Bottom Left')">
                  Bottom Left
                </button>
              </div>
              <p class="muted small">Current position: {{ toastPosition() }}</p>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Alert Dialog ============================== -->
        <mat-tab label="Alert Dialog">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic</h2>
              <p class="muted">Confirm destructive actions before they run.</p>
              <div class="row">
                <button mat-flat-button type="button" color="warn" (click)="openDialog(deleteAlert)">
                  Delete Item
                </button>
                <button mat-stroked-button type="button" (click)="openDialog(signOutAlert)">Sign Out</button>
              </div>
            </section>

            <section class="panel">
              <h2>Danger Variants</h2>
              <div class="row">
                <button mat-stroked-button type="button" color="warn" (click)="openDialog(deleteAlert)">
                  Remove workspace
                </button>
                <button mat-stroked-button type="button" color="warn" (click)="openDialog(signOutAlert)">
                  End all sessions
                </button>
              </div>
              <p class="muted small">
                The destructive button is visually distinct and the safe action is always available.
              </p>
            </section>

            <section class="panel">
              <h2>Accessibility</h2>
              <p class="muted">
                Alert dialogs trap focus and require explicit confirmation; keyboard users can press Enter to confirm
                or Esc to cancel.
              </p>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Dialog ============================== -->
        <mat-tab label="Dialog">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic &amp; Sizes</h2>
              <div class="row">
                <button mat-flat-button type="button" (click)="openDialog(basicDialog)">Open Dialog (center)</button>
                <button mat-stroked-button type="button" (click)="openDialog(largeDialog, '720px')">
                  Open Large Dialog
                </button>
              </div>
            </section>

            <section class="panel">
              <h2>Form Dialog</h2>
              <p class="muted">Use dialogs for focused forms that should not interrupt the rest of the page.</p>
              <button mat-stroked-button type="button" (click)="openDialog(formDialog, '520px')">Open Form Dialog</button>
            </section>

            <section class="panel">
              <h2>Scrollable Content</h2>
              <p class="muted">
                Large dialogs keep their header and actions fixed while the body scrolls independently.
              </p>
              <button mat-stroked-button type="button" (click)="openDialog(largeDialog, '720px')">
                Preview scrollable dialog
              </button>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Progress ============================== -->
        <mat-tab label="Progress">
          <div class="tab-body">
            <section class="panel">
              <h2>Determinate</h2>
              <div class="progress-value">{{ progress() }}%</div>
              <mat-progress-bar mode="determinate" [value]="progress()" />
              <div class="row">
                <button mat-stroked-button type="button" (click)="changeProgress(-10)">-10</button>
                <button mat-stroked-button type="button" (click)="changeProgress(10)">+10</button>
                <button mat-stroked-button type="button" (click)="progress.set(0)">Reset</button>
              </div>
            </section>

            <section class="panel">
              <h2>Indeterminate &amp; Buffer</h2>
              <div class="progress-block">
                <span class="muted small">Indeterminate task</span>
                <mat-progress-bar mode="indeterminate" />
                <span class="muted small">Buffer</span>
                <mat-progress-bar mode="buffer" value="65" bufferValue="82" />
              </div>
              <p class="muted small">Use indeterminate bars when the total length of a task is unknown.</p>
            </section>

            <section class="panel">
              <h2>Circular Progress</h2>
              <div class="row">
                <div class="avatar-item">
                  <mat-spinner diameter="28" />
                  <small>Small</small>
                </div>
                <div class="avatar-item">
                  <mat-spinner diameter="40" />
                  <small>Default</small>
                </div>
                <div class="avatar-item">
                  <mat-spinner diameter="56" />
                  <small>Large</small>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Result ============================== -->
        <mat-tab label="Result">
          <div class="tab-body">
            <section class="panel">
              <h2>Result State</h2>
              <mat-card appearance="outlined" class="result-card">
                <mat-card-content>
                  <div class="result-head">
                    <mat-icon [class.result-ok]="ok()" [class.result-error]="!ok()">
                      {{ ok() ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                    <div>
                      <strong class="result-title">{{ ok() ? 'Success / 成功' : 'Failed / 失败' }}</strong>
                      <p class="muted">
                        {{
                          ok()
                            ? 'Your operation completed successfully.'
                            : 'There was an error processing your request.'
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="row">
                    <button mat-flat-button type="button" (click)="showToast('Back to dashboard', 'info')">
                      Back to Home
                    </button>
                    <button mat-stroked-button type="button" (click)="ok.set(!ok())">
                      {{ ok() ? 'Simulate Error' : 'Simulate Success' }}
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </section>

            <section class="panel">
              <h2>Details &amp; Recovery</h2>
              @if (ok()) {
                <p class="muted">No further action is required. You can safely continue.</p>
              } @else {
                <details class="details-box">
                  <summary>View details</summary>
                  <pre>Error: Something went wrong while saving.</pre>
                </details>
                <p class="muted small">
                  Retry the request, then contact support if the problem persists.
                </p>
              }
              <div class="row">
                <button mat-stroked-button type="button" (click)="ok.set(true)">Reset result</button>
                <button mat-stroked-button type="button" (click)="openDialog(formDialog, '520px')">
                  Report issue
                </button>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Skeleton ============================== -->
        <mat-tab label="Skeleton">
          <div class="tab-body">
            <section class="panel">
              <h2>Variants</h2>
              <div class="skeleton-grid">
                <div class="skeleton-profile">
                  <div class="skeleton circle" style="width: 48px; height: 48px"></div>
                  <div class="skeleton-lines">
                    <div class="skeleton" style="width: 96px; height: 14px"></div>
                    <div class="skeleton" style="width: 132px; height: 11px"></div>
                  </div>
                </div>
                <div class="skeleton-lines">
                  <div class="skeleton" style="height: 22px; width: 100%"></div>
                  <div class="skeleton" style="height: 14px; width: 100%"></div>
                  <div class="skeleton" style="height: 14px; width: 72%"></div>
                </div>
                <ul class="skeleton-list">
                  @for (item of skeletonItems; track item) {
                    <li>
                      <div class="skeleton" style="width: 24px; height: 14px"></div>
                      <div class="skeleton" style="flex: 1; height: 14px"></div>
                    </li>
                  }
                </ul>
              </div>
              <div class="row">
                <button mat-stroked-button type="button" (click)="loading.set(!loading())">
                  {{ loading() ? 'Show content' : 'Toggle Loading' }}
                </button>
                <span class="muted small">{{ loading() ? 'Loading placeholders are visible.' : 'Content is loaded.' }}</span>
              </div>
            </section>

            <section class="panel">
              <h2>Loaded Content</h2>
              @if (loading()) {
                <div class="skeleton-card">
                  <div class="skeleton" style="height: 120px; border-radius: var(--app-radius)"></div>
                  <div class="skeleton" style="height: 18px; width: 55%; margin-top: 12px"></div>
                  <div class="skeleton" style="height: 12px; width: 85%; margin-top: 8px"></div>
                  <div class="skeleton" style="height: 12px; width: 70%; margin-top: 6px"></div>
                </div>
              } @else {
                <mat-card appearance="outlined" class="result-card">
                  <div class="skeleton-card">
                    <div class="loaded-media"><mat-icon>image</mat-icon></div>
                    <strong>Loaded card title</strong>
                    <p class="muted">The placeholder has been replaced with real content.</p>
                  </div>
                </mat-card>
              }
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Spinner ============================== -->
        <mat-tab label="Spinner">
          <div class="tab-body">
            <section class="panel">
              <h2>Sizes &amp; Inline</h2>
              <div class="row">
                <div class="avatar-item">
                  @if (spinning()) {
                    <mat-spinner diameter="24" />
                  } @else {
                    <mat-icon>hourglass_empty</mat-icon>
                  }
                  <small>Small</small>
                </div>
                <div class="avatar-item">
                  @if (spinning()) {
                    <mat-spinner diameter="40" />
                  } @else {
                    <mat-icon>hourglass_empty</mat-icon>
                  }
                  <small>Default</small>
                </div>
                <div class="avatar-item">
                  @if (spinning()) {
                    <mat-spinner diameter="64" />
                  } @else {
                    <mat-icon>hourglass_empty</mat-icon>
                  }
                  <small>Large</small>
                </div>
              </div>
              <button mat-flat-button type="button" (click)="spinning.set(!spinning())">
                @if (spinning()) {
                  <mat-spinner diameter="16" />
                }
                {{ spinning() ? 'Loading...' : 'Click to Load' }}
              </button>
            </section>

            <section class="panel">
              <h2>Inline in Button</h2>
              <div class="row">
                <button mat-flat-button type="button" [disabled]="spinning()">
                  @if (spinning()) {
                    <mat-spinner diameter="16" />
                  }
                  {{ spinning() ? 'Saving…' : 'Save changes' }}
                </button>
                <button mat-stroked-button type="button" [disabled]="spinning()">Cancel</button>
              </div>
              <p class="muted small">Buttons keep their width and show a small spinner while an action runs.</p>
            </section>

            <section class="panel">
              <h2>Loading Overlay</h2>
              <div class="overlay-demo">
                <p class="muted">A content block that can be masked while it refreshes.</p>
                <div class="overlay-stats">
                  <span>Revenue<br /><strong>$48,120</strong></span>
                  <span>Orders<br /><strong>1,204</strong></span>
                  <span>Customers<br /><strong>892</strong></span>
                </div>
                @if (spinning()) {
                  <div class="loading-overlay">
                    <mat-spinner diameter="44" />
                    <span>Refreshing…</span>
                  </div>
                }
              </div>
              <button mat-stroked-button type="button" (click)="spinning.set(!spinning())">
                {{ spinning() ? 'Stop loading' : 'Refresh data' }}
              </button>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Watermark ============================== -->
        <mat-tab label="Watermark">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic</h2>
              <div class="watermark-stage">
                <div
                  class="watermark-layer"
                  [style.transform]="'rotate(' + markRotation() + 'deg)'"
                  [style.font-size.px]="markSize()"
                  [style.opacity]="markOpacity()"
                >
                  {{ markText() }}
                </div>
                <div class="watermark-content">
                  <p class="muted">
                    Your content goes here. The watermark appears behind the content and never blocks interaction.
                  </p>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Customize</h2>
              <div class="watermark-controls">
                <label class="field-label" for="mark-text">Text</label>
                <input
                  id="mark-text"
                  class="demo-input"
                  [value]="markText()"
                  (input)="setText($event, markText)"
                />
                <button mat-stroked-button type="button" (click)="resetWatermark()">Reset</button>

                <label class="field-label" for="mark-rotation">Rotation: {{ markRotation() }}°</label>
                <input
                  id="mark-rotation"
                  type="range"
                  min="-90"
                  max="90"
                  [value]="markRotation()"
                  (input)="setNumber($event, markRotation)"
                />

                <label class="field-label" for="mark-size">Font size: {{ markSize() }}px</label>
                <input
                  id="mark-size"
                  type="range"
                  min="24"
                  max="200"
                  [value]="markSize()"
                  (input)="setNumber($event, markSize)"
                />

                <label class="field-label" for="mark-opacity">Opacity: {{ markOpacity() }}</label>
                <input
                  id="mark-opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  [value]="markOpacity()"
                  (input)="setNumber($event, markOpacity)"
                />
              </div>
            </section>

            <section class="panel">
              <h2>Repeating Watermark</h2>
              <div class="watermark-stage media">
                <div class="watermark-repeat">
                  @for (row of watermarkRows; track $index) {
                    @for (cell of watermarkCells; track $index) {
                      <span
                        [style.transform]="'rotate(' + markRotation() + 'deg)'"
                        [style.font-size.px]="markSize() / 2"
                        [style.opacity]="markOpacity()"
                      >
                        {{ markText() }}
                      </span>
                    }
                  }
                </div>
                <div class="watermark-content">
                  <mat-icon>photo_library</mat-icon>
                  <strong>Protected media</strong>
                  <p class="muted">A repeating watermark is useful for previews and confidential documents.</p>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Reusable dialog templates -->
      <ng-template #basicDialog>
        <h2 mat-dialog-title>Centered Dialog</h2>
        <mat-dialog-content>
          <p class="muted">Default centered modal.</p>
          <p>Short content.</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close>Close</button>
          <button mat-flat-button type="button" [mat-dialog-close]="true">Confirm</button>
        </mat-dialog-actions>
      </ng-template>

      <ng-template #largeDialog>
        <h2 mat-dialog-title>Large Dialog</h2>
        <mat-dialog-content>
          <p class="muted">Use for more complex forms or content.</p>
          <div class="dialog-scroll">
            @for (line of dialogLines; track line) {
              <p class="muted small">Line {{ line }}</p>
            }
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close>Close</button>
          <button mat-flat-button type="button" [mat-dialog-close]="true">Save</button>
        </mat-dialog-actions>
      </ng-template>

      <ng-template #formDialog>
        <h2 mat-dialog-title>Create Project</h2>
        <mat-dialog-content>
          <p class="muted">Add a new project to manage.</p>
          <label class="field-label" for="dialog-name">Project name</label>
          <input id="dialog-name" class="demo-input" placeholder="Name of your project" />
          <label class="field-label" for="dialog-desc">Description</label>
          <input id="dialog-desc" class="demo-input" placeholder="Short description" />
          <label class="check-line">
            <input type="checkbox" />
            <span>Accept terms and conditions</span>
          </label>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close>Cancel</button>
          <button mat-flat-button type="button" [mat-dialog-close]="true">Create Project</button>
        </mat-dialog-actions>
      </ng-template>

      <ng-template #deleteAlert>
        <h2 mat-dialog-title>Are you sure?</h2>
        <mat-dialog-content>
          <p class="muted">This action cannot be undone.</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close>Cancel</button>
          <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Confirm</button>
        </mat-dialog-actions>
      </ng-template>

      <ng-template #signOutAlert>
        <h2 mat-dialog-title>Sign out?</h2>
        <mat-dialog-content>
          <p class="muted">You'll need to sign in again to continue.</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close>Stay</button>
          <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Sign out</button>
        </mat-dialog-actions>
      </ng-template>
    </div>
  `,
  styles: [
    `
      /* 10 tabs overflow the pill track: let the header scroll horizontally. */
      :host ::ng-deep .mat-mdc-tab-header {
        max-width: 100%;
        height: auto;
        min-height: 32px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-label-container {
        overflow: visible;
        width: max-content;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-list,
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-labels {
        width: max-content;
        flex-wrap: nowrap;
      }

      .tab-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 14px;
      }
      .panel h2 {
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
        font-weight: 600;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .muted {
        color: var(--app-muted-foreground);
      }
      .small {
        font-size: 0.75rem;
      }
      .field-label {
        display: block;
        margin: 10px 0 4px;
        font-size: 0.75rem;
        font-weight: 500;
      }
      .demo-input {
        width: 100%;
        height: 2rem;
        padding: 0 8px;
        border: 1px solid var(--app-input);
        border-radius: 6px;
        background: transparent;
        color: var(--app-foreground);
        font: inherit;
        font-size: 0.82rem;
        outline: none;
      }
      .demo-input:focus {
        border-color: var(--app-ring);
      }
      input[type='range'] {
        width: 100%;
        accent-color: var(--app-primary);
      }
      .check-line {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        font-size: 0.8rem;
      }

      /* Alerts */
      .alert {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid var(--app-border);
        border-left-width: 3px;
        border-radius: var(--app-radius);
        background: var(--app-card);
      }
      .alert > .mat-icon {
        flex: 0 0 auto;
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-top: 1px;
      }
      .alert-body {
        flex: 1;
        min-width: 0;
      }
      .alert-body strong {
        display: block;
        font-size: 0.84rem;
        margin-bottom: 2px;
      }
      .alert-body p {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.55;
        color: var(--app-muted-foreground);
      }
      .alert.closable {
        align-items: center;
      }
      .alert.info {
        border-left-color: #2563eb;
        background: rgba(37, 99, 235, 0.06);
      }
      .alert.info > .mat-icon {
        color: #2563eb;
      }
      .alert.success {
        border-left-color: #16a34a;
        background: rgba(22, 163, 74, 0.06);
      }
      .alert.success > .mat-icon {
        color: #16a34a;
      }
      .alert.warning {
        border-left-color: #d97706;
        background: rgba(217, 119, 6, 0.07);
      }
      .alert.warning > .mat-icon {
        color: #d97706;
      }
      .alert.error {
        border-left-color: #dc2626;
        background: rgba(220, 38, 38, 0.06);
      }
      .alert.error > .mat-icon {
        color: #dc2626;
      }

      /* Drawer */
      .drawer-demo {
        height: 260px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
        overflow: hidden;
      }
      .drawer-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 12px;
        padding: 20px;
      }
      .drawer-demo mat-drawer {
        width: 320px;
        max-width: 86vw;
      }
      .drawer-panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
        height: 100%;
        padding: 18px;
        background: var(--app-card);
      }
      .drawer-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .drawer-head h3 {
        margin: 0 0 2px;
        font-size: 0.95rem;
      }
      .drawer-head p {
        margin: 0;
        font-size: 0.76rem;
      }
      .drawer-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: auto;
      }
      .inline-error {
        padding: 10px 12px;
        border-radius: 6px;
        background: rgba(220, 38, 38, 0.1);
        color: color-mix(in srgb, #dc2626 72%, var(--app-foreground));
        font-size: 0.8rem;
      }
      .drawer-panel .mat-divider {
        margin: auto 0 0;
      }

      /* Progress */
      .progress-value {
        margin-bottom: 6px;
        font-size: 1.2rem;
        font-weight: 700;
      }
      .progress-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .progress-block span {
        margin-top: 4px;
      }

      /* Result */
      .result-card {
        max-width: 640px;
      }
      .result-head {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 10px;
      }
      .result-head > .mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        flex: 0 0 auto;
      }
      .result-ok {
        color: color-mix(in srgb, #16a34a 76%, var(--app-foreground));
      }
      .result-error {
        color: color-mix(in srgb, #dc2626 76%, var(--app-foreground));
      }
      .result-title {
        display: block;
        font-size: 1rem;
        margin: 4px 0 2px;
      }
      .result-head p {
        margin: 0;
        font-size: 0.82rem;
      }
      .details-box {
        margin-top: 8px;
        font-size: 0.8rem;
      }
      .details-box summary {
        cursor: pointer;
      }
      .details-box pre {
        margin: 8px 0 0;
        padding: 8px;
        border-radius: 6px;
        background: var(--app-muted);
        font-size: 0.72rem;
        overflow-x: auto;
      }

      /* Skeleton */
      .skeleton {
        display: block;
        border-radius: 6px;
        background: linear-gradient(
          90deg,
          var(--app-muted) 25%,
          color-mix(in srgb, var(--app-muted) 35%, var(--app-card)) 50%,
          var(--app-muted) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .skeleton.circle {
        border-radius: 50%;
      }
      .skeleton-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 18px;
        align-items: start;
      }
      .skeleton-profile {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .skeleton-lines {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }
      .skeleton-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .skeleton-list li {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .skeleton-card {
        display: flex;
        flex-direction: column;
        max-width: 520px;
      }
      .skeleton-card strong {
        margin-top: 8px;
        font-size: 0.88rem;
      }
      .skeleton-card p {
        margin: 2px 0 0;
        font-size: 0.78rem;
      }
      .loaded-media {
        display: grid;
        place-items: center;
        height: 120px;
        border-radius: var(--app-radius);
        background: linear-gradient(135deg, #0f766e, #1d4ed8);
        color: #fff;
      }
      .loaded-media .mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }

      /* Spinner */
      .avatar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-width: 64px;
      }
      .avatar-item small {
        font-size: 0.68rem;
        color: var(--app-muted-foreground);
      }
      .overlay-demo {
        position: relative;
        min-height: 160px;
        padding: 16px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        overflow: hidden;
      }
      .overlay-stats {
        display: flex;
        gap: 28px;
        flex-wrap: wrap;
        margin-top: 16px;
      }
      .overlay-stats span {
        color: var(--app-muted-foreground);
        font-size: 0.76rem;
        line-height: 1.7;
      }
      .overlay-stats strong {
        color: var(--app-foreground);
        font-size: 1.1rem;
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: color-mix(in srgb, var(--app-card) 72%, transparent);
        backdrop-filter: blur(2px);
        font-size: 0.78rem;
        color: var(--app-muted-foreground);
      }

      /* Watermark */
      .watermark-stage {
        position: relative;
        display: grid;
        place-items: center;
        min-height: 220px;
        padding: 24px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        overflow: hidden;
        background: var(--app-card);
      }
      .watermark-layer {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        transform-origin: center;
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        color: var(--app-muted-foreground);
        font-weight: 700;
      }
      .watermark-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
        max-width: 420px;
      }
      .watermark-content p {
        margin: 0;
        font-size: 0.82rem;
      }
      .watermark-content > .mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--app-muted-foreground);
      }
      .watermark-controls {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0 12px;
        max-width: 520px;
      }
      .watermark-controls .field-label,
      .watermark-controls input[type='range'] {
        grid-column: 1 / -1;
      }
      .watermark-repeat {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        align-content: center;
        gap: 24px 12px;
        padding: 12px;
        pointer-events: none;
        user-select: none;
        color: var(--app-muted-foreground);
        font-weight: 700;
        text-align: center;
        overflow: hidden;
      }
      .watermark-repeat span {
        display: block;
        white-space: nowrap;
      }
      .watermark-stage.media {
        background: linear-gradient(135deg, rgba(15, 118, 110, 0.18), rgba(29, 78, 216, 0.18));
      }

      /* Dialog content */
      .dialog-scroll {
        max-height: 260px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .dialog-scroll p {
        margin: 0 0 2px;
      }
    `,
  ],
})
export class ComponentFeedbackComponent implements OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly closedAlerts = signal<string[]>([]);
  readonly drawerOpen = signal(false);
  readonly stateDrawerOpen = signal(false);
  readonly drawerLoading = signal(false);
  readonly drawerError = signal(false);
  readonly promiseRunning = signal(false);
  readonly toastPosition = signal('top-right');
  readonly progress = signal(40);
  readonly ok = signal(true);
  readonly loading = signal(true);
  readonly spinning = signal(true);

  readonly markText = signal('Demo Watermark / 水印示例');
  readonly markRotation = signal(-30);
  readonly markSize = signal(64);
  readonly markOpacity = signal(0.08);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly dialogLines = Array.from({ length: 30 }, (_, index) => index + 1);
  readonly watermarkRows = [1, 2, 3];
  readonly watermarkCells = [1, 2, 3];

  private drawerTimer: ReturnType<typeof setTimeout> | undefined;
  private promiseTimer: ReturnType<typeof setTimeout> | undefined;

  openDialog(template: TemplateRef<unknown>, width = '440px'): void {
    this.dialog.open(template, { width, maxWidth: '94vw' });
  }

  dismissAlert(id: string): void {
    this.closedAlerts.update((alerts) => (alerts.includes(id) ? alerts : [...alerts, id]));
  }

  resetAlerts(): void {
    this.closedAlerts.set([]);
  }

  openDrawer(withError: boolean): void {
    this.drawerError.set(withError);
    this.drawerLoading.set(!withError);
    this.stateDrawerOpen.set(true);
    clearTimeout(this.drawerTimer);
    if (!withError) {
      this.drawerTimer = setTimeout(() => this.drawerLoading.set(false), 1600);
    }
  }

  runDrawerTask(): void {
    this.drawerLoading.set(true);
    clearTimeout(this.drawerTimer);
    this.drawerTimer = setTimeout(() => {
      this.drawerLoading.set(false);
      this.drawerOpen.set(false);
      this.stateDrawerOpen.set(false);
    }, 1600);
  }

  showToast(
    message: string,
    kind: ToastKind = 'default',
    vertical: ToastVertical = 'bottom',
    horizontal: ToastHorizontal = 'end',
  ): void {
    const panelClass =
      kind === 'success'
        ? ['snack-success']
        : kind === 'error'
          ? ['snack-error']
          : kind === 'info'
            ? ['snack-info']
            : [];
    this.snackBar.open(message, 'Dismiss', {
      duration: 2600,
      panelClass,
      verticalPosition: vertical,
      horizontalPosition: horizontal,
    });
  }

  placeToast(vertical: ToastVertical, horizontal: ToastHorizontal, label: string): void {
    this.toastPosition.set(label.toLowerCase().replace(' ', '-'));
    this.showToast(`Toast at ${label}`, 'info', vertical, horizontal);
  }

  runPromise(): void {
    this.promiseRunning.set(true);
    this.snackBar.open('Saving...', undefined, {
      duration: 1600,
      panelClass: ['snack-info'],
      verticalPosition: 'bottom',
      horizontalPosition: 'end',
    });
    clearTimeout(this.promiseTimer);
    this.promiseTimer = setTimeout(() => {
      this.promiseRunning.set(false);
      this.snackBar.open('Saved!', 'Dismiss', {
        duration: 2600,
        panelClass: ['snack-success'],
        verticalPosition: 'bottom',
        horizontalPosition: 'end',
      });
    }, 1600);
  }

  changeProgress(delta: number): void {
    this.progress.update((value) => Math.min(100, Math.max(0, value + delta)));
  }

  setText(event: Event, target: WritableSignal<string>): void {
    target.set((event.target as HTMLInputElement).value);
  }

  setNumber(event: Event, target: WritableSignal<number>): void {
    target.set(Number((event.target as HTMLInputElement).value));
  }

  resetWatermark(): void {
    this.markText.set('Demo Watermark / 水印示例');
    this.markRotation.set(-30);
    this.markSize.set(64);
    this.markOpacity.set(0.08);
  }

  ngOnDestroy(): void {
    clearTimeout(this.drawerTimer);
    clearTimeout(this.promiseTimer);
  }
}
