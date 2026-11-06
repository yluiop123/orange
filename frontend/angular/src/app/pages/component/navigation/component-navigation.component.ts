import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';

interface AnchorSection {
  id: string;
  title: string;
  lead: string;
  lines: string[];
}

interface SidebarItem {
  id: string;
  title: string;
  icon: string;
  description: string;
}

interface Crumb {
  key: string;
  label: string;
  href: string;
}

@Component({
  selector: 'app-component-navigation',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatStepperModule,
    MatTabsModule,
  ],
  template: `
    <div class="page">

      <mat-tab-group class="orange-tabs" animationDuration="120ms">
        <mat-tab label="Anchor">
          <div class="tab-pane">
            <section class="panel anchor-panel">
              <h2>Anchor / 锚点导航</h2>
              <p class="muted">Scroll the content pane; the active link follows the visible section.</p>

              <div class="anchor-layout">
                <nav class="anchor-nav" aria-label="Anchor navigation">
                  @for (section of anchorSections; track section.id) {
                    <button
                      type="button"
                      class="anchor-link"
                      [class.active]="activeAnchor() === section.id"
                      (click)="goToAnchor(scroller, section.id)"
                    >
                      {{ section.title }}
                    </button>
                  }
                </nav>

                <div class="anchor-scroll" #scroller (scroll)="onAnchorScroll($event)">
                  @for (section of anchorSections; track section.id) {
                    <section class="anchor-section" [id]="section.id">
                      <h3>{{ section.title }}</h3>
                      <p class="muted">{{ section.lead }}</p>
                      @for (line of section.lines; track $index) {
                        <p class="anchor-copy">{{ line }}</p>
                      }
                    </section>
                  }
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Scroll-spy behaviour</h2>
              <ul class="notes">
                <li>The active link is recalculated on every scroll with a 80px activation offset.</li>
                <li>Clicking a link updates the highlight immediately and smooth-scrolls the pane.</li>
                <li>No router involvement: the anchor ids are local to this demo pane.</li>
              </ul>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Breadcrumb">
          <div class="tab-pane">
            <section class="panel">
              <h2>1. Basic usage / 最简单的用法</h2>
              <nav class="crumbs" aria-label="Basic breadcrumb">
                @for (crumb of baseCrumbs; track crumb.key; let last = $last) {
                  @if (last) {
                    <span class="current">{{ crumb.label }}</span>
                  } @else {
                    <a [href]="crumb.href" (click)="$event.preventDefault()">{{ crumb.label }}</a>
                    <mat-icon class="crumb-sep">chevron_right</mat-icon>
                  }
                }
              </nav>
            </section>

            <section class="panel">
              <h2>2. Icon before label / 图标放在文字前面</h2>
              <nav class="crumbs" aria-label="Breadcrumb with icon">
                @for (crumb of baseCrumbs; track crumb.key; let last = $last) {
                  @if (crumb.key === 'home') {
                    <mat-icon class="home-icon">home</mat-icon>
                  }
                  @if (last) {
                    <span class="current">{{ crumb.label }}</span>
                  } @else {
                    <a [href]="crumb.href" (click)="$event.preventDefault()">{{ crumb.label }}</a>
                    <mat-icon class="crumb-sep">chevron_right</mat-icon>
                  }
                }
              </nav>
            </section>

            <section class="panel">
              <h2>3. Custom separator / 自定义分隔符</h2>
              <nav class="crumbs" aria-label="Breadcrumb with slash separator">
                @for (crumb of baseCrumbs; track crumb.key; let last = $last) {
                  @if (last) {
                    <span class="current">{{ crumb.label }}</span>
                  } @else {
                    <a [href]="crumb.href" (click)="$event.preventDefault()">{{ crumb.label }}</a>
                    <span class="crumb-slash">/</span>
                  }
                }
              </nav>
            </section>

            <section class="panel">
              <h2>4. Dropdown menu breadcrumb / 带下拉菜单</h2>
              <nav class="crumbs" aria-label="Breadcrumb with dropdown">
                <mat-icon class="home-icon">home</mat-icon>
                <a href="#" (click)="$event.preventDefault()">Home</a>
                <mat-icon class="crumb-sep">chevron_right</mat-icon>
                <button mat-button class="crumb-menu-button" type="button" [matMenuTriggerFor]="docsMenu">
                  Docs <mat-icon>arrow_drop_down</mat-icon>
                </button>
                <mat-icon class="crumb-sep">chevron_right</mat-icon>
                <a href="#" (click)="$event.preventDefault()">Components</a>
                <mat-icon class="crumb-sep">chevron_right</mat-icon>
                <span class="current">Breadcrumb</span>
                <mat-menu #docsMenu="matMenu">
                  <button mat-menu-item type="button">Getting started</button>
                  <button mat-menu-item type="button">Components</button>
                  <button mat-menu-item type="button">Primitives</button>
                </mat-menu>
              </nav>
            </section>

            <section class="panel">
              <h2>5. Per-item separator / 单独分隔符</h2>
              <nav class="crumbs" aria-label="Breadcrumb with mixed separators">
                @for (crumb of baseCrumbs; track crumb.key; let last = $last) {
                  @if (last) {
                    <span class="current">{{ crumb.label }}</span>
                  } @else {
                    <a [href]="crumb.href" (click)="$event.preventDefault()">{{ crumb.label }}</a>
                    @if (crumb.key === 'components') {
                      <span class="crumb-slash">•</span>
                    } @else {
                      <mat-icon class="crumb-sep">chevron_right</mat-icon>
                    }
                  }
                }
              </nav>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Dropdown">
          <div class="tab-pane">
            <section class="panel">
              <h2>1. Button trigger / 按钮触发</h2>
              <button mat-stroked-button type="button" [matMenuTriggerFor]="actionsMenu">
                操作 / Actions <mat-icon>keyboard_arrow_down</mat-icon>
              </button>
              <mat-menu #actionsMenu="matMenu">
                <button mat-menu-item type="button" (click)="selectAction('New / 新建')">
                  <mat-icon>note_add</mat-icon><span>新建 / New</span>
                </button>
                <button mat-menu-item type="button" (click)="selectAction('Edit / 编辑')">
                  <mat-icon>edit</mat-icon><span>编辑 / Edit</span>
                </button>
                <button mat-menu-item type="button" (click)="selectAction('Delete / 删除')">
                  <mat-icon>delete</mat-icon><span>删除 / Delete</span>
                </button>
              </mat-menu>
            </section>

            <section class="panel">
              <h2>2. Group &amp; disabled / 分组与禁用</h2>
              <button mat-stroked-button type="button" [matMenuTriggerFor]="userMenu">
                用户管理 / User Menu
              </button>
              <mat-menu #userMenu="matMenu">
                <div class="menu-label">账户操作 / Account Actions</div>
                <mat-divider />
                <button mat-menu-item type="button" (click)="selectAction('Profile / 个人信息')">
                  <mat-icon>person</mat-icon><span>个人信息 / Profile</span>
                </button>
                <button mat-menu-item type="button" disabled>
                  <mat-icon>settings</mat-icon><span>设置（禁用）/ Settings</span>
                </button>
                <mat-divider />
                <button mat-menu-item type="button" (click)="selectAction('Logout / 退出登录')">
                  <mat-icon>logout</mat-icon><span>退出登录 / Logout</span>
                </button>
              </mat-menu>
            </section>

            <section class="panel">
              <h2>3. Submenu / 子菜单</h2>
              <button mat-stroked-button type="button" [matMenuTriggerFor]="moreMenu">
                更多选项 / More Options
              </button>
              <mat-menu #moreMenu="matMenu">
                <button mat-menu-item type="button">简单项 / Simple Item</button>
                <button mat-menu-item type="button" [matMenuTriggerFor]="advancedMenu">
                  <mat-icon>tune</mat-icon>
                  <span>高级设置 / Advanced</span>
                  <mat-icon class="menu-arrow">chevron_right</mat-icon>
                </button>
              </mat-menu>
              <mat-menu #advancedMenu="matMenu">
                <button mat-menu-item type="button" (click)="selectAction('Security / 安全设置')">
                  安全设置 / Security
                </button>
                <button mat-menu-item type="button" (click)="selectAction('Privacy / 隐私设置')">
                  隐私设置 / Privacy
                </button>
              </mat-menu>
            </section>

            <section class="panel">
              <h2>4. Position / 箭头指向</h2>
              <div class="row">
                <button mat-stroked-button type="button" [matMenuTriggerFor]="leftMenu">
                  左侧菜单 / Left
                </button>
                <button mat-stroked-button type="button" [matMenuTriggerFor]="aboveMenu">
                  上方菜单 / Above
                </button>
              </div>
              <mat-menu #leftMenu="matMenu" xPosition="before">
                <button mat-menu-item type="button">菜单项 A / Menu A</button>
                <button mat-menu-item type="button">菜单项 B / Menu B</button>
              </mat-menu>
              <mat-menu #aboveMenu="matMenu" yPosition="above">
                <button mat-menu-item type="button">菜单项 C / Menu C</button>
                <button mat-menu-item type="button">菜单项 D / Menu D</button>
              </mat-menu>
              <p class="muted">Selected action: <strong>{{ selectedAction() }}</strong></p>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="ContextMenu">
          <div class="tab-pane">
            <section class="panel">
              <h2>Right-click area / 右键菜单</h2>
              <div class="context-area" [matContextMenuTriggerFor]="contextMenu">
                <mat-icon>ads_click</mat-icon>
                <span>Right click here</span>
                <small>在此区域点击鼠标右键</small>
              </div>
              <p class="muted">Last action: <strong>{{ selectedAction() }}</strong></p>
            </section>

            <section class="panel">
              <h2>Menu content / 菜单内容</h2>
              <div class="row">
                <span class="state-pill" [class.on]="bookmarks()">
                  <mat-icon>{{ bookmarks() ? 'bookmark' : 'bookmark_border' }}</mat-icon>
                  Show bookmarks
                </span>
                <span class="state-pill" [class.on]="fullUrls()">
                  <mat-icon>{{ fullUrls() ? 'link' : 'link_off' }}</mat-icon>
                  Show full URLs
                </span>
              </div>
              <ul class="notes">
                <li>Basic items: Back, Reload, Forward (disabled).</li>
                <li>Nested submenu: Copy, Paste, Rename, Developer Tools, Delete.</li>
                <li>Checkable items keep their state while the menu is reopened.</li>
              </ul>
            </section>

            <mat-menu #contextMenu="matMenu">
              <button mat-menu-item type="button" (click)="selectAction('Back / 返回')">
                <mat-icon>arrow_back</mat-icon><span>返回 / Back</span><span class="shortcut">⌘[</span>
              </button>
              <button mat-menu-item type="button" disabled>
                <mat-icon>arrow_forward</mat-icon><span>前进 / Forward</span><span class="shortcut">⌘]</span>
              </button>
              <button mat-menu-item type="button" (click)="selectAction('Reload / 重新加载')">
                <mat-icon>refresh</mat-icon><span>重新加载 / Reload</span><span class="shortcut">⌘R</span>
              </button>
              <mat-divider />
              <button mat-menu-item type="button" [matMenuTriggerFor]="toolsMenu">
                <mat-icon>build</mat-icon><span>More Tools</span><mat-icon class="menu-arrow">chevron_right</mat-icon>
              </button>
              <mat-divider />
              <button mat-menu-item type="button" (click)="toggleBookmarks()">
                <mat-icon>{{ bookmarks() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                <span>显示书签 / Show Bookmarks</span>
              </button>
              <button mat-menu-item type="button" (click)="toggleFullUrls()">
                <mat-icon>{{ fullUrls() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                <span>显示完整 URL / Show Full URLs</span>
              </button>
              <mat-divider />
            </mat-menu>

            <mat-menu #toolsMenu="matMenu">
              <button mat-menu-item type="button" (click)="selectAction('Copy / 复制')">📋 复制 / Copy</button>
              <button mat-menu-item type="button" (click)="selectAction('Paste / 粘贴')">📄 粘贴 / Paste</button>
              <button mat-menu-item type="button" (click)="selectAction('Rename / 重命名')">✏️ 重命名 / Rename</button>
              <mat-divider />
              <button mat-menu-item type="button">Developer Tools</button>
              <mat-divider />
              <button mat-menu-item type="button" (click)="selectAction('Delete / 删除')">❌ 删除 / Delete</button>
            </mat-menu>
          </div>
        </mat-tab>

        <mat-tab label="Sidebar">
          <div class="tab-pane">
            <section class="panel">
              <h2>Embedded sidebar / 内嵌侧边栏</h2>
              <p class="muted">This local sidebar only changes its own content and never touches the app shell.</p>
              <div class="sidebar-shell">
                <aside class="local-sidebar" [class.collapsed]="sidebarCollapsed()">
                  <div class="sidebar-head">
                    @if (!sidebarCollapsed()) {
                      <span class="sidebar-title">Local Menu / 子页面菜单</span>
                    }
                    <button mat-icon-button type="button" aria-label="Toggle sidebar" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
                      <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
                    </button>
                  </div>
                  <mat-nav-list class="sidebar-list">
                    @for (item of sidebarItems; track item.id) {
                      <mat-list-item
                        class="sidebar-item"
                        [class.active-item]="sidebarActive() === item.id"
                        (click)="sidebarActive.set(item.id)"
                      >
                        <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                        @if (!sidebarCollapsed()) {
                          <span matListItemTitle>{{ item.title }}</span>
                        }
                      </mat-list-item>
                    }
                  </mat-nav-list>
                </aside>
                <div class="sidebar-content">
                  <h3>{{ activeSidebarItem().title }}</h3>
                  <p class="muted">{{ activeSidebarItem().description }}</p>
                  <mat-divider />
                  <p>Choose an item in the local menu to update this panel.</p>
                  <p class="muted">The sidebar is fully local and does not interfere with the global navigation.</p>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Collapsed rail / 折叠态</h2>
              <div class="sidebar-shell compact">
                <aside class="local-sidebar rail">
                  @for (item of sidebarItems; track item.id) {
                    <button
                      mat-icon-button
                      type="button"
                      [attr.aria-label]="item.title"
                      [class.active-rail]="sidebarActive() === item.id"
                      (click)="sidebarActive.set(item.id)"
                    >
                      <mat-icon>{{ item.icon }}</mat-icon>
                    </button>
                  }
                </aside>
                <div class="sidebar-content">
                  <p class="muted">A 56px rail keeps the icons visible when there is no room for labels.</p>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Selection / 当前选项</h2>
              <div class="row">
                <span class="state-pill on"><mat-icon>radio_button_checked</mat-icon>{{ activeSidebarItem().title }}</span>
                <button mat-stroked-button type="button" (click)="sidebarActive.set('home')">Reset to Home</button>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="NavigationMenu">
          <div class="tab-pane">
            <section class="panel">
              <h2>Horizontal navigation / 横向导航菜单</h2>
              <div class="nav-bar">
                <button mat-button type="button" [matMenuTriggerFor]="homeMenu">Home <mat-icon>expand_more</mat-icon></button>
                <button mat-button type="button" [matMenuTriggerFor]="componentsMenu">Components <mat-icon>expand_more</mat-icon></button>
                <button mat-button type="button" (click)="selectNav('Docs')">Docs</button>
                <button mat-button type="button" [matMenuTriggerFor]="listMenu">List <mat-icon>expand_more</mat-icon></button>
                <button mat-button type="button" [matMenuTriggerFor]="statusMenu">With Icon <mat-icon>expand_more</mat-icon></button>
              </div>
              <p class="muted">Last selected: <strong>{{ navSelection() }}</strong></p>

              <mat-menu #homeMenu="matMenu">
                <button mat-menu-item type="button" (click)="selectNav('Introduction')">
                  <span class="nav-item-title">Introduction</span>
                  <span class="nav-item-desc">Re-usable components built with Angular Material.</span>
                </button>
                <button mat-menu-item type="button" (click)="selectNav('Installation')">
                  <span class="nav-item-title">Installation</span>
                  <span class="nav-item-desc">How to install dependencies and structure your app.</span>
                </button>
                <button mat-menu-item type="button" (click)="selectNav('Typography')">
                  <span class="nav-item-title">Typography</span>
                  <span class="nav-item-desc">Styles for headings, paragraphs, lists and more.</span>
                </button>
              </mat-menu>

              <mat-menu #componentsMenu="matMenu">
                @for (component of navComponents; track component.title) {
                  <button mat-menu-item type="button" (click)="selectNav(component.title)">
                    <span class="nav-item-title">{{ component.title }}</span>
                    <span class="nav-item-desc">{{ component.description }}</span>
                  </button>
                }
              </mat-menu>

              <mat-menu #listMenu="matMenu">
                <button mat-menu-item type="button" (click)="selectNav('Components list')">
                  <span class="nav-item-title">Components</span>
                  <span class="nav-item-desc">Browse all components in the library.</span>
                </button>
                <button mat-menu-item type="button" (click)="selectNav('Documentation')">
                  <span class="nav-item-title">Documentation</span>
                  <span class="nav-item-desc">Learn how to use the library.</span>
                </button>
                <button mat-menu-item type="button" (click)="selectNav('Blog')">
                  <span class="nav-item-title">Blog</span>
                  <span class="nav-item-desc">Read the latest posts.</span>
                </button>
              </mat-menu>

              <mat-menu #statusMenu="matMenu">
                <button mat-menu-item type="button" (click)="selectNav('Backlog')">
                  <span class="status-pill"><mat-icon>help_outline</mat-icon> Backlog</span>
                </button>
                <button mat-menu-item type="button" (click)="selectNav('To Do')">
                  <span class="status-pill"><mat-icon>radio_button_unchecked</mat-icon> To Do</span>
                </button>
                <button mat-menu-item type="button" (click)="selectNav('Done')">
                  <span class="status-pill done"><mat-icon>check_circle</mat-icon> Done</span>
                </button>
              </mat-menu>
            </section>

            <section class="panel">
              <h2>Component links / 组件链接</h2>
              <div class="link-grid">
                @for (component of navComponents; track component.title) {
                  <button class="link-card" type="button" (click)="selectNav(component.title)">
                    <strong>{{ component.title }}</strong>
                    <span class="muted">{{ component.description }}</span>
                  </button>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Status shortcuts / 状态快捷入口</h2>
              <div class="row">
                @for (status of navStatuses; track status.label) {
                  <button mat-stroked-button type="button" (click)="selectNav(status.label)">
                    <mat-icon>{{ status.icon }}</mat-icon> {{ status.label }}
                  </button>
                }
              </div>
              <p class="muted">Menus use the same Material overlay, so keyboard navigation and Escape work out of the box.</p>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Pagination">
          <div class="tab-pane">
            <section class="panel pagination-center">
              <h2>Pagination example / 分页示例</h2>
              <p class="muted">Current page: {{ page() }} / {{ totalPages }}</p>
              <div class="page-row">
                <button mat-stroked-button type="button" [disabled]="page() === 1" (click)="goTo(page() - 1)">
                  <mat-icon>chevron_left</mat-icon> Prev
                </button>
                @for (item of pages; track item) {
                  <button
                    mat-button
                    type="button"
                    class="page-number"
                    [class.active-page]="page() === item"
                    (click)="goTo(item)"
                  >
                    {{ item }}
                  </button>
                }
                <span class="page-ellipsis">…</span>
                <button mat-stroked-button type="button" [disabled]="page() === totalPages" (click)="goTo(page() + 1)">
                  Next <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              <div class="page-content">
                <p>当前显示第 {{ page() }} 页内容</p>
                <p class="muted">Showing content for page {{ page() }}.</p>
              </div>
            </section>

            <section class="panel">
              <h2>Material paginator</h2>
              <p class="muted">The system list pages reuse this paginator with server-side paging.</p>
              <mat-paginator
                [length]="120"
                [pageSize]="paginatorSize()"
                [pageIndex]="paginatorIndex()"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onPageChange($event)"
                showFirstLastButtons
              />
              <p class="muted mono">pageIndex: {{ paginatorIndex() }} · pageSize: {{ paginatorSize() }}</p>
            </section>

            <section class="panel">
              <h2>Boundary states</h2>
              <div class="row">
                <button mat-stroked-button type="button" (click)="goTo(1)">First page</button>
                <button mat-stroked-button type="button" (click)="goTo(totalPages)">Last page</button>
                <span class="muted">Prev is disabled on page 1; next is disabled on the last page.</span>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Steps">
          <div class="tab-pane">
            <section class="panel">
              <h2>Horizontal steps / 横向步骤</h2>
              <div class="row">
                <button mat-stroked-button type="button" [disabled]="stepIndex() === 0" (click)="stepIndex.set(stepIndex() - 1)">
                  Back
                </button>
                <button mat-flat-button type="button" [disabled]="stepIndex() === 2" (click)="stepIndex.set(stepIndex() + 1)">
                  Next
                </button>
                <span class="muted mono">current: {{ stepIndex() }}</span>
              </div>
              <mat-stepper
                class="step-demo"
                [selectedIndex]="stepIndex()"
                (selectionChange)="onStepChange($event.selectedIndex)"
              >
                <mat-step label="Login / 登录">
                  <p class="muted">Enter the account credentials for the workspace.</p>
                </mat-step>
                <mat-step label="Verify / 验证">
                  <p class="muted">A one-time code confirms the sign-in attempt.</p>
                </mat-step>
                <mat-step label="Done / 完成">
                  <p class="muted">The session is ready and the dashboard can load.</p>
                </mat-step>
              </mat-stepper>
            </section>

            <section class="panel">
              <h2>Vertical steps / 纵向步骤</h2>
              <mat-stepper
                orientation="vertical"
                [selectedIndex]="verticalStep()"
                (selectionChange)="verticalStep.set($event.selectedIndex)"
              >
                <mat-step label="Submit / 提交">
                  <p class="muted">The request is queued for review.</p>
                </mat-step>
                <mat-step label="Review / 审核中">
                  <p class="muted">An approver checks the submitted details.</p>
                </mat-step>
                <mat-step label="Result / 结果">
                  <p class="muted">The final state can be success or an actionable error.</p>
                </mat-step>
              </mat-stepper>
            </section>

            <section class="panel">
              <h2>Linear workflow / 线性流程</h2>
              <mat-stepper linear #linearStepper>
                <mat-step label="Account">
                  <p class="muted">Provide the account identity and organization.</p>
                  <button mat-flat-button type="button" matStepperNext>Next</button>
                </mat-step>
                <mat-step label="Roles">
                  <p class="muted">Select roles; direct permissions are granted separately.</p>
                  <div class="row">
                    <button mat-button type="button" matStepperPrevious>Back</button>
                    <button mat-flat-button type="button" matStepperNext>Next</button>
                  </div>
                </mat-step>
                <mat-step label="Review">
                  <p class="muted">Review and submit. The temporary password is returned once.</p>
                  <div class="row">
                    <button mat-button type="button" matStepperPrevious>Back</button>
                    <button mat-flat-button type="button" (click)="linearStepper.reset()">Finish</button>
                  </div>
                </mat-step>
              </mat-stepper>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Tabs">
          <div class="tab-pane">
            <section class="panel">
              <h2>Basic usage / 基础用法</h2>
              <mat-tab-group class="orange-tabs" animationDuration="120ms">
                <mat-tab label="Tab A 标签 A">
                  <p class="tab-body">内容 A (Content A)</p>
                </mat-tab>
                <mat-tab label="Tab B 标签 B">
                  <p class="tab-body">内容 B (Content B)</p>
                </mat-tab>
              </mat-tab-group>
            </section>

            <section class="panel">
              <h2>Business scenario / 业务场景</h2>
              <mat-tab-group class="orange-tabs" animationDuration="120ms">
                <mat-tab label="Profile 个人信息">
                  <div class="tab-body form-stack">
                    <mat-form-field appearance="outline">
                      <mat-label>Username / 用户名</mat-label>
                      <input matInput placeholder="Username" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Email / 邮箱</mat-label>
                      <input matInput type="email" placeholder="Email" />
                    </mat-form-field>
                    <button mat-flat-button type="button">保存 (Save)</button>
                  </div>
                </mat-tab>
                <mat-tab label="Security 安全设置">
                  <div class="tab-body form-stack">
                    <mat-form-field appearance="outline">
                      <mat-label>New password / 新密码</mat-label>
                      <input matInput type="password" placeholder="New password" />
                    </mat-form-field>
                    <button mat-flat-button color="warn" type="button">修改密码 (Change Password)</button>
                  </div>
                </mat-tab>
                <mat-tab label="Notification 通知设置">
                  <p class="tab-body muted">通知偏好设置内容 (Notification preferences)</p>
                </mat-tab>
              </mat-tab-group>
            </section>

            <section class="panel">
              <h2>Controlled tabs / 受控模式</h2>
              <div class="row">
                <button mat-stroked-button type="button" (click)="innerTab.set(0)">Show Tab 1</button>
                <button mat-stroked-button type="button" (click)="innerTab.set(1)">Show Tab 2</button>
                <span class="muted mono">selectedIndex: {{ innerTab() }}</span>
              </div>
              <mat-tab-group class="orange-tabs"
                animationDuration="120ms"
                [selectedIndex]="innerTab()"
                (selectedIndexChange)="innerTab.set($event)"
              >
                <mat-tab label="Tab 1 标签 1">
                  <p class="tab-body">当前标签：<strong>{{ innerTab() === 0 ? 'Tab 1' : 'Tab 2' }}</strong></p>
                </mat-tab>
                <mat-tab label="Tab 2 标签 2">
                  <p class="tab-body">当前标签：<strong>{{ innerTab() === 0 ? 'Tab 1' : 'Tab 2' }}</strong></p>
                </mat-tab>
              </mat-tab-group>
            </section>

            <section class="panel">
              <h2>Tabs with icons / 带图标的 Tabs</h2>
              <mat-tab-group class="orange-tabs" animationDuration="120ms">
                <mat-tab>
                  <ng-template mat-tab-label><mat-icon class="tab-icon">person</mat-icon> Account</ng-template>
                  <p class="tab-body">账号相关内容 (Account content)</p>
                </mat-tab>
                <mat-tab>
                  <ng-template mat-tab-label><mat-icon class="tab-icon">lock</mat-icon> Security</ng-template>
                  <p class="tab-body">安全相关内容 (Security content)</p>
                </mat-tab>
                <mat-tab>
                  <ng-template mat-tab-label><mat-icon class="tab-icon">notifications</mat-icon> Notify</ng-template>
                  <p class="tab-body">通知相关内容 (Notification content)</p>
                </mat-tab>
              </mat-tab-group>
            </section>

            <section class="panel">
              <h2>Tabs with card / 卡片组合</h2>
              <mat-tab-group class="orange-tabs" animationDuration="120ms">
                <mat-tab label="Logs 日志">
                  <mat-card appearance="outlined" class="tab-card">
                    <mat-card-header>
                      <mat-card-title>系统日志 (System Logs)</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <p class="muted">日志内容展示区域 (Log content area)</p>
                    </mat-card-content>
                  </mat-card>
                </mat-tab>
                <mat-tab label="Settings 设置">
                  <mat-card appearance="outlined" class="tab-card">
                    <mat-card-header>
                      <mat-card-title>系统设置 (System Settings)</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <p class="muted">系统设置内容区域 (System settings area)</p>
                    </mat-card-content>
                  </mat-card>
                </mat-tab>
              </mat-tab-group>
            </section>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .tab-pane {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 12px 2px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 0.95rem;
        font-weight: 600;
      }
      h3 {
        margin: 0 0 6px;
        font-size: 0.9rem;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 8px 0;
      }
      .muted {
        margin: 4px 0;
        color: var(--app-muted-foreground);
        font-size: 0.8rem;
      }
      .notes {
        margin: 8px 0 0;
        padding-left: 1.15rem;
        color: var(--app-muted-foreground);
        font-size: 0.8rem;
        line-height: 1.7;
      }
      .anchor-layout {
        display: flex;
        gap: 18px;
        margin-top: 12px;
      }
      .anchor-nav {
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        gap: 4px;
        width: 150px;
        padding: 8px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
        align-self: flex-start;
      }
      .anchor-link {
        padding: 8px 10px;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        background: transparent;
        color: var(--app-muted-foreground);
        font: inherit;
        font-size: 0.8rem;
        text-align: left;
        cursor: pointer;
      }
      .anchor-link:hover {
        background: var(--app-card);
        color: var(--app-foreground);
      }
      .anchor-link.active {
        border-color: var(--app-border);
        background: var(--app-card);
        color: var(--app-foreground);
        font-weight: 600;
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
      }
      .anchor-scroll {
        position: relative;
        flex: 1;
        min-width: 0;
        height: 420px;
        overflow: auto;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-card);
      }
      .anchor-section {
        min-height: 290px;
        padding: 22px 20px;
        border-bottom: 1px solid var(--app-border);
      }
      .anchor-section:last-child {
        border-bottom: 0;
      }
      .anchor-copy {
        margin: 8px 0;
        color: var(--app-muted-foreground);
        font-size: 0.8rem;
        line-height: 1.7;
      }
      .crumbs {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        font-size: 0.82rem;
      }
      .crumbs a {
        color: var(--app-foreground);
        text-decoration: none;
      }
      .crumbs a:hover {
        text-decoration: underline;
      }
      .crumbs .current {
        font-weight: 600;
      }
      .crumb-sep,
      .home-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-muted-foreground);
      }
      .crumb-slash {
        color: var(--app-muted-foreground);
      }
      .crumb-menu-button {
        min-width: 0;
        padding: 0 4px;
        font-size: 0.82rem;
      }
      .menu-label {
        padding: 6px 14px;
        color: var(--app-muted-foreground);
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .menu-arrow {
        margin-left: auto;
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .context-area {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 190px;
        border: 1px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
        color: var(--app-muted-foreground);
        font-size: 0.85rem;
        user-select: none;
      }
      .context-area mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .context-area small {
        font-size: 0.72rem;
      }
      .shortcut {
        margin-left: auto;
        color: var(--app-muted-foreground);
        font-size: 0.7rem;
      }
      .state-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border: 1px solid var(--app-border);
        border-radius: 999px;
        color: var(--app-muted-foreground);
        font-size: 0.75rem;
      }
      .state-pill.on {
        border-color: color-mix(in srgb, #10b981 45%, var(--app-border));
        background: color-mix(in srgb, #10b981 14%, var(--app-card));
        color: var(--app-foreground);
      }
      .state-pill mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }
      .sidebar-shell {
        display: flex;
        align-items: stretch;
        min-height: 280px;
        margin-top: 10px;
        overflow: hidden;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
      }
      .sidebar-shell.compact {
        min-height: 120px;
      }
      .local-sidebar {
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        width: 220px;
        border-right: 1px solid var(--app-border);
        background: var(--app-muted);
        transition: width 0.18s ease;
      }
      .local-sidebar.collapsed {
        width: 58px;
        --mat-list-list-item-leading-icon-start-space: 17px;
        --mat-list-list-item-leading-icon-end-space: 0px;
      }
      .local-sidebar.rail {
        width: 58px;
        align-items: center;
        gap: 4px;
        padding-top: 10px;
      }
      .sidebar-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        min-height: 44px;
        padding: 4px 6px;
        border-bottom: 1px solid var(--app-border);
      }
      .local-sidebar.collapsed .sidebar-head {
        justify-content: center;
      }
      .sidebar-title {
        font-size: 0.78rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .sidebar-list {
        padding: 4px;
      }
      .sidebar-item {
        height: 38px;
        border-radius: 0.45rem;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .sidebar-item.active-item {
        background: color-mix(in srgb, var(--app-primary) 10%, transparent);
        font-weight: 600;
      }
      .sidebar-item mat-icon {
        color: var(--app-muted-foreground);
      }
      .active-rail {
        background: color-mix(in srgb, var(--app-primary) 12%, transparent);
      }
      .sidebar-content {
        flex: 1;
        min-width: 0;
        padding: 16px;
      }
      .sidebar-content p {
        font-size: 0.8rem;
        line-height: 1.7;
      }
      .nav-bar {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-wrap: wrap;
        margin-top: 8px;
        padding: 6px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-card);
      }
      .nav-bar button {
        font-size: 0.8rem;
      }
      .nav-item-title {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .nav-item-desc {
        display: block;
        max-width: 260px;
        margin-top: 2px;
        color: var(--app-muted-foreground);
        font-size: 0.72rem;
        white-space: normal;
        line-height: 1.35;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 9px;
        border: 1px solid color-mix(in srgb, #10b981 40%, var(--app-border));
        border-radius: 999px;
        background: color-mix(in srgb, #10b981 12%, var(--app-card));
        color: #047857;
        font-size: 0.75rem;
      }
      :host-context(html.dark) .status-pill {
        color: #6ee7b7;
      }
      .status-pill mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }
      .status-pill.done {
        font-weight: 600;
      }
      .link-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      .link-card {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-card);
        color: var(--app-foreground);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .link-card:hover {
        background: var(--app-muted);
      }
      .link-card strong {
        font-size: 0.8rem;
      }
      .link-card .muted {
        margin: 0;
        font-size: 0.72rem;
        line-height: 1.4;
      }
      .pagination-center {
        text-align: center;
      }
      .page-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex-wrap: wrap;
        margin: 12px 0;
      }
      .page-number {
        min-width: 32px;
        padding: 0 6px;
      }
      .page-number.active-page {
        border: 1px solid var(--app-border);
        background: var(--app-muted);
        font-weight: 700;
      }
      .page-ellipsis {
        color: var(--app-muted-foreground);
        padding: 0 2px;
      }
      .page-content {
        max-width: 360px;
        margin: 12px auto 0;
        padding: 14px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
        font-size: 0.8rem;
      }
      .page-content p {
        margin: 2px 0;
      }
      .step-demo {
        margin-top: 8px;
      }
      .form-stack {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        max-width: 360px;
      }
      .form-stack mat-form-field {
        width: 100%;
      }
      .tab-body {
        padding: 16px 4px;
        font-size: 0.82rem;
      }
      .tab-icon {
        margin-right: 5px;
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .tab-card {
        margin: 12px 0;
      }
      @media (max-width: 700px) {
        .anchor-layout {
          flex-direction: column;
        }
        .anchor-nav {
          flex-direction: row;
          width: 100%;
          overflow-x: auto;
        }
        .anchor-scroll {
          height: 340px;
        }
        .local-sidebar {
          width: 170px;
        }
      }
    `,
  ],
})
export class ComponentNavigationComponent {
  readonly activeAnchor = signal('anchor-overview');
  readonly selectedAction = signal('None / 未选择');
  readonly navSelection = signal('Home');
  readonly bookmarks = signal(true);
  readonly fullUrls = signal(false);
  readonly sidebarActive = signal('home');
  readonly sidebarCollapsed = signal(false);
  readonly page = signal(1);
  readonly totalPages = 5;
  readonly pages = [1, 2, 3, 4, 5];
  readonly paginatorIndex = signal(0);
  readonly paginatorSize = signal(10);
  readonly stepIndex = signal(0);
  readonly verticalStep = signal(1);
  readonly innerTab = signal(0);

