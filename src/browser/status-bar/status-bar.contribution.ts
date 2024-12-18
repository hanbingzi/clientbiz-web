import { Injectable, Autowired } from '@opensumi/di';
import {
  ClientAppContribution,
  Domain,
  IStatusBarService,
  StatusBarAlignment,
  StatusBarEntryAccessor,
} from '@opensumi/ide-core-browser';
import {
  BrowserConnectionCloseEvent,
  BrowserConnectionOpenEvent,
  CommandContribution,
  CommandRegistry,
  OnEvent,
  WithEventBus,
} from '@opensumi/ide-core-common';
import { IconType } from '@opensumi/ide-theme';
import { IconService } from '@opensumi/ide-theme/lib/browser';

const STATUS_BAR_ICON = 'https://img.alicdn.com/imgextra/i1/O1CN01I0fKZ51PTgHByjznG_!!6000000001842-2-tps-40-40.png';

const OPEN_SUMI_REPOSITORY_COMMAND = {
  id: 'opensumi.openRepository',
}

@Injectable()
@Domain(ClientAppContribution, CommandContribution)
export class StatusBarContribution extends WithEventBus implements ClientAppContribution, CommandContribution {

  @Autowired(IconService)
  private iconService: IconService;

  @Autowired(IStatusBarService)
  private statusBarService: IStatusBarService;

  private statusBarElement?: StatusBarEntryAccessor;

  private onDidConnectionChange(text: string | undefined, backgroundColor: string) {
    if (this.statusBarElement) {
      this.statusBarElement.update({
        text,
        backgroundColor,
        alignment: StatusBarAlignment.LEFT,
      });
    }
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(OPEN_SUMI_REPOSITORY_COMMAND, {
      execute: () => {
        window.open('https://www.clientbiz.cn/');
      },
    });
  }

  @OnEvent(BrowserConnectionCloseEvent)
  onDidDisConnect() {
    this.onDidConnectionChange('Disconnected', 'var(--kt-statusbar-offline-background)');
  }

  @OnEvent(BrowserConnectionOpenEvent)
  onDidConnected() {
    this.onDidConnectionChange(undefined, 'var(--button-background)');
  }

  onDidStart() {
    if (!this.statusBarElement) {
      this.statusBarElement = this.statusBarService.addElement('AnyClient', {
        backgroundColor: 'var(--button-background)',
        color: 'var(--foreground)',
        tooltip: 'AnyClient',
        alignment: StatusBarAlignment.LEFT,
        iconClass: this.iconService.fromIcon(undefined, STATUS_BAR_ICON, IconType.Mask),
        priority: Infinity,
        command: OPEN_SUMI_REPOSITORY_COMMAND.id,
      });
    }
  }
}
