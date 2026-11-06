import { Component, OnDestroy, WritableSignal, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DateRange, MatCalendar } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../shared/page-header.component';

interface TimelineStep {
  title: string;
  date: string;
  icon: string;
  description: string;
}

interface TagItem {
  id: number;
  label: string;
}

@Component({
  selector: 'app-component-display',
  standalone: true,
  imports: [
    DatePipe,
    MatBadgeModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatCalendar,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatStepperModule,
    MatTabsModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.display.title" descKey="page.component.display.desc" />

      <mat-tab-group class="demo-tabs" animationDuration="0ms">
        <!-- ============================== Avatar ============================== -->
        <mat-tab label="Avatar">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Usage</h2>
              <div class="row">
                <span class="avatar av-orange">CN</span>
                <span class="avatar av-blue">RU</span>
                <span class="avatar av-teal">UF</span>
                <span class="avatar av-violet"><mat-icon>person</mat-icon></span>
              </div>
              <p class="muted">Initials are used when no image is available.</p>
            </section>

            <section class="panel">
              <h2>Sizes</h2>
              <div class="row end">
                <div class="avatar-item">
                  <span class="avatar avatar-sm av-orange">CN</span>
                  <small>32</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar avatar-md av-orange">CN</span>
                  <small>48</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar avatar-lg av-orange">CN</span>
                  <small>64</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar avatar-xl av-orange">CN</span>
                  <small>96</small>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>With Badge</h2>
              <div class="row">
                <div class="avatar-item">
                  <span class="avatar-wrap">
                    <span class="avatar av-orange">CN</span>
                    <span class="avatar-dot online"></span>
                  </span>
                  <small>Online</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar-wrap">
                    <span class="avatar av-blue">RU</span>
                    <span class="avatar-dot offline"></span>
                  </span>
                  <small>Offline</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar-wrap">
                    <span class="avatar av-violet">JD</span>
                    <span class="avatar-dot away"></span>
                  </span>
                  <small>Away</small>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Fallback Types</h2>
              <div class="row">
                <div class="avatar-item">
                  <span class="avatar av-muted">JD</span>
                  <small>Initials</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar av-muted wide">John Doe</span>
                  <small>Name</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar av-muted"><mat-icon>account_circle</mat-icon></span>
                  <small>Icon</small>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Badge ============================== -->
        <mat-tab label="Badge">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Variants</h2>
              <div class="row">
                <span class="badge default">Default</span>
                <span class="badge secondary">Secondary</span>
                <span class="badge destructive">Destructive</span>
                <span class="badge outline">Outline</span>
              </div>
            </section>

            <section class="panel">
              <h2>With Icons</h2>
              <div class="row">
                <span class="badge default"><mat-icon>check</mat-icon>Success</span>
                <span class="badge destructive"><mat-icon>close</mat-icon>Error</span>
                <span class="badge warning"><mat-icon>warning</mat-icon>Warning</span>
                <span class="badge outline"><mat-icon>info</mat-icon>Info</span>
              </div>
            </section>

            <section class="panel">
              <h2>Custom Styles</h2>
              <div class="row">
                <span class="badge custom-green">Custom Color</span>
                <span class="badge custom-purple round">Rounded Full</span>
                <span class="badge custom-yellow large">Larger Size</span>
              </div>
              <div class="row">
                <span matBadge="5" matBadgeColor="warn" class="badge-anchor">Notifications</span>
                <span matBadge="sync" matBadgeColor="accent" class="badge-anchor">Cloud</span>
                <span matBadge="Beta" matBadgeOverlap="false" class="badge-anchor">Feature</span>
              </div>
            </section>

            <section class="panel">
              <h2>Badge in Context</h2>
              <div class="context-list">
                <div class="stack-row">
                  <span>New message</span>
                  <span class="badge destructive">1</span>
                </div>
                <div class="stack-row">
                  <span>System update</span>
                  <span class="badge default">Available</span>
                </div>
                <div class="stack-row">
                  <span>Task completed</span>
                  <span class="badge secondary">Done</span>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Calendar ============================== -->
        <mat-tab label="Calendar">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Calendar</h2>
              <div class="calendar-row">
                <mat-calendar [selected]="selectedDate()" (selectedChange)="selectedDate.set($event)" />
                <mat-card appearance="outlined" class="side-card">
                  <mat-card-header>
                    <mat-card-title>Selected Date</mat-card-title>
                    <mat-card-subtitle>Click on a date to select it</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (selectedDate(); as date) {
                      <div class="date-large">{{ date | date: 'fullDate' }}</div>
                      <p class="muted">{{ date | date: 'EEEE, MMMM d, yyyy' }}</p>
                    } @else {
                      <p class="muted">No date selected</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </section>

            <section class="panel">
              <h2>Date Range</h2>
              <div class="calendar-row">
                <mat-calendar [selected]="selectedRange()" (selectedChange)="selectRange($event)" />
                <mat-card appearance="outlined" class="side-card">
                  <mat-card-header>
                    <mat-card-title>Selected Range</mat-card-title>
                    <mat-card-subtitle>Select a start and end date</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (selectedRange(); as range) {
                      @if (range.start && range.end) {
                        <div class="date-large">From: {{ range.start | date: 'mediumDate' }}</div>
                        <div class="date-large">To: {{ range.end | date: 'mediumDate' }}</div>
                        <p class="muted">Total days: {{ rangeDays() }}</p>
                      } @else {
                        <p class="muted">Pick the end date to complete the range.</p>
                      }
                    } @else {
                      <p class="muted">Please select a date range.</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </section>

            <section class="panel">
              <h2>Disabled Past Dates</h2>
              <div class="calendar-row">
                <mat-calendar [selected]="disabledDate()" [minDate]="today" (selectedChange)="disabledDate.set($event)" />
                <mat-card appearance="outlined" class="side-card">
                  <mat-card-header>
                    <mat-card-title>Future dates only</mat-card-title>
                    <mat-card-subtitle>Dates before today are disabled</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (disabledDate(); as date) {
                      <div class="date-large">{{ date | date: 'fullDate' }}</div>
                    }
                    <button mat-stroked-button type="button" class="spaced" (click)="resetDate()">Reset to Today</button>
                  </mat-card-content>
                </mat-card>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Card ============================== -->
        <mat-tab label="Card">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Card</h2>
              <mat-card appearance="outlined" class="demo-card">
                <mat-card-header>
                  <mat-card-title>Basic Card</mat-card-title>
                  <mat-card-subtitle>This is a basic card example.</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p>Cards can contain various types of content, including text, images, and interactive elements.</p>
                </mat-card-content>
                <mat-card-actions align="end">
                  <button mat-stroked-button type="button">Close</button>
                </mat-card-actions>
              </mat-card>
            </section>

            <section class="panel">
              <h2>Card with Action</h2>
              <mat-card appearance="outlined" class="demo-card">
                <mat-card-header>
                  <mat-card-title>Profile Card</mat-card-title>
                  <mat-card-subtitle>Manage your account settings</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="icon-line"><mat-icon>person</mat-icon><span>John Doe</span></div>
                  <div class="icon-line"><mat-icon>mail</mat-icon><span>john.doe&#64;example.com</span></div>
                  <div class="icon-line"><mat-icon>home</mat-icon><span>San Francisco, CA</span></div>
                </mat-card-content>
                <mat-card-actions class="split">
                  <button mat-stroked-button type="button">Cancel</button>
                  <button mat-flat-button type="button">Save Changes</button>
                </mat-card-actions>
              </mat-card>
            </section>

            <section class="panel">
              <h2>Card with Form</h2>
              <mat-card appearance="outlined" class="demo-card form-card">
                <mat-card-header>
                  <mat-card-title>Create Project</mat-card-title>
                  <mat-card-subtitle>Add a new project to manage.</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <label class="field-label" for="project-name">Project Name</label>
                  <input id="project-name" class="demo-input" placeholder="Name of your project" />
                  <label class="field-label" for="project-desc">Description</label>
                  <input id="project-desc" class="demo-input" placeholder="Short description" />
                  <label class="check-line">
                    <input type="checkbox" checked />
                    <span>Accept terms and conditions</span>
                  </label>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-flat-button type="button" class="full">Create Project</button>
                </mat-card-actions>
              </mat-card>
            </section>

            <section class="panel">
              <h2>Navigation Cards</h2>
              <div class="nav-card-grid">
                <mat-card appearance="outlined" class="nav-card">
                  <mat-card-content>
                    <span class="glyph blue"><mat-icon>notifications</mat-icon></span>
                    <strong>Notifications</strong>
                    <p class="muted">Manage your notification preferences</p>
                    <button mat-stroked-button type="button" class="full">Configure</button>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="nav-card">
                  <mat-card-content>
                    <span class="glyph green"><mat-icon>settings</mat-icon></span>
                    <strong>Settings</strong>
                    <p class="muted">Customize your application</p>
                    <button mat-stroked-button type="button" class="full">Open</button>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="nav-card">
                  <mat-card-content>
                    <span class="glyph purple"><mat-icon>credit_card</mat-icon></span>
                    <strong>Billing</strong>
                    <p class="muted">Manage payment methods</p>
                    <button mat-stroked-button type="button" class="full">View Plans</button>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="nav-card">
                  <mat-card-content>
                    <span class="glyph orange"><mat-icon>card_giftcard</mat-icon></span>
                    <strong>Offers</strong>
                    <p class="muted">Special deals and promotions</p>
                    <button mat-stroked-button type="button" class="full">Browse</button>
                  </mat-card-content>
                </mat-card>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Carousel ============================== -->
        <mat-tab label="Carousel">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Carousel</h2>
              <div class="carousel">
                <button mat-icon-button type="button" aria-label="Previous slide" (click)="prev(basicSlide, basicSlides.length)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <div class="carousel-stage">
                  @for (slide of basicSlides; track slide; let i = $index) {
                    @if (i === basicSlide()) {
                      <mat-card appearance="outlined" class="carousel-card">
                        <mat-card-content class="carousel-number">{{ slide }}</mat-card-content>
                      </mat-card>
                    }
                  }
                </div>
                <button mat-icon-button type="button" aria-label="Next slide" (click)="next(basicSlide, basicSlides.length)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              <div class="dots">
                @for (slide of basicSlides; track slide; let i = $index) {
                  <button
                    type="button"
                    class="dot"
                    [class.active]="i === basicSlide()"
                    [attr.aria-label]="'Go to slide ' + slide"
                    (click)="basicSlide.set(i)"
                  ></button>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Carousel with Navigation</h2>
              <div class="carousel">
                <button mat-icon-button type="button" aria-label="Previous slide" (click)="prev(contentSlide, contentSlides.length)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <div class="carousel-stage wide">
                  @for (slide of contentSlides; track slide.title; let i = $index) {
                    @if (i === contentSlide()) {
                      <mat-card appearance="outlined" class="carousel-card gradient-blue">
                        <mat-card-content>
                          <strong class="slide-title">{{ slide.title }}</strong>
                          <p class="muted">{{ slide.description }}</p>
                        </mat-card-content>
                      </mat-card>
                    }
                  }
                </div>
                <button mat-icon-button type="button" aria-label="Next slide" (click)="next(contentSlide, contentSlides.length)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              <p class="muted">Slide {{ contentSlide() + 1 }} of {{ contentSlides.length }}</p>
            </section>

            <section class="panel">
              <h2>Image Carousel</h2>
              <div class="carousel">
                <button mat-icon-button type="button" aria-label="Previous image" (click)="prev(imageSlide, imageSlides.length)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <div class="carousel-stage wide">
                  @for (image of imageSlides; track image.title; let i = $index) {
                    @if (i === imageSlide()) {
                      <div class="image-slide">
                        <mat-icon>landscape</mat-icon>
                        <span class="image-caption">{{ image.title }}</span>
                      </div>
                    }
                  }
                </div>
                <button mat-icon-button type="button" aria-label="Next image" (click)="next(imageSlide, imageSlides.length)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Accordion ============================== -->
        <mat-tab label="Accordion">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Accordion</h2>
              <mat-accordion class="demo-accordion">
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Is it accessible?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Yes. It adheres to the WAI-ARIA design pattern.</p>
                </mat-expansion-panel>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Is it styled?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Yes. It comes with default styles that match the other components' aesthetic.</p>
                </mat-expansion-panel>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Is it animated?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Yes. It's animated by default, but you can disable it if you prefer.</p>
                </mat-expansion-panel>
              </mat-accordion>
            </section>

            <section class="panel">
              <h2>Multiple Expandable Accordion</h2>
              <mat-accordion multi class="demo-accordion">
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>What is a good API?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>A good API is like a good joke. If you have to explain it, it's not that good.</p>
                </mat-expansion-panel>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Why do Java developers wear glasses?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Because they don't C#! Take breaks from the screen light while you can.</p>
                </mat-expansion-panel>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>How do you comfort a JavaScript bug?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>You console it! Then grab some coffee and come back with fresh eyes.</p>
                </mat-expansion-panel>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Why did the developer go broke?</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Because he used up all his cache. And forgot to save his work, probably.</p>
                </mat-expansion-panel>
              </mat-accordion>
            </section>

            <section class="panel">
              <h2>Custom Styling &amp; Long Content</h2>
              <mat-accordion class="demo-accordion custom">
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Custom trigger style</mat-panel-title>
                    <mat-panel-description>Bordered item</mat-panel-description>
                  </mat-expansion-panel-header>
                  <p>This accordion item has custom styling applied to both trigger and content.</p>
                </mat-expansion-panel>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Click to expand long content</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                    pariatur. Excepteur sint occaecat cupidatat non proident.
                  </p>
                  <p>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
                    totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.
                  </p>
                </mat-expansion-panel>
              </mat-accordion>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Descriptions ============================== -->
        <mat-tab label="Descriptions">
          <div class="tab-body">
            <section class="panel">
              <h2>Horizontal Layout</h2>
              <div class="desc-heading">User Info</div>
              <div class="desc-grid cols-3 horizontal">
                <div class="desc-cell"><span class="desc-label">Username</span><span class="desc-value">zhangsan</span></div>
                <div class="desc-cell"><span class="desc-label">Telephone</span><span class="desc-value">18100000000</span></div>
                <div class="desc-cell"><span class="desc-label">Live</span><span class="desc-value">Hangzhou, Zhejiang</span></div>
                <div class="desc-cell"><span class="desc-label">Address</span><span class="desc-value">West Lake District</span></div>
                <div class="desc-cell"><span class="desc-label">Remark</span><span class="desc-value">None</span></div>
                <div class="desc-cell"><span class="desc-label">Email</span><span class="desc-value">zhangsan&#64;example.com</span></div>
              </div>
            </section>

            <section class="panel">
              <h2>Vertical Layout</h2>
              <div class="desc-heading">User Info</div>
              <div class="desc-grid cols-3 bordered vertical">
                <div class="desc-cell"><span class="desc-label">Username</span><span class="desc-value">zhangsan</span></div>
                <div class="desc-cell"><span class="desc-label">Telephone</span><span class="desc-value">18100000000</span></div>
                <div class="desc-cell"><span class="desc-label">Live</span><span class="desc-value">Hangzhou, Zhejiang</span></div>
                <div class="desc-cell"><span class="desc-label">Address</span><span class="desc-value">West Lake District</span></div>
                <div class="desc-cell"><span class="desc-label">Remark</span><span class="desc-value">None</span></div>
                <div class="desc-cell"><span class="desc-label">Email</span><span class="desc-value">zhangsan&#64;example.com</span></div>
              </div>
            </section>

            <section class="panel">
              <h2>Span Across Columns</h2>
              <div class="desc-heading">Project Details</div>
              <div class="desc-grid cols-4 bordered vertical">
                <div class="desc-cell span-2"><span class="desc-label">Project Name</span><span class="desc-value">My Awesome Project</span></div>
                <div class="desc-cell"><span class="desc-label">Start Date</span><span class="desc-value">2023-01-01</span></div>
                <div class="desc-cell"><span class="desc-label">End Date</span><span class="desc-value">2023-12-31</span></div>
                <div class="desc-cell span-4">
                  <span class="desc-label">Description</span>
                  <span class="desc-value">A comprehensive project involving multiple teams and technologies.</span>
                </div>
                <div class="desc-cell"><span class="desc-label">Team Lead</span><span class="desc-value">John Doe</span></div>
                <div class="desc-cell span-2"><span class="desc-label">Status</span><span class="desc-value success">Completed</span></div>
                <div class="desc-cell"><span class="desc-label">Budget</span><span class="desc-value">$50,000</span></div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Empty ============================== -->
        <mat-tab label="Empty">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Empty</h2>
              <div class="empty-card">
                <div class="empty-state">
                  <mat-icon>folder_open</mat-icon>
                  <strong>No documents</strong>
                  <p>Create your first document to get started</p>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>With Actions</h2>
              <div class="empty-card">
                <div class="empty-state">
                  <span class="empty-icon"><mat-icon>search</mat-icon></span>
                  <strong>No results found</strong>
                  <p>Try adjusting your search to find what you're looking for</p>
                  <button mat-flat-button type="button">Clear filters</button>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>User Registration</h2>
              <div class="empty-card">
                <div class="empty-state">
                  <span class="empty-icon"><mat-icon>person_add</mat-icon></span>
                  <strong>No users</strong>
                  <p>Get started by creating a new user or importing existing ones</p>
                  <div class="row center">
                    <button mat-stroked-button type="button">Import</button>
                    <button mat-flat-button type="button">Create user</button>
                  </div>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Custom Media</h2>
              <div class="empty-card">
                <div class="empty-state">
                  <span class="media-circle">404</span>
                  <strong>Page not found</strong>
                  <p>The page you're looking for doesn't exist or has been moved.</p>
                  <button mat-flat-button type="button">Go home</button>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Image ============================== -->
        <mat-tab label="Image">
          <div class="tab-body">
            <section class="panel">
              <h2>Avatar Image</h2>
              <div class="card-row">
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <span class="avatar avatar-xl av-gradient"><mat-icon>image</mat-icon></span>
                    <strong>With Image</strong>
                    <p class="muted">Avatar with image</p>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <span class="avatar avatar-xl av-muted">NC</span>
                    <strong>Fallback</strong>
                    <p class="muted">Avatar with fallback</p>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <span class="avatar avatar-xl av-blue">JD</span>
                    <strong>Initials</strong>
                    <p class="muted">Avatar with initials</p>
                  </mat-card-content>
                </mat-card>
              </div>
            </section>

            <section class="panel">
              <h2>Different Sizes</h2>
              <div class="sizes-strip">
                <span class="avatar avatar-sm av-orange">CN</span>
                <span class="avatar avatar-md av-orange">CN</span>
                <span class="avatar avatar-lg av-orange">CN</span>
                <span class="avatar avatar-xl av-orange">CN</span>
              </div>
            </section>

            <section class="panel">
              <h2>Avatar Groups</h2>
              <div class="avatar-group">
                <span class="avatar av-orange">CN</span>
                <span class="avatar av-blue">U1</span>
                <span class="avatar av-teal">U2</span>
                <span class="avatar av-muted">+3</span>
              </div>
            </section>

            <section class="panel">
              <h2>Square Avatars &amp; Status</h2>
              <div class="row end">
                <div class="avatar-item">
                  <span class="avatar rounded-md av-gradient">CN</span>
                  <small>Rounded</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar square av-blue">US</span>
                  <small>Square</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar-wrap">
                    <span class="avatar av-teal">ON</span>
                    <span class="avatar-dot online"></span>
                  </span>
                  <small>Online</small>
                </div>
                <div class="avatar-item">
                  <span class="avatar-wrap">
                    <span class="avatar av-violet">AW</span>
                    <span class="avatar-dot away"></span>
                  </span>
                  <small>Away</small>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Popover ============================== -->
        <mat-tab label="Popover">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Popover</h2>
              <button mat-stroked-button type="button" [matMenuTriggerFor]="basicPopover">Open popover</button>
              <mat-menu #basicPopover="matMenu">
                <div class="popover-panel">
                  <strong>Dimensions</strong>
                  <p class="muted">Set the dimensions for the layer.</p>
                  <label class="popover-field"><span>Width</span><input class="demo-input" value="100%" /></label>
                  <label class="popover-field"><span>Max. width</span><input class="demo-input" value="300px" /></label>
                  <label class="popover-field"><span>Height</span><input class="demo-input" value="25px" /></label>
                  <label class="popover-field"><span>Max. height</span><input class="demo-input" value="none" /></label>
                </div>
              </mat-menu>
            </section>

            <section class="panel">
              <h2>Direction Popover</h2>
              <div class="row center">
                <div class="avatar-item">
                  <button mat-stroked-button type="button" [matMenuTriggerFor]="topPopover" yPosition="above" aria-label="Top popover">
                    <mat-icon>arrow_upward</mat-icon>
                  </button>
                  <small>Top</small>
                </div>
                <div class="avatar-item">
                  <button mat-stroked-button type="button" [matMenuTriggerFor]="rightPopover" xPosition="after" aria-label="Right popover">
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                  <small>Right</small>
                </div>
                <div class="avatar-item">
                  <button mat-stroked-button type="button" [matMenuTriggerFor]="bottomPopover" yPosition="below" aria-label="Bottom popover">
                    <mat-icon>arrow_downward</mat-icon>
                  </button>
                  <small>Bottom</small>
                </div>
                <div class="avatar-item">
                  <button mat-stroked-button type="button" [matMenuTriggerFor]="leftPopover" xPosition="before" aria-label="Left popover">
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <small>Left</small>
                </div>
              </div>
              <mat-menu #topPopover="matMenu"><div class="popover-panel narrow">Popover on top</div></mat-menu>
              <mat-menu #rightPopover="matMenu"><div class="popover-panel narrow">Popover on right</div></mat-menu>
              <mat-menu #bottomPopover="matMenu"><div class="popover-panel narrow">Popover on bottom</div></mat-menu>
              <mat-menu #leftPopover="matMenu"><div class="popover-panel narrow">Popover on left</div></mat-menu>
            </section>

            <section class="panel">
              <h2>Settings Popover</h2>
              <button mat-stroked-button type="button" [matMenuTriggerFor]="settingsPopover">
                <mat-icon>settings</mat-icon>
                Settings
              </button>
              <mat-menu #settingsPopover="matMenu">
                <div class="popover-panel">
                  <strong>App Settings</strong>
                  <p class="muted">Customize your application preferences</p>
                  <div class="stack-row"><span>Dark Mode</span><span class="badge secondary">On</span></div>
                  <div class="stack-row"><span>Auto-save</span><span class="badge secondary">On</span></div>
                  <div class="stack-row"><span>Keyboard shortcuts</span><span class="badge outline">Off</span></div>
                  <div class="stack-row"><span>Analytics</span><span class="badge secondary">On</span></div>
                </div>
              </mat-menu>
            </section>

            <section class="panel">
              <h2>Long Content Popover</h2>
              <button mat-stroked-button type="button" [matMenuTriggerFor]="termsPopover">Terms of Service</button>
              <mat-menu #termsPopover="matMenu">
                <div class="popover-panel scrollable">
                  <strong>Terms of Service</strong>
                  <p class="muted">Last updated: January 1, 2024</p>
                  <p class="muted small">
                    These Terms of Service govern your use of our services. By using our platform, you agree to these
                    terms and conditions.
                  </p>
                  <p class="muted small">
                    We reserve the right to modify these terms at any time. Changes will be effective immediately upon
                    posting to the website.
                  </p>
                  <p class="muted small">
                    Users must be at least 18 years old to use our services. We are committed to protecting your
                    privacy and handling your information responsibly.
                  </p>
                </div>
              </mat-menu>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== QRCode ============================== -->
        <mat-tab label="QRCode">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic QRCode</h2>
              <div class="card-row center">
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Default</strong>
                    <p class="muted">Basic QRCode</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 128px; height: 128px; color: #18181b">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Custom Size</strong>
                    <p class="muted">Large QRCode</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 200px; height: 200px; color: #18181b">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </section>

            <section class="panel">
              <h2>Color Variants</h2>
              <div class="card-row center">
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Red QRCode</strong>
                    <p class="muted">Red foreground color</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 128px; height: 128px; color: #ef4444">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Blue QRCode</strong>
                    <p class="muted">Blue foreground color</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 128px; height: 128px; color: #3b82f6">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Green QRCode</strong>
                    <p class="muted">Green foreground color</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 128px; height: 128px; color: #10b981">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </section>

            <section class="panel">
              <h2>Dynamic QRCode</h2>
              <div class="qr-dynamic">
                <div class="qr-controls">
                  <label class="field-label" for="qr-url">URL</label>
                  <input
                    id="qr-url"
                    class="demo-input"
                    [value]="qrUrl()"
                    (input)="setText($event, qrUrl)"
                    placeholder="Enter URL"
                  />
                  <label class="field-label" for="qr-size">Size: {{ qrSize() }}px</label>
                  <input
                    id="qr-size"
                    type="range"
                    min="64"
                    max="300"
                    [value]="qrSize()"
                    (input)="setNumber($event, qrSize)"
                  />
                  <div class="color-row">
                    <label class="field-label" for="qr-fg">Foreground</label>
                    <input id="qr-fg" type="color" [value]="qrFg()" (input)="setText($event, qrFg)" />
                    <label class="field-label" for="qr-bg">Background</label>
                    <input id="qr-bg" type="color" [value]="qrBg()" (input)="setText($event, qrBg)" />
                  </div>
                  <div class="row">
                    <button mat-flat-button type="button" (click)="copyQrUrl()">Copy URL</button>
                    @if (qrCopied()) {
                      <span class="muted small">Copied!</span>
                    }
                  </div>
                </div>
                <div class="qr-preview" [style.background]="qrBg()">
                  <div
                    class="qr"
                    [style.width.px]="qrSize()"
                    [style.height.px]="qrSize()"
                    [style.color]="qrFg()"
                  >
                    <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                    <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                  </div>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Common Use Cases</h2>
              <div class="card-row center">
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Website Link</strong>
                    <p class="muted">Share your website easily</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 112px; height: 112px; color: #18181b">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>Contact Info</strong>
                    <p class="muted">VCard or contact details</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 112px; height: 112px; color: #18181b">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card appearance="outlined" class="image-card">
                  <mat-card-content>
                    <strong>WiFi Credentials</strong>
                    <p class="muted">Easy WiFi connection</p>
                    <div class="qr-frame">
                      <div class="qr" style="width: 112px; height: 112px; color: #18181b">
                        <span class="qr-finder tl"></span><span class="qr-finder tr"></span>
                        <span class="qr-finder bl"></span><span class="qr-finder br"></span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Segmented ============================== -->
        <mat-tab label="Segmented">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Segmented</h2>
              <mat-button-toggle-group
                class="segmented"
                hideSingleSelectionIndicator
                value="week"
                aria-label="Basic segmented"
              >
                <mat-button-toggle value="day">Day</mat-button-toggle>
                <mat-button-toggle value="week">Week</mat-button-toggle>
                <mat-button-toggle value="month">Month</mat-button-toggle>
              </mat-button-toggle-group>
            </section>

            <section class="panel">
              <h2>Controlled Segmented</h2>
              <div class="row">
                <mat-button-toggle-group
                  class="segmented"
                  hideSingleSelectionIndicator
                  [value]="segment()"
                  (change)="segment.set($event.value)"
                  aria-label="Controlled segmented"
                >
                  <mat-button-toggle value="day">Day</mat-button-toggle>
                  <mat-button-toggle value="week">Week</mat-button-toggle>
                  <mat-button-toggle value="month">Month</mat-button-toggle>
                </mat-button-toggle-group>
                <span class="muted">Current: {{ segment() }}</span>
              </div>
            </section>

            <section class="panel">
              <h2>Loading State</h2>
              <div class="row">
                <mat-button-toggle-group
                  class="segmented"
                  hideSingleSelectionIndicator
                  [value]="loadingSegment()"
                  (change)="triggerLoading($event.value)"
                  aria-label="Segmented with loading"
                >
                  <mat-button-toggle value="day">
                    @if (segmentLoading() && loadingSegment() === 'day') {
                      <mat-icon class="spin">autorenew</mat-icon>
                    }
                    Day
                  </mat-button-toggle>
                  <mat-button-toggle value="week">
                    @if (segmentLoading() && loadingSegment() === 'week') {
                      <mat-icon class="spin">autorenew</mat-icon>
                    }
                    Week
                  </mat-button-toggle>
                  <mat-button-toggle value="month">
                    @if (segmentLoading() && loadingSegment() === 'month') {
                      <mat-icon class="spin">autorenew</mat-icon>
                    }
                    Month
                  </mat-button-toggle>
                </mat-button-toggle-group>
                <button mat-stroked-button type="button" (click)="triggerLoading('month')">Set Month</button>
              </div>
              <p class="muted">Selecting an option simulates an async load for that segment.</p>
            </section>

            <section class="panel">
              <h2>Error &amp; Disabled</h2>
              <p class="muted">Disabled</p>
              <mat-button-toggle-group
                class="segmented"
                hideSingleSelectionIndicator
                value="day"
                disabled
                aria-label="Disabled segmented"
              >
                <mat-button-toggle value="day">Day</mat-button-toggle>
                <mat-button-toggle value="week">Week</mat-button-toggle>
                <mat-button-toggle value="month">Month</mat-button-toggle>
              </mat-button-toggle-group>
              <p class="muted">Error style</p>
              <mat-button-toggle-group
                class="segmented error"
                hideSingleSelectionIndicator
                value="day"
                aria-label="Error segmented"
              >
                <mat-button-toggle value="day">Day</mat-button-toggle>
                <mat-button-toggle value="week">Week</mat-button-toggle>
                <mat-button-toggle value="month">Month</mat-button-toggle>
              </mat-button-toggle-group>
              <p class="error-text">Selection required</p>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Tag ============================== -->
        <mat-tab label="Tag">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Tags</h2>
              <div class="row">
                <span class="tag">Default</span>
                <span class="tag primary">Primary</span>
                <span class="tag secondary">Secondary</span>
                <span class="tag success">Success</span>
                <span class="tag warning">Warning</span>
                <span class="tag error">Error</span>
                <span class="tag info">Info</span>
              </div>
            </section>

            <section class="panel">
              <h2>Sizes &amp; Disabled</h2>
              <div class="row end">
                <span class="tag sm">Small Tag</span>
                <span class="tag md primary">Medium Tag</span>
                <span class="tag lg success">Large Tag</span>
              </div>
              <div class="row">
                <span class="tag disabled">Disabled Default</span>
                <span class="tag primary disabled">Disabled Primary</span>
                <span class="tag success disabled">Disabled Success</span>
              </div>
              <div class="row">
                <span class="tag gradient">Gradient</span>
                <span class="tag dark">Dark Theme</span>
                <span class="tag outline-style">Outline Style</span>
                <span class="tag square">Square Corners</span>
              </div>
            </section>

            <section class="panel">
              <h2>Closable Tags</h2>
              <div class="row">
                @for (label of closableTags; track label) {
                  @if (!closedTags().includes(label)) {
                    <mat-chip [removable]="true" (removed)="dismissTag(label)">
                      {{ label }}
                      <mat-icon matChipRemove>cancel</mat-icon>
                    </mat-chip>
                  }
                }
              </div>
              <div class="row">
                <mat-chip-set aria-label="Framework tags">
                  <mat-chip highlighted>Angular</mat-chip>
                  <mat-chip>Material</mat-chip>
                  <mat-chip>Signals</mat-chip>
                </mat-chip-set>
                <button mat-stroked-button type="button" (click)="resetTags()">Reset closed tags</button>
              </div>
            </section>

            <section class="panel">
              <h2>Interactive Tag List</h2>
              <div class="tag-list">
                @for (tag of tags(); track tag.id) {
                  <mat-chip [removable]="true" (removed)="removeTag(tag.id)">
                    {{ tag.label }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                <button mat-stroked-button type="button" (click)="addTag()">Add Tag</button>
              </div>
              <div class="tag-cloud">
                @for (tech of tagCloud; track tech) {
                  <span [class]="'tag ' + cloudVariant($index) + ' ' + cloudSize($index)">{{ tech }}</span>
                }
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Timeline ============================== -->
        <mat-tab label="Timeline">
          <div class="tab-body">
            <section class="panel">
              <h2>Horizontal Alternate</h2>
              <div class="timeline-horizontal">
                @for (step of timelineSteps; track step.title; let i = $index) {
                  <button
                    type="button"
                    class="tl-h-item"
                    [class.active]="activeStep() === i"
                    (click)="activeStep.set(i)"
                  >
                    <span class="tl-h-title">{{ step.title }}</span>
                    <span class="tl-h-meta">{{ step.date }}</span>
                    <span class="tl-node"><mat-icon>{{ step.icon }}</mat-icon></span>
                  </button>
                }
              </div>
              <p class="muted">{{ timelineSteps[activeStep()].description }}</p>
            </section>

            <section class="panel">
              <h2>Vertical Timeline</h2>
              <div class="timeline-vertical">
                @for (step of timelineSteps; track step.title; let i = $index) {
                  <button
                    type="button"
                    class="tl-v-item"
                    [class.active]="activeStep() === i"
                    (click)="activeStep.set(i)"
                  >
                    <span class="tl-v-rail">
                      <span class="tl-node"><mat-icon>{{ step.icon }}</mat-icon></span>
                    </span>
                    <span class="tl-v-body">
                      <span class="tl-v-head">
                        <strong>{{ step.title }}</strong>
                        <small>{{ step.date }}</small>
                      </span>
                      <span class="muted">{{ step.description }}</span>
                    </span>
                  </button>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Compact Steps</h2>
              <div class="timeline-compact">
                @for (step of timelineSteps; track step.title; let i = $index) {
                  <button
                    type="button"
                    class="compact-step"
                    [class.active]="activeStep() === i"
                    (click)="activeStep.set(i)"
                  >
                    <span class="compact-index">{{ i + 1 }}</span>
                    <span class="compact-text">
                      <strong>{{ step.title }}</strong>
                      <small>{{ step.description }}</small>
                    </span>
                    <span class="compact-date">{{ step.date }}</span>
                  </button>
                }
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Tooltip ============================== -->
        <mat-tab label="Tooltip">
          <div class="tab-body">
            <section class="panel">
              <h2>Basic Tooltips</h2>
              <div class="row">
                <button mat-stroked-button type="button" matTooltip="This is a tooltip">Hover me</button>
                <button mat-icon-button type="button" matTooltip="Delete item" aria-label="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
                <span class="tip-text" matTooltip="Inline text tooltip">Inline target</span>
                <span class="tip-pill" matTooltip="End-to-end encrypted. Only you can read this conversation.">
                  <mat-icon>verified_user</mat-icon>
                  End-to-end encrypted
                </span>
              </div>
            </section>

            <section class="panel">
              <h2>Positions</h2>
              <div class="row center">
                <button mat-stroked-button type="button" matTooltip="Tooltip above" matTooltipPosition="above">Above</button>
                <button mat-stroked-button type="button" matTooltip="Tooltip below" matTooltipPosition="below">Below</button>
                <button mat-stroked-button type="button" matTooltip="Tooltip left" matTooltipPosition="left">Left</button>
                <button mat-stroked-button type="button" matTooltip="Tooltip right" matTooltipPosition="right">Right</button>
              </div>
            </section>

            <section class="panel">
              <h2>Delays &amp; Rich Hints</h2>
              <div class="row">
                <button
                  mat-stroked-button
                  type="button"
                  matTooltip="Shown after a short delay"
                  matTooltipShowDelay="600"
                  matTooltipHideDelay="300"
                >
                  Delayed tooltip
                </button>
                <button
                  mat-flat-button
                  type="button"
                  color="warn"
                  matTooltip="This action cannot be undone"
                  matTooltipPosition="below"
                >
                  <mat-icon>warning</mat-icon>
                  Delete project
                </button>
                <button mat-icon-button type="button" matTooltip="Global search (Ctrl + K)" aria-label="Search">
                  <mat-icon>search</mat-icon>
                </button>
              </div>
              <p class="muted">Tooltips can describe destructive actions, shortcuts, and verification states.</p>
            </section>
          </div>
        </mat-tab>

        <!-- ============================== Tour ============================== -->
        <mat-tab label="Tour">
          <div class="tab-body">
            <section class="panel">
              <h2>Guided Tour</h2>
              <mat-stepper [selectedIndex]="tourStep()" (selectionChange)="tourStep.set($event.selectedIndex)">
                <mat-step label="Main Action">
                  <p class="muted">Step 1 — This is the main action button. Click it to submit the form.</p>
                  <div class="tour-target">
                    <button mat-flat-button type="button">Submit</button>
                    <span class="tour-badge">1</span>
                  </div>
                  <div class="row end">
                    <button mat-stroked-button type="button" matStepperNext>Next</button>
                  </div>
                </mat-step>
                <mat-step label="Search Box">
                  <p class="muted">Step 2 — Search for the content you want here.</p>
                  <div class="tour-target wide">
                    <input class="demo-input" placeholder="Search content" />
                    <span class="tour-badge">2</span>
                  </div>
                  <div class="row split">
                    <button mat-stroked-button type="button" matStepperPrevious>Back</button>
                    <button mat-stroked-button type="button" matStepperNext>Next</button>
                  </div>
                </mat-step>
                <mat-step label="Finish">
                  <p class="muted">Step 3 — You are ready to go. Restart the tour at any time.</p>
                  <div class="row">
                    <button mat-stroked-button type="button" matStepperPrevious>Back</button>
                    <button mat-flat-button type="button" (click)="restartTour()">Restart tour</button>
                  </div>
                </mat-step>
              </mat-stepper>
            </section>

            <section class="panel">
              <h2>Spotlight Targets</h2>
              <div class="tour-grid">
                <div class="tour-card" [class.spotlight]="tourStep() === 0">
                  <span class="tour-badge">1</span>
                  <strong>Main action</strong>
                  <p class="muted">Primary call to action for the page.</p>
                  <button mat-flat-button type="button">Submit</button>
                </div>
                <div class="tour-card" [class.spotlight]="tourStep() === 1">
                  <span class="tour-badge">2</span>
                  <strong>Search box</strong>
                  <p class="muted">Find records, users and settings quickly.</p>
                  <input class="demo-input" placeholder="Search content" />
                </div>
                <div class="tour-card" [class.spotlight]="tourStep() === 2">
                  <span class="tour-badge">3</span>
                  <strong>Finish</strong>
                  <p class="muted">The tour can be replayed whenever needed.</p>
                  <button mat-stroked-button type="button" (click)="restartTour()">Restart</button>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Tour Settings</h2>
              <div class="row">
                <button mat-stroked-button type="button" (click)="tourStep.set(0)">Go to step 1</button>
                <button mat-stroked-button type="button" (click)="tourStep.set(1)">Go to step 2</button>
                <button mat-stroked-button type="button" (click)="tourStep.set(2)">Go to step 3</button>
                <button mat-flat-button type="button" (click)="restartTour()">Start Tour</button>
              </div>
              <p class="muted">Current step: {{ tourStep() + 1 }} of 3</p>
            </section>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      /* 16 tabs overflow the pill track: let the header scroll horizontally. */
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
      .row,
      .card-row {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        margin: 10px 0;
      }
      .row.center,
      .card-row.center {
        justify-content: center;
      }
      .row.end {
        align-items: flex-end;
      }
      .row.split {
        justify-content: space-between;
      }
      .stack-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
        border-bottom: 1px solid var(--app-border);
      }
      .stack-row:last-child {
        border-bottom: 0;
      }
      .context-list {
        padding: 4px 12px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .small {
        font-size: 0.75rem;
      }
      .spaced {
        margin-top: 12px;
      }
      .full {
        width: 100%;
      }

      /* Avatars */
      .avatar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .avatar-item small {
        font-size: 0.66rem;
        color: var(--app-muted-foreground);
      }
      .avatar-wrap {
        position: relative;
        display: inline-flex;
      }
      .avatar {
        display: inline-grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        color: #fff;
        font-weight: 700;
        font-size: 0.85rem;
        flex: 0 0 auto;
      }
      .avatar.square {
        border-radius: 2px;
      }
      .avatar.rounded-md {
        border-radius: 8px;
      }
      .avatar.wide {
        width: auto;
        padding: 0 12px;
      }
      .avatar .mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .avatar-sm {
        width: 32px;
        height: 32px;
        font-size: 0.72rem;
      }
      .avatar-md {
        width: 48px;
        height: 48px;
        font-size: 1rem;
      }
      .avatar-lg {
        width: 64px;
        height: 64px;
        font-size: 1.3rem;
      }
      .avatar-xl {
        width: 96px;
        height: 96px;
        font-size: 1.9rem;
      }
      .avatar-xl .mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
      .av-orange {
        background: linear-gradient(135deg, #f59e0b, #ea580c);
      }
      .av-blue {
        background: linear-gradient(135deg, #60a5fa, #2563eb);
      }
      .av-teal {
        background: linear-gradient(135deg, #2dd4bf, #0f766e);
      }
      .av-violet {
        background: linear-gradient(135deg, #a78bfa, #7c3aed);
      }
      .av-gradient {
        background: linear-gradient(135deg, #38bdf8, #6366f1);
      }
      .av-muted {
        background: var(--app-muted);
        color: var(--app-foreground);
      }
      .avatar-dot {
        position: absolute;
        right: -1px;
        bottom: -1px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--app-card);
        background: #a1a1aa;
      }
      .avatar-dot.online {
        background: #22c55e;
      }
      .avatar-dot.away {
        background: #eab308;
      }
      .avatar-dot.offline {
        background: #ef4444;
      }
      .avatar-group {
        display: flex;
        align-items: center;
        padding: 4px 0;
      }
      .avatar-group .avatar {
        border: 2px solid var(--app-card);
        margin-right: -12px;
      }
      .sizes-strip {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }

      /* Badges */
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
        line-height: 1.5;
        border: 1px solid transparent;
      }
      .badge .mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
      .badge.default {
        background: var(--app-primary);
        color: var(--app-primary-foreground);
      }
      .badge.secondary {
        background: var(--app-muted);
        color: var(--app-foreground);
      }
      .badge.destructive {
        background: var(--app-destructive);
        color: #fff;
      }
      .badge.warning {
        background: rgba(217, 119, 6, 0.14);
        color: color-mix(in srgb, #d97706 72%, var(--app-foreground));
      }
      .badge.outline {
        border-color: var(--app-border);
        color: var(--app-foreground);
      }
      .badge.custom-green {
        background: #22c55e;
        color: #fff;
      }
      .badge.custom-purple {
        background: #a855f7;
        color: #fff;
      }
      .badge.custom-yellow {
        background: #eab308;
        color: #111;
      }
      .badge.round {
        padding: 2px 12px;
      }
      .badge.large {
        font-size: 0.8rem;
        padding: 4px 12px;
      }
      .badge-anchor {
        display: inline-flex;
        padding: 6px 8px;
        font-size: 0.82rem;
      }

      /* Calendar */
      .calendar-row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
      }
      .calendar-row .mat-calendar {
        width: 296px;
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
      }
      .side-card {
        flex: 1 1 260px;
        max-width: 420px;
      }
      .date-large {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 4px;
      }

      /* Cards */
      .demo-card {
        max-width: 420px;
      }
      .icon-line {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 0;
        font-size: 0.85rem;
      }
      .icon-line .mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--app-muted-foreground);
      }
      .split {
        display: flex;
        justify-content: space-between;
        gap: 10px;
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
      input[type='color'] {
        width: 40px;
        height: 28px;
        padding: 0;
        border: 1px solid var(--app-border);
        border-radius: 6px;
        background: transparent;
      }
      .check-line {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        font-size: 0.8rem;
      }
      .nav-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .nav-card mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
        padding-top: 16px;
      }
      .nav-card p {
        margin: 0 0 8px;
        font-size: 0.75rem;
      }
      .glyph {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
      }
      .glyph.blue {
        background: rgba(37, 99, 235, 0.12);
        color: color-mix(in srgb, #2563eb 72%, var(--app-foreground));
      }
      .glyph.green {
        background: rgba(22, 163, 74, 0.12);
        color: color-mix(in srgb, #16a34a 72%, var(--app-foreground));
      }
      .glyph.purple {
        background: rgba(147, 51, 234, 0.12);
        color: color-mix(in srgb, #9333ea 72%, var(--app-foreground));
      }
      .glyph.orange {
        background: rgba(234, 88, 12, 0.12);
        color: color-mix(in srgb, #ea580c 72%, var(--app-foreground));
      }

      /* Carousel */
      .carousel {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
      }
      .carousel-stage {
        width: 260px;
        max-width: 100%;
      }
      .carousel-stage.wide {
        width: 420px;
      }
      .carousel-card {
        width: 100%;
      }
      .carousel-number {
        display: grid;
        place-items: center;
        aspect-ratio: 16 / 9;
        font-size: 2.2rem;
        font-weight: 700;
      }
      .gradient-blue {
        background: linear-gradient(135deg, rgba(96, 165, 250, 0.18), rgba(168, 85, 247, 0.18));
      }
      .slide-title {
        font-size: 1.1rem;
      }
      .carousel-card p {
        margin: 4px 0 0;
        font-size: 0.8rem;
      }
      .dots {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 10px;
      }
      .dot {
        width: 7px;
        height: 7px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--app-border);
        cursor: pointer;
      }
      .dot.active {
        width: 18px;
        border-radius: 999px;
        background: var(--app-primary);
      }
      .image-slide {
        position: relative;
        display: grid;
        place-items: center;
        aspect-ratio: 16 / 9;
        border-radius: var(--app-radius);
        border: 1px solid var(--app-border);
        background: linear-gradient(135deg, #0f766e, #1d4ed8);
        color: #fff;
      }
      .image-slide .mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.7;
      }
      .image-caption {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 10px 12px;
        font-weight: 600;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        border-radius: 0 0 var(--app-radius) var(--app-radius);
      }

      /* Accordion */
      .demo-accordion {
        max-width: 560px;
      }
      .demo-accordion p {
        margin: 0 0 8px;
        font-size: 0.82rem;
        line-height: 1.6;
        color: var(--app-muted-foreground);
      }
      .demo-accordion.custom .mat-expansion-panel {
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        margin-bottom: 8px;
      }

      /* Descriptions */
      .desc-heading {
        margin-bottom: 6px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .desc-grid {
        display: grid;
        border-radius: var(--app-radius);
      }
      .desc-grid.cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .desc-grid.cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .desc-cell {
        display: flex;
        gap: 8px;
        padding: 8px 10px;
        font-size: 0.8rem;
        min-width: 0;
      }
      .desc-grid.bordered {
        border: 1px solid var(--app-border);
        overflow: hidden;
      }
      .desc-grid.bordered .desc-cell {
        border-right: 1px solid var(--app-border);
        border-bottom: 1px solid var(--app-border);
      }
      .desc-grid.vertical .desc-cell {
        flex-direction: column;
        gap: 2px;
      }
      .desc-label {
        color: var(--app-muted-foreground);
        flex: 0 0 auto;
      }
      .desc-grid.horizontal .desc-label {
        min-width: 78px;
      }
      .desc-value {
        font-weight: 500;
        overflow-wrap: anywhere;
      }
      .desc-value.success {
        color: color-mix(in srgb, #16a34a 72%, var(--app-foreground));
      }
      .span-2 {
        grid-column: span 2;
      }
      .span-4 {
        grid-column: span 4;
      }

      /* Empty */
      .empty-card {
        border: 1px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: color-mix(in srgb, var(--app-muted) 40%, transparent);
      }
      .empty-state > strong {
        font-size: 0.95rem;
      }
      .empty-state p {
        margin: 0;
        font-size: 0.8rem;
        max-width: 34ch;
      }
      .empty-state > .mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
      .empty-icon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: var(--app-muted);
        color: var(--app-muted-foreground);
      }
      .media-circle {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #7c3aed);
        color: #fff;
        font-size: 1.4rem;
        font-weight: 700;
      }

      /* Image tab */
      .card-row .image-card {
        width: 220px;
      }
      .image-card mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
        padding-top: 16px;
      }
      .image-card p {
        margin: 0;
        font-size: 0.75rem;
      }
      .image-card mat-card-content > strong {
        font-size: 0.85rem;
      }

      /* Popover */
      .popover-panel {
        display: grid;
        gap: 8px;
        width: 260px;
        max-width: 100%;
        padding: 4px 2px;
      }
      .popover-panel.narrow {
        width: 160px;
        padding: 4px 8px;
        font-size: 0.82rem;
      }
      .popover-panel.scrollable {
        width: 260px;
        max-height: 240px;
        overflow-y: auto;
      }
      .popover-panel p {
        margin: 0;
        font-size: 0.78rem;
      }
      .popover-panel strong {
        font-size: 0.88rem;
      }
      .popover-field {
        display: grid;
        grid-template-columns: 90px 1fr;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
      }

      /* QRCode */
      .qr-frame {
        display: inline-flex;
        padding: 10px;
        margin-top: 10px;
        border-radius: 8px;
        background: #fff;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
      }
      .qr {
        position: relative;
        background-image:
          linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%),
          linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%);
        background-size: 12px 12px;
        background-position: 0 0, 6px 6px;
        opacity: 0.92;
      }
      .qr-finder {
        position: absolute;
        width: 26%;
        height: 26%;
        box-sizing: border-box;
        border: 5px solid currentColor;
        background: transparent;
      }
      .qr-finder.tl {
        top: 0;
        left: 0;
      }
      .qr-finder.tr {
        top: 0;
        right: 0;
      }
      .qr-finder.bl {
        bottom: 0;
        left: 0;
      }
      .qr-finder.br {
        bottom: 0;
        right: 0;
      }
      .qr-dynamic {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .qr-controls {
        flex: 1 1 260px;
        max-width: 340px;
      }
      .qr-preview {
        display: grid;
        place-items: center;
        flex: 1 1 300px;
        min-height: 240px;
        padding: 20px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
      }
      .color-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 10px 0;
      }
      .color-row .field-label {
        margin: 0;
      }

      /* Segmented */
      .segmented {
        border: 1px solid var(--app-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .segmented .mat-button-toggle {
        font-size: 0.8rem;
      }
      .segmented.error {
        border-color: var(--app-destructive);
      }
      .error-text {
        margin: 6px 0 0;
        color: var(--app-destructive);
        font-size: 0.75rem;
      }
      .spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Tags */
      .tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 999px;
        border: 1px solid var(--app-border);
        background: var(--app-muted);
        color: var(--app-foreground);
        font-size: 0.7rem;
        font-weight: 600;
        line-height: 1.5;
      }
      .tag.primary {
        border-color: transparent;
        background: var(--app-primary);
        color: var(--app-primary-foreground);
      }
      .tag.secondary {
        border-color: transparent;
        background: rgba(113, 113, 122, 0.16);
      }
      .tag.success {
        border-color: transparent;
        background: rgba(22, 163, 74, 0.12);
        color: color-mix(in srgb, #16a34a 72%, var(--app-foreground));
      }
      .tag.warning {
        border-color: transparent;
        background: rgba(217, 119, 6, 0.12);
        color: color-mix(in srgb, #d97706 72%, var(--app-foreground));
      }
      .tag.error {
        border-color: transparent;
        background: rgba(185, 28, 28, 0.1);
        color: color-mix(in srgb, #dc2626 72%, var(--app-foreground));
      }
      .tag.info {
        border-color: transparent;
        background: rgba(37, 99, 235, 0.1);
        color: color-mix(in srgb, #2563eb 72%, var(--app-foreground));
      }
      .tag.sm {
        font-size: 0.64rem;
        padding: 2px 8px;
      }
      .tag.md {
        font-size: 0.7rem;
      }
      .tag.lg {
        font-size: 0.8rem;
        padding: 4px 12px;
      }
      .tag.disabled {
        opacity: 0.45;
        pointer-events: none;
      }
      .tag.gradient {
        border-color: transparent;
        background: linear-gradient(90deg, #c084fc, #f472b6);
        color: #fff;
      }
      .tag.dark {
        border-color: #18181b;
        background: #18181b;
        color: #fafafa;
      }
      .tag.outline-style {
        background: transparent;
        border-color: #2563eb;
        color: #2563eb;
      }
      .tag.square {
        border-radius: 3px;
      }
      .tag-list {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .tag-cloud {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        padding: 14px;
        margin-top: 12px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }

      /* Timeline */
      .timeline-horizontal {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tl-h-item {
        position: relative;
        flex: 1 1 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 10px 6px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      .tl-h-item.active {
        border-color: var(--app-primary);
        background: color-mix(in srgb, var(--app-primary) 8%, transparent);
      }
      .tl-h-title {
        font-size: 0.78rem;
        font-weight: 600;
      }
      .tl-h-meta {
        order: 3;
        font-size: 0.64rem;
        letter-spacing: 0.06em;
        color: var(--app-muted-foreground);
      }
      .tl-node {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--app-muted);
        color: var(--app-muted-foreground);
      }
      .tl-h-item.active .tl-node,
      .tl-v-item.active .tl-node {
        background: var(--app-primary);
        color: var(--app-primary-foreground);
      }
      .tl-node .mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .timeline-vertical {
        display: flex;
        flex-direction: column;
      }
      .tl-v-item {
        display: flex;
        gap: 12px;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .tl-v-rail {
        position: relative;
        display: flex;
        justify-content: center;
        width: 40px;
        flex: 0 0 auto;
        padding-bottom: 8px;
      }
      .tl-v-rail::after {
        content: '';
        position: absolute;
        top: 36px;
        bottom: 0;
        width: 2px;
        background: var(--app-border);
      }
      .tl-v-item:last-child .tl-v-rail::after {
        display: none;
      }
      .tl-v-body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-bottom: 18px;
        font-size: 0.8rem;
      }
      .tl-v-head {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      .tl-v-head small {
        color: var(--app-muted-foreground);
        font-size: 0.64rem;
        letter-spacing: 0.06em;
      }
      .timeline-compact {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .compact-step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .compact-step.active {
        border-color: var(--app-primary);
        background: color-mix(in srgb, var(--app-primary) 8%, transparent);
      }
      .compact-index {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--app-muted);
        font-size: 0.7rem;
        font-weight: 700;
        flex: 0 0 auto;
      }
      .compact-text {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }
      .compact-text small {
        color: var(--app-muted-foreground);
        font-size: 0.72rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .compact-date {
        color: var(--app-muted-foreground);
        font-size: 0.64rem;
        letter-spacing: 0.06em;
      }

      /* Tooltips */
      .tip-text {
        font-size: 0.82rem;
        text-decoration: underline dotted;
        cursor: help;
      }
      .tip-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid rgba(16, 185, 129, 0.24);
        background: rgba(16, 185, 129, 0.1);
        color: color-mix(in srgb, #059669 72%, var(--app-foreground));
        font-size: 0.78rem;
        font-weight: 600;
        cursor: help;
      }
      .tip-pill .mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* Tour */
      .tour-target {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding: 12px;
        margin: 10px 0;
        border: 1px dashed var(--app-primary);
        border-radius: var(--app-radius);
      }
      .tour-target.wide {
        display: flex;
        max-width: 360px;
      }
      .tour-target.wide .demo-input {
        padding-right: 32px;
      }
      .tour-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        display: grid;
        place-items: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--app-primary);
        color: var(--app-primary-foreground);
        font-size: 0.65rem;
        font-weight: 700;
      }
      .tour-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      .tour-card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 14px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
      }
      .tour-card.spotlight {
        border-color: var(--app-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-primary) 18%, transparent);
      }
      .tour-card p {
        margin: 0;
        font-size: 0.76rem;
      }
    `,
  ],
})
export class ComponentDisplayComponent implements OnDestroy {
  readonly basicSlides = [1, 2, 3, 4, 5];
  readonly contentSlides = [
    { title: 'Beautiful Landscape', description: 'Enjoy the view of mountains and valleys' },
    { title: 'Ocean Waves', description: 'Feel the calmness of the ocean' },
    { title: 'City Skyline', description: 'Experience urban life at its finest' },
    { title: 'Forest Path', description: "Discover nature's secret trails" },
  ];
  readonly imageSlides = [
    { title: 'Nature Scene 1' },
    { title: 'Nature Scene 2' },
    { title: 'Nature Scene 3' },
    { title: 'Nature Scene 4' },
  ];

  readonly basicSlide = signal(0);
  readonly contentSlide = signal(0);
  readonly imageSlide = signal(0);

  readonly selectedDate = signal<Date | null>(new Date());
  readonly selectedRange = signal<DateRange<Date> | null>(null);
  readonly disabledDate = signal<Date | null>(new Date());
  private readonly rangeStart = signal<Date | null>(null);
  readonly today = new Date();

  readonly qrUrl = signal('https://example.com');
  readonly qrSize = signal(160);
  readonly qrFg = signal('#18181b');
  readonly qrBg = signal('#ffffff');
  readonly qrCopied = signal(false);

  readonly segment = signal('week');
  readonly loadingSegment = signal('day');
  readonly segmentLoading = signal(false);

  readonly tags = signal<TagItem[]>([
    { id: 1, label: 'React' },
    { id: 2, label: 'TypeScript' },
    { id: 3, label: 'Tailwind CSS' },
  ]);
  readonly closableTags = ['Primary', 'Success', 'Warning', 'Error'];
  readonly closedTags = signal<string[]>([]);
  readonly tagCloud = [
    'JavaScript',
    'CSS',
    'HTML',
    'Node.js',
    'Express',
    'MongoDB',
    'Python',
    'Django',
    'Flask',
    'Java',
    'Spring',
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'GraphQL',
    'REST',
    'API',
    'Database',
    'Backend',
    'Frontend',
    'Fullstack',
  ];

  readonly timelineSteps: TimelineStep[] = [
    {
      title: 'Security Check',
      date: 'STEP 01',
      icon: 'shield',
      description: 'Full-system scan ensures the environment is safe and reliable.',
    },
    {
      title: 'Performance Boost',
      date: 'STEP 02',
      icon: 'bolt',
      description: 'Cache tuning improves response times by 200%.',
    },
    {
      title: 'Global Deploy',
      date: 'STEP 03',
      icon: 'public',
      description: 'Multi-node sync across 12 time zones worldwide.',
    },
    {
      title: 'Customer Delight',
      date: 'STEP 04',
      icon: 'favorite',
      description: '24/7 support with a 99% satisfaction score.',
    },
  ];
  readonly activeStep = signal(0);

  readonly tourStep = signal(0);

  private segmentTimer: ReturnType<typeof setTimeout> | undefined;
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  next(target: WritableSignal<number>, total: number): void {
    target.update((index) => (index + 1) % total);
  }

  prev(target: WritableSignal<number>, total: number): void {
    target.update((index) => (index - 1 + total) % total);
  }

  selectRange(value: Date | DateRange<Date> | null): void {
    if (!value) {
      return;
    }
    if (value instanceof DateRange) {
      this.selectedRange.set(value);
      this.rangeStart.set(null);
      return;
    }
    const start = this.rangeStart();
    if (!start) {
      this.rangeStart.set(value);
      this.selectedRange.set(new DateRange<Date>(value, null));
      return;
    }
    const from = start <= value ? start : value;
    const to = start <= value ? value : start;
    this.selectedRange.set(new DateRange<Date>(from, to));
    this.rangeStart.set(null);
  }

  rangeDays(): number {
    const range = this.selectedRange();
    if (!range?.start || !range?.end) {
      return 0;
    }
    return Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1;
  }

  resetDate(): void {
    this.disabledDate.set(new Date());
  }

  setText(event: Event, target: WritableSignal<string>): void {
    target.set((event.target as HTMLInputElement).value);
  }

  setNumber(event: Event, target: WritableSignal<number>): void {
    target.set(Number((event.target as HTMLInputElement).value));
  }

  copyQrUrl(): void {
    void navigator.clipboard?.writeText(this.qrUrl()).catch(() => undefined);
    this.qrCopied.set(true);
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.qrCopied.set(false), 1600);
  }

  triggerLoading(value: string): void {
    this.loadingSegment.set(value);
    this.segmentLoading.set(true);
    clearTimeout(this.segmentTimer);
    this.segmentTimer = setTimeout(() => this.segmentLoading.set(false), 1200);
  }

  dismissTag(label: string): void {
    this.closedTags.update((labels) => (labels.includes(label) ? labels : [...labels, label]));
  }

  resetTags(): void {
    this.closedTags.set([]);
  }

  removeTag(id: number): void {
    this.tags.update((tags) => tags.filter((tag) => tag.id !== id));
  }

  addTag(): void {
    const tags = this.tags();
    const nextId = tags.length ? Math.max(...tags.map((tag) => tag.id)) + 1 : 1;
    this.tags.set([...tags, { id: nextId, label: `Tag ${nextId}` }]);
  }

  cloudVariant(index: number): string {
    return ['primary', 'secondary', 'success', 'warning', 'error', 'info', ''][index % 7];
  }

  cloudSize(index: number): string {
    return ['sm', 'md', 'lg'][index % 3];
  }

  restartTour(): void {
    this.tourStep.set(0);
  }

  ngOnDestroy(): void {
    clearTimeout(this.segmentTimer);
    clearTimeout(this.copyTimer);
  }
}