  readonly anchorSections: AnchorSection[] = [
    {
      id: 'anchor-overview',
      title: 'Overview 概览',
      lead: 'The first anchor section introduces the local scroll container.',
      lines: [
        'This demo uses a dedicated overflow container rather than the window so it fits inside a demo tab.',
        'The left navigation stays visible while the content pane scrolls independently.',
        'Each section has an id; clicking a link scrolls the pane and updates the active highlight.',
        'The scroll handler adds an activation offset so the next section highlights a little early.',
        'The layout is responsive: on narrow screens the navigation becomes a horizontal strip.',
        'No external anchor library is required.',
      ],
    },
    {
      id: 'anchor-details',
      title: 'Details 详情',
      lead: 'The second section carries enough content to demonstrate the scroll-spy.',
      lines: [
        'Anchor navigation is useful for long documentation pages and settings screens.',
        'The links are local buttons, so they never trigger a router navigation.',
        'The active state is derived from the current scroll position, not only from clicks.',
        'Scrolling back up moves the highlight to the previous section automatically.',
        'The pane keeps its own scrollbar and border radius to match the surrounding panels.',
        'Use a similar pattern for a table of contents inside a drawer.',
      ],
    },
    {
      id: 'anchor-usage',
      title: 'Usage 用法',
      lead: 'The third section completes the three-item scroll-spy example.',
      lines: [
        'Keep section ids stable and unique within the page.',
        'Set position: relative on the scroll container so offsetTop is measured from it.',
        'Throttle the scroll handler if the section list grows very large.',
        'For a page-level anchor, listen on the window instead of a local container.',
        'Smooth scrolling is requested through scrollTo with behavior: smooth.',
        'Accessibility: keep the nav labelled and expose the active link visually.',
      ],
    },
  ];

  readonly baseCrumbs: Crumb[] = [
    { key: 'home', label: 'Home', href: '#' },
    { key: 'docs', label: 'Docs', href: '#' },
    { key: 'components', label: 'Components', href: '#' },
    { key: 'breadcrumb', label: 'Breadcrumb', href: '#' },
  ];

  readonly sidebarItems: SidebarItem[] = [
    { id: 'home', title: 'Home / 首页', icon: 'home', description: 'The workspace overview and recent activity.' },
    { id: 'inbox', title: 'Inbox / 收件箱', icon: 'inbox', description: 'Unread messages and review requests.' },
    { id: 'calendar', title: 'Calendar / 日历', icon: 'calendar_today', description: 'Scheduled events and shared team calendars.' },
    { id: 'search', title: 'Search / 搜索', icon: 'search', description: 'Find records across every connected module.' },
    { id: 'settings', title: 'Settings / 设置', icon: 'settings', description: 'Workspace preferences, roles and integrations.' },
  ];

  readonly activeSidebarItem = computed(
    () => this.sidebarItems.find((item) => item.id === this.sidebarActive()) ?? this.sidebarItems[0],
  );

  readonly navComponents = [
    { title: 'Alert Dialog', description: 'A modal dialog that interrupts the user with important content.' },
    { title: 'Hover Card', description: 'Preview content available behind a link.' },
    { title: 'Progress', description: 'Show the completion progress of a task.' },
    { title: 'Scroll Area', description: 'Visually or semantically separate content.' },
    { title: 'Tabs', description: 'Layered sections of content displayed one at a time.' },
    { title: 'Tooltip', description: 'A popup shown on focus or hover.' },
  ];

  readonly navStatuses = [
    { label: 'Backlog', icon: 'help_outline' },
    { label: 'To Do', icon: 'radio_button_unchecked' },
    { label: 'Done', icon: 'check_circle' },
  ];

  onAnchorScroll(event: Event): void {
    const host = event.target as HTMLElement;
    const marker = host.scrollTop + 80;
    for (const section of this.anchorSections) {
      const element = host.querySelector<HTMLElement>(`#${section.id}`);
      if (element && marker >= element.offsetTop && marker < element.offsetTop + element.offsetHeight) {
        this.activeAnchor.set(section.id);
        break;
      }
    }
  }

  goToAnchor(host: HTMLElement, id: string): void {
    this.activeAnchor.set(id);
    const element = host.querySelector<HTMLElement>(`#${id}`);
    if (element) {
      host.scrollTo({ top: Math.max(0, element.offsetTop - 12), behavior: 'smooth' });
    }
  }

  selectAction(label: string): void {
    this.selectedAction.set(label);
  }

  selectNav(label: string): void {
    this.navSelection.set(label);
  }

  toggleBookmarks(): void {
    this.bookmarks.set(!this.bookmarks());
  }

  toggleFullUrls(): void {
    this.fullUrls.set(!this.fullUrls());
  }

  goTo(page: number): void {
    this.page.set(Math.min(this.totalPages, Math.max(1, page)));
  }

  onPageChange(event: PageEvent): void {
    this.paginatorIndex.set(event.pageIndex);
    this.paginatorSize.set(event.pageSize);
  }

  onStepChange(index: number): void {
    this.stepIndex.set(index);
  }
}
